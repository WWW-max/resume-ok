import "server-only";
import { db } from "./db";
import { ApiError } from "./http";
import {
  MEMBERSHIP_PLANS,
  resolveMembershipStatus,
  type MembershipPlan,
  type MembershipStatus,
} from "@/lib/membership";

/**
 * 会员等级优先级权重：
 * 当用户在有效期内叠加兑换不同档位的激活码时（例如原本是年卡，又兑换了一张月卡），
 * 保持较高的等级头衔不变，同时将有效天数顺延累加。
 */
const PLAN_RANK: Record<MembershipPlan, number> = {
  free: 0,
  monthly: 1,
  quarterly: 2,
  yearly: 3,
};

/**
 * 兑换会员激活码核心事务逻辑：
 * 1. 使用 `SELECT ... FOR UPDATE` 锁定激活码行，防止并发重复兑换；
 * 2. 若用户当前会员尚未过期，则在原 `membership_expires_at` 基础上顺延 `duration_days` 天；
 *    若用户为免费版或已过期，则从当前时间 `now()` 起算增加 `duration_days` 天；
 * 3. 标记激活码为已使用，并写入 `membership_orders` 订单流水表（即使用户未来注销账号，订单流水也会脱敏保留供财务对账）。
 */
export async function redeemMembershipCode(
  userId: string,
  userEmail: string,
  rawCode: string,
): Promise<MembershipStatus> {
  const cleanCode = rawCode.trim().toUpperCase();
  if (!cleanCode || cleanCode.length > 64) {
    throw new ApiError(400, "invalid_code", "请输入有效的会员激活码。");
  }

  const client = await db().connect();
  try {
    await client.query("BEGIN");

    const codeResult = await client.query<{
      code: string;
      plan_type: Exclude<MembershipPlan, "free">;
      duration_days: number;
      redeemed_by: string | null;
      redeemed_at: Date | null;
    }>(
      `SELECT code, plan_type, duration_days, redeemed_by, redeemed_at
         FROM redemption_codes
        WHERE code = $1
        FOR UPDATE`,
      [cleanCode],
    );

    const codeRow = codeResult.rows[0];
    if (!codeRow) {
      throw new ApiError(
        404,
        "code_not_found",
        "激活码不存在，请核对后重新输入。",
      );
    }
    if (codeRow.redeemed_at) {
      throw new ApiError(
        409,
        "code_already_used",
        "该激活码已被使用，请勿重复兑换。",
      );
    }

    const userResult = await client.query<{
      membership_plan: string | null;
      membership_expires_at: Date | null;
    }>(
      `SELECT membership_plan, membership_expires_at
         FROM users
        WHERE id = $1
        FOR UPDATE`,
      [userId],
    );

    const userRow = userResult.rows[0];
    if (!userRow) {
      throw new ApiError(404, "user_not_found", "当前用户不存在。");
    }

    const currentStatus = resolveMembershipStatus(
      userRow.membership_plan,
      userRow.membership_expires_at,
    );

    const nextPlan: Exclude<MembershipPlan, "free"> =
      currentStatus.isPro &&
      PLAN_RANK[currentStatus.plan] > PLAN_RANK[codeRow.plan_type]
        ? (currentStatus.plan as Exclude<MembershipPlan, "free">)
        : codeRow.plan_type;

    const updatedUser = await client.query<{
      membership_plan: string;
      membership_expires_at: Date;
    }>(
      `UPDATE users
          SET membership_plan = $2,
              membership_expires_at = GREATEST(COALESCE(membership_expires_at, now()), now()) + ($3 * interval '1 day'),
              updated_at = now()
        WHERE id = $1
      RETURNING membership_plan, membership_expires_at`,
      [userId, nextPlan, codeRow.duration_days],
    );

    await client.query(
      `UPDATE redemption_codes
          SET redeemed_by = $2,
              redeemed_at = now()
        WHERE code = $1`,
      [cleanCode, userId],
    );

    const planMeta = MEMBERSHIP_PLANS.find((p) => p.id === codeRow.plan_type);
    const amountCents = planMeta
      ? Math.round(Number.parseFloat(planMeta.price) * 100)
      : 0;

    await client.query(
      `INSERT INTO membership_orders (
        user_id,
        user_email,
        plan_type,
        duration_days,
        amount_cents,
        channel,
        external_ref
      ) VALUES ($1, $2, $3, $4, $5, 'redemption_code', $6)`,
      [
        userId,
        userEmail,
        codeRow.plan_type,
        codeRow.duration_days,
        amountCents,
        cleanCode,
      ],
    );

    await client.query("COMMIT");

    const finalRow = updatedUser.rows[0];
    return resolveMembershipStatus(
      finalRow.membership_plan,
      finalRow.membership_expires_at,
    );
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
