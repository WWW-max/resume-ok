import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { db } from "./db";
import { ApiError } from "./http";
import {
  MEMBERSHIP_PLANS,
  resolveMembershipStatus,
  type MembershipPlan,
  type MembershipStatus,
  type PaymentMethod,
} from "@/lib/membership";

/**
 * 会员等级优先级权重：
 * 当用户在有效期内叠加购买/兑换不同档位时（例如原本是年卡，又充值了月卡），
 * 保持较高的等级头衔不变，同时将有效天数顺延累加。
 */
const PLAN_RANK: Record<MembershipPlan, number> = {
  free: 0,
  monthly: 1,
  quarterly: 2,
  yearly: 3,
};

export interface CheckoutOrderInfo {
  orderNo: string;
  planType: Exclude<MembershipPlan, "free">;
  planName: string;
  price: string;
  amountCents: number;
  durationDays: number;
  payMethod: PaymentMethod;
  status: "pending" | "paid" | "closed";
  qrUrl: string;
  expiresAt: string;
  isSandbox: boolean;
}

/**
 * 生成唯一商户订单号（如：ROK202610211946A1B2C3）
 */
function generateOrderNo(): string {
  const now = new Date();
  const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate(),
  ).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}${String(
    now.getMinutes(),
  ).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  const rand = randomBytes(3).toString("hex").toUpperCase();
  return `ROK${ts}${rand}`;
}

/**
 * 创建在线支付预订单（支持微信支付 / 支付宝）
 *
 * 渠道模式说明（通过环境变量 `PAYMENT_PROVIDER_MODE` 控制）：
 * - 未配置或设为 `'sandbox'`：默认启用本地开发/演示沙盒收银台，支持一键模拟扫码成功回调；
 * - 设为 `'xunhupay'`（虎皮椒个人免签接口）或 `'official'`（支付宝当面付/微信 Native）：
 *   只需在 `.env.local` 配置 `PAYMENT_APP_ID`、`PAYMENT_APP_SECRET`、`PAYMENT_GATEWAY_URL`，
 *   即可在此处自动请求第三方网关获取真实微信/支付宝二维码链接。
 */
export async function createMembershipCheckoutOrder(
  userId: string,
  userEmail: string,
  rawPlanType: string,
  rawPayMethod: string,
): Promise<CheckoutOrderInfo> {
  const planMeta = MEMBERSHIP_PLANS.find((p) => p.id === rawPlanType);
  if (!planMeta) {
    throw new ApiError(400, "invalid_plan", "请选择有效的会员套餐档位。");
  }
  const payMethod: PaymentMethod =
    rawPayMethod === "alipay" ? "alipay" : "wechat";

  const orderNo = generateOrderNo();
  const amountCents = Math.round(Number.parseFloat(planMeta.price) * 100);
  const providerMode = (
    process.env.PAYMENT_PROVIDER_MODE || "sandbox"
  ).toLowerCase();
  const isSandbox = providerMode === "sandbox";

  let qrUrl = `https://resumeok.cn/pay/${payMethod}?orderNo=${orderNo}&amount=${planMeta.price}`;

  // 如果配置了真实聚合支付网关（例如虎皮椒 XunhuPay / PayJS 通用签名接口），自动发起预下单请求
  if (
    !isSandbox &&
    process.env.PAYMENT_GATEWAY_URL &&
    process.env.PAYMENT_APP_ID &&
    process.env.PAYMENT_APP_SECRET
  ) {
    const appid = process.env.PAYMENT_APP_ID;
    const secret = process.env.PAYMENT_APP_SECRET;
    const notifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/membership/webhook`;
    const nonceStr = randomBytes(8).toString("hex");
    const time = Math.floor(Date.now() / 1000).toString();
    const params: Record<string, string> = {
      version: "1.1",
      appid,
      trade_order_id: orderNo,
      total_fee: planMeta.price,
      title: `ResumeOK ${planMeta.name}`,
      time,
      notify_url: notifyUrl,
      nonce_str: nonceStr,
      type: payMethod === "alipay" ? "alipay" : "WAP",
    };
    const sortedKeys = Object.keys(params).sort();
    const stringA = sortedKeys.map((k) => `${k}=${params[k]}`).join("&");
    params.hash = createHash("md5")
      .update(`${stringA}${secret}`)
      .digest("hex");

    const resp = await fetch(process.env.PAYMENT_GATEWAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = (await resp.json().catch(() => ({}))) as {
      url_qrcode?: string;
      url?: string;
      errmsg?: string;
    };
    if (!resp.ok || (!data.url_qrcode && !data.url)) {
      throw new ApiError(
        502,
        "payment_gateway_error",
        data.errmsg || "支付网关下单失败，请稍后重试或联系客服获取激活码。",
      );
    }
    qrUrl = data.url_qrcode || data.url || qrUrl;
  }

  const inserted = await db().query<{ expires_at: Date }>(
    `INSERT INTO membership_orders (
      order_no,
      user_id,
      user_email,
      plan_type,
      duration_days,
      amount_cents,
      channel,
      pay_method,
      status,
      qr_url,
      expires_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, now() + interval '15 minutes'
    )
    RETURNING expires_at`,
    [
      orderNo,
      userId,
      userEmail,
      planMeta.id,
      planMeta.durationDays,
      amountCents,
      isSandbox ? "sandbox_online" : providerMode,
      payMethod,
      qrUrl,
    ],
  );

  return {
    orderNo,
    planType: planMeta.id,
    planName: planMeta.name,
    price: planMeta.price,
    amountCents,
    durationDays: planMeta.durationDays,
    payMethod,
    status: "pending",
    qrUrl,
    expiresAt: inserted.rows[0].expires_at.toISOString(),
    isSandbox,
  };
}

/**
 * 查询指定订单的实时支付状态（供前端扫码收银台每 2 秒轮询使用）
 */
export async function getMembershipOrderStatus(
  userId: string,
  orderNo: string,
): Promise<{
  orderNo: string;
  status: "pending" | "paid" | "closed";
  paidAt: string | null;
  membership: MembershipStatus;
}> {
  const cleanOrderNo = orderNo.trim();
  const result = await db().query<{
    order_no: string;
    status: "pending" | "paid" | "closed";
    paid_at: Date | null;
    expires_at: Date | null;
    membership_plan: string | null;
    membership_expires_at: Date | null;
  }>(
    `SELECT o.order_no,
            o.status,
            o.paid_at,
            o.expires_at,
            u.membership_plan,
            u.membership_expires_at
       FROM membership_orders o
       JOIN users u ON u.id = o.user_id
      WHERE o.order_no = $1 AND o.user_id = $2`,
    [cleanOrderNo, userId],
  );

  const row = result.rows[0];
  if (!row) {
    throw new ApiError(404, "order_not_found", "未找到该支付订单。");
  }

  let status = row.status;
  if (
    status === "pending" &&
    row.expires_at &&
    row.expires_at.getTime() <= Date.now()
  ) {
    status = "closed";
  }

  return {
    orderNo: row.order_no,
    status,
    paidAt: row.paid_at ? row.paid_at.toISOString() : null,
    membership: resolveMembershipStatus(
      row.membership_plan,
      row.membership_expires_at,
    ),
  };
}

/**
 * 幂等订单发货与会员开通核心函数（Webhook 回调与沙盒模拟支付共用）
 * - 使用 PostgreSQL `SELECT ... FOR UPDATE` 锁定订单行；
 * - 若订单已经是 `paid` 状态，直接返回当前会员状态，绝不重复叠加天数；
 * - 若订单为 `pending` 状态，将其更新为 `paid` 并为对应用户增加会员有效天数。
 */
export async function fulfillMembershipOrder(
  orderNo: string,
  externalTradeNo = "",
): Promise<MembershipStatus> {
  const cleanOrderNo = orderNo.trim();
  if (!cleanOrderNo) {
    throw new ApiError(400, "invalid_order_no", "缺少有效的订单号。");
  }

  const client = await db().connect();
  try {
    await client.query("BEGIN");

    const orderResult = await client.query<{
      id: string;
      user_id: string | null;
      plan_type: Exclude<MembershipPlan, "free">;
      duration_days: number;
      status: string;
    }>(
      `SELECT id, user_id, plan_type, duration_days, status
         FROM membership_orders
        WHERE order_no = $1
        FOR UPDATE`,
      [cleanOrderNo],
    );

    const orderRow = orderResult.rows[0];
    if (!orderRow || !orderRow.user_id) {
      throw new ApiError(404, "order_not_found", "未找到对应的待支付订单。");
    }

    const userResult = await client.query<{
      membership_plan: string | null;
      membership_expires_at: Date | null;
    }>(
      `SELECT membership_plan, membership_expires_at
         FROM users
        WHERE id = $1
        FOR UPDATE`,
      [orderRow.user_id],
    );

    const userRow = userResult.rows[0];
    if (!userRow) {
      throw new ApiError(404, "user_not_found", "订单关联的用户不存在。");
    }

    // 严格幂等保护：已支付订单不重复增加会员时长
    if (orderRow.status === "paid") {
      await client.query("COMMIT");
      return resolveMembershipStatus(
        userRow.membership_plan,
        userRow.membership_expires_at,
      );
    }

    const currentStatus = resolveMembershipStatus(
      userRow.membership_plan,
      userRow.membership_expires_at,
    );

    const nextPlan: Exclude<MembershipPlan, "free"> =
      currentStatus.isPro &&
      PLAN_RANK[currentStatus.plan] > PLAN_RANK[orderRow.plan_type]
        ? (currentStatus.plan as Exclude<MembershipPlan, "free">)
        : orderRow.plan_type;

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
      [orderRow.user_id, nextPlan, orderRow.duration_days],
    );

    await client.query(
      `UPDATE membership_orders
          SET status = 'paid',
              paid_at = now(),
              external_ref = CASE WHEN $2 <> '' THEN $2 ELSE external_ref END
        WHERE id = $1`,
      [orderRow.id, externalTradeNo],
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

/**
 * 兑换会员激活码核心事务逻辑
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
        order_no,
        user_id,
        user_email,
        plan_type,
        duration_days,
        amount_cents,
        channel,
        pay_method,
        status,
        external_ref,
        paid_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'redemption_code', 'redemption_code', 'paid', $7, now())`,
      [
        generateOrderNo(),
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
