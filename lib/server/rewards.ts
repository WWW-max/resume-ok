import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "./db";
import { ApiError } from "./http";

export interface UserReferralRecord {
  id: string;
  maskedEmail: string;
  rewardGranted: boolean;
  createdAt: string;
}

export interface UserFeedbackRecord {
  id: string;
  userId: string | null;
  userEmail: string | null;
  category: string;
  content: string;
  contact: string;
  status: "pending" | "adopted" | "replied";
  adminNote: string;
  rewardedDays: number;
  createdAt: string;
}

export interface UserRewardsOverview {
  referralCode: string | null;
  totalInvited: number;
  currentCycleCount: number;
  nextRewardNeed: number;
  rewardedMonths: number;
  invitedUsers: UserReferralRecord[];
  feedbacks: UserFeedbackRecord[];
}

function maskEmail(email: string): string {
  const trimmed = (email || "").trim();
  const atIndex = trimmed.indexOf("@");
  if (atIndex <= 0) return "***";
  const name = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex);
  if (name.length <= 2) {
    return `${name[0] || "*"}***${domain}`;
  }
  return `${name.slice(0, 2)}***${domain}`;
}

export async function ensureUserReferralCode(userId: string): Promise<string> {
  const existing = await db().query<{ referral_code: string | null }>(
    `SELECT referral_code FROM users WHERE id = $1`,
    [userId],
  );
  if (existing.rows[0]?.referral_code) {
    return existing.rows[0].referral_code;
  }

  const baseCode = userId.replace(/-/g, "").slice(0, 8).toUpperCase();
  const updated = await db().query<{ referral_code: string }>(
    `UPDATE users
        SET referral_code = COALESCE(referral_code, $1)
      WHERE id = $2
      RETURNING referral_code`,
    [baseCode, userId],
  );
  return updated.rows[0]?.referral_code || baseCode;
}

export async function getUserRewardsOverview(
  userId: string | null,
): Promise<UserRewardsOverview> {
  if (!userId) {
    return {
      referralCode: null,
      totalInvited: 0,
      currentCycleCount: 0,
      nextRewardNeed: 3,
      rewardedMonths: 0,
      invitedUsers: [],
      feedbacks: [],
    };
  }

  const referralCode = await ensureUserReferralCode(userId);

  const [referralsRes, feedbackRes] = await Promise.all([
    db().query<{
      id: string;
      invitee_email: string;
      reward_granted: boolean;
      created_at: Date;
    }>(
      `SELECT id, invitee_email, reward_granted, created_at
         FROM user_referrals
        WHERE inviter_id = $1
        ORDER BY created_at DESC
        LIMIT 50`,
      [userId],
    ),
    db().query<{
      id: string;
      user_id: string | null;
      user_email: string | null;
      category: string;
      content: string;
      contact: string;
      status: string;
      admin_note: string;
      rewarded_days: number;
      created_at: Date;
    }>(
      `SELECT id, user_id, user_email, category, content, contact, status, admin_note, rewarded_days, created_at
         FROM user_feedback
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 20`,
      [userId],
    ),
  ]);

  const countRes = await db().query<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM user_referrals WHERE inviter_id = $1`,
    [userId],
  );
  const totalInvited = Number(countRes.rows[0]?.total || 0);
  const currentCycleCount = totalInvited % 3;
  const nextRewardNeed = 3 - currentCycleCount;
  const rewardedMonths = Math.floor(totalInvited / 3);

  return {
    referralCode,
    totalInvited,
    currentCycleCount,
    nextRewardNeed,
    rewardedMonths,
    invitedUsers: referralsRes.rows.map((row) => ({
      id: row.id,
      maskedEmail: maskEmail(row.invitee_email),
      rewardGranted: row.reward_granted,
      createdAt: row.created_at.toISOString(),
    })),
    feedbacks: feedbackRes.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      userEmail: row.user_email,
      category: row.category,
      content: row.content,
      contact: row.contact,
      status: (row.status as "pending" | "adopted" | "replied") || "pending",
      adminNote: row.admin_note || "",
      rewardedDays: Number(row.rewarded_days || 0),
      createdAt: row.created_at.toISOString(),
    })),
  };
}

async function grantUserProDays(
  userId: string,
  days: number,
  channel: string,
  externalRef: string,
): Promise<boolean> {
  const userRes = await db().query<{
    id: string;
    email: string;
    membership_plan: string | null;
    membership_expires_at: Date | null;
  }>(
    `SELECT id, email, membership_plan, membership_expires_at
       FROM users
      WHERE id = $1`,
    [userId],
  );
  const user = userRes.rows[0];
  if (!user) return false;

  const now = new Date();
  const currentExpiry =
    user.membership_expires_at && user.membership_expires_at > now
      ? user.membership_expires_at
      : now;
  const nextExpiry = new Date(
    currentExpiry.getTime() + days * 24 * 60 * 60 * 1000,
  );
  const nextPlan =
    user.membership_plan && user.membership_plan !== "free"
      ? user.membership_plan
      : "monthly";

  await db().query(
    `UPDATE users
        SET membership_plan = $1,
            membership_expires_at = $2,
            updated_at = now()
      WHERE id = $3`,
    [nextPlan, nextExpiry, user.id],
  );

  const orderNo = `RWD${Date.now()}${randomBytes(2).toString("hex").toUpperCase()}`;
  await db().query(
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
    ) VALUES ($1, $2, $3, 'monthly', $4, 0, $5, 'reward_grant', 'paid', $6, now())`,
    [orderNo, user.id, user.email, days, channel, externalRef],
  );

  return true;
}

/**
 * 新用户完成首次注册时记录邀请关系；每累计满 3 人自动为邀请人发放 30 天 PRO 会员
 */
export async function processNewUserReferral(
  newUserId: string,
  newUserEmail: string,
  rawRefCode?: string | null,
): Promise<void> {
  const code = (rawRefCode || "").trim().toUpperCase();
  if (!code || code.length < 4 || code.length > 32) return;

  try {
    const inviterRes = await db().query<{ id: string }>(
      `SELECT id FROM users WHERE referral_code = $1 AND id <> $2 LIMIT 1`,
      [code, newUserId],
    );
    const inviter = inviterRes.rows[0];
    if (!inviter) return;

    const inserted = await db().query<{ id: string }>(
      `INSERT INTO user_referrals (inviter_id, invitee_id, invitee_email)
       VALUES ($1, $2, $3)
       ON CONFLICT (invitee_id) DO NOTHING
       RETURNING id`,
      [inviter.id, newUserId, newUserEmail],
    );
    if (!inserted.rows[0]) return;

    const unrewarded = await db().query<{ id: string }>(
      `SELECT id
         FROM user_referrals
        WHERE inviter_id = $1
          AND reward_granted = false
        ORDER BY created_at ASC
        LIMIT 3`,
      [inviter.id],
    );

    if (unrewarded.rows.length >= 3) {
      const ids = unrewarded.rows.slice(0, 3).map((r) => r.id);
      await db().query(
        `UPDATE user_referrals
            SET reward_granted = true
          WHERE id = ANY($1::uuid[])`,
        [ids],
      );
      await grantUserProDays(
        inviter.id,
        30,
        "referral_reward",
        "邀请满3位好友注册赠送1个月PRO会员",
      );
    }
  } catch (err) {
    console.error("[rewards] processNewUserReferral failed", err);
  }
}

export async function submitUserFeedback(input: {
  userId: string | null;
  userEmail: string | null;
  category?: string;
  content: string;
  contact?: string;
}): Promise<UserFeedbackRecord> {
  const content = (input.content || "").trim();
  if (content.length < 4) {
    throw new ApiError(400, "invalid_content", "请至少输入 4 个字的反馈或建议内容。");
  }
  if (content.length > 2000) {
    throw new ApiError(400, "content_too_long", "反馈内容请控制在 2000 字以内。");
  }

  const category = (input.category || "feature").trim().slice(0, 32) || "feature";
  const contact = (input.contact || "").trim().slice(0, 120);

  const res = await db().query<{
    id: string;
    user_id: string | null;
    user_email: string | null;
    category: string;
    content: string;
    contact: string;
    status: string;
    admin_note: string;
    rewarded_days: number;
    created_at: Date;
  }>(
    `INSERT INTO user_feedback (user_id, user_email, category, content, contact)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id, user_email, category, content, contact, status, admin_note, rewarded_days, created_at`,
    [input.userId, input.userEmail, category, content, contact],
  );
  const row = res.rows[0];
  return {
    id: row.id,
    userId: row.user_id,
    userEmail: row.user_email,
    category: row.category,
    content: row.content,
    contact: row.contact,
    status: (row.status as "pending" | "adopted" | "replied") || "pending",
    adminNote: row.admin_note || "",
    rewardedDays: Number(row.rewarded_days || 0),
    createdAt: row.created_at.toISOString(),
  };
}

export async function listAdminFeedbacks(
  limit = 60,
): Promise<UserFeedbackRecord[]> {
  const res = await db().query<{
    id: string;
    user_id: string | null;
    user_email: string | null;
    category: string;
    content: string;
    contact: string;
    status: string;
    admin_note: string;
    rewarded_days: number;
    created_at: Date;
  }>(
    `SELECT id, user_id, user_email, category, content, contact, status, admin_note, rewarded_days, created_at
       FROM user_feedback
      ORDER BY created_at DESC
      LIMIT $1`,
    [limit],
  );

  return res.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    userEmail: row.user_email,
    category: row.category,
    content: row.content,
    contact: row.contact,
    status: (row.status as "pending" | "adopted" | "replied") || "pending",
    adminNote: row.admin_note || "",
    rewardedDays: Number(row.rewarded_days || 0),
    createdAt: row.created_at.toISOString(),
  }));
}

/**
 * 管理员在后台一键采纳用户建议，自动为该用户赠送 30 天 PRO 会员
 */
export async function adminAdoptFeedback(
  feedbackId: string,
  adminNote?: string,
): Promise<{ feedback: UserFeedbackRecord; grantedToEmail: string | null }> {
  const fbRes = await db().query<{
    id: string;
    user_id: string | null;
    user_email: string | null;
    category: string;
    content: string;
    contact: string;
    status: string;
  }>(
    `SELECT id, user_id, user_email, category, content, contact, status
       FROM user_feedback
      WHERE id = $1`,
    [feedbackId],
  );
  const fb = fbRes.rows[0];
  if (!fb) {
    throw new ApiError(404, "feedback_not_found", "未找到该条反馈记录。");
  }
  if (fb.status === "adopted") {
    throw new ApiError(400, "already_adopted", "该条建议已采纳并发放过奖励。");
  }

  let targetUserId = fb.user_id;
  let grantedToEmail: string | null = fb.user_email;

  if (!targetUserId) {
    const candidateEmail = (fb.user_email || fb.contact || "")
      .trim()
      .toLowerCase();
    if (candidateEmail.includes("@")) {
      const userLookup = await db().query<{ id: string; email: string }>(
        `SELECT id, email FROM users WHERE email = $1 LIMIT 1`,
        [candidateEmail],
      );
      if (userLookup.rows[0]) {
        targetUserId = userLookup.rows[0].id;
        grantedToEmail = userLookup.rows[0].email;
      }
    }
  }

  let rewardedDays = 0;
  if (targetUserId) {
    const granted = await grantUserProDays(
      targetUserId,
      30,
      "feedback_reward",
      "反馈建议被采纳赠送1个月PRO会员",
    );
    if (granted) {
      rewardedDays = 30;
    }
  }

  const note = (adminNote || "感谢您的宝贵建议！已为您赠送 1 个月 PRO 会员。").trim();
  const updated = await db().query<{
    id: string;
    user_id: string | null;
    user_email: string | null;
    category: string;
    content: string;
    contact: string;
    status: string;
    admin_note: string;
    rewarded_days: number;
    created_at: Date;
  }>(
    `UPDATE user_feedback
        SET status = 'adopted',
            admin_note = $1,
            rewarded_days = $2,
            updated_at = now()
      WHERE id = $3
      RETURNING id, user_id, user_email, category, content, contact, status, admin_note, rewarded_days, created_at`,
    [note, rewardedDays, feedbackId],
  );
  const row = updated.rows[0];
  return {
    feedback: {
      id: row.id,
      userId: row.user_id,
      userEmail: row.user_email,
      category: row.category,
      content: row.content,
      contact: row.contact,
      status: "adopted",
      adminNote: row.admin_note || "",
      rewardedDays: Number(row.rewarded_days || 0),
      createdAt: row.created_at.toISOString(),
    },
    grantedToEmail: rewardedDays > 0 ? grantedToEmail : null,
  };
}
