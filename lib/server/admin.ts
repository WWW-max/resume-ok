import "server-only";
import { randomBytes } from "node:crypto";
import { db } from "./db";
import { currentUser, type AuthUser } from "./auth";
import { ApiError } from "./http";
import {
  MEMBERSHIP_PLANS,
  resolveMembershipStatus,
  type MembershipPlan,
} from "@/lib/membership";
import { listAdminFeedbacks, type UserFeedbackRecord } from "./rewards";

/**
 * 默认站长管理员白名单邮箱：
 * 可通过环境变量 `ADMIN_EMAILS="a@qq.com,b@domain.com"` 覆盖或追加。
 */
const DEFAULT_ADMIN_EMAILS = ["464711201@qq.com", "service@resumeok.cn"];

export function getAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS || "";
  const extra = raw
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return new Set([...DEFAULT_ADMIN_EMAILS, ...extra]);
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return getAdminEmails().has(email.trim().toLowerCase());
}

/**
 * 校验当前请求是否为管理员：
 * 若未登录或非管理员邮箱，直接抛出 404 Not Found 伪装页面不存在，不暴露后台存在。
 */
export async function requireAdminUser(): Promise<AuthUser> {
  const user = await currentUser();
  if (!user || !isAdminEmail(user.email)) {
    throw new ApiError(404, "not_found", "页面不存在");
  }
  return user;
}

export interface AdminOverviewMetrics {
  totalUsers: number;
  todayUsers: number;
  sevenDayUsers: number;
  activeProUsers: number;
  totalResumes: number;
  onlineResumesCount: number;
  onlineResumeViews: number;
  paidOrderCount: number;
  paidRevenueCents: number;
  redeemedCodeCount: number;
  unusedCodeCount: number;
}

export interface AdminFunnelData {
  rangeDays: number;
  uvCount: number;
  homeViews: number;
  editorOpens: number;
  exportAttempts: number;
  paywallOpens: number;
  contactCsClicks: number;
  checkoutCreates: number;
  paidOrRedeemedOrders: number;
  paywallTriggers: Array<{ trigger: string; count: number }>;
  exportFormats: Array<{ format: string; count: number }>;
  recentEvents: Array<{
    id: string;
    eventName: string;
    userEmail: string | null;
    visitorId: string;
    pagePath: string;
    props: Record<string, unknown>;
    createdAt: string;
  }>;
}

export interface AdminRedemptionCodeItem {
  code: string;
  planType: Exclude<MembershipPlan, "free">;
  durationDays: number;
  batchNote: string;
  redeemedByEmail: string | null;
  redeemedAt: string | null;
  createdAt: string;
}

export interface AdminUserItem {
  id: string;
  email: string;
  membershipPlan: MembershipPlan;
  planLabel: string;
  isPro: boolean;
  membershipExpiresAt: string | null;
  resumeCount: number;
  createdAt: string;
}

export interface AdminOrderItem {
  id: string;
  orderNo: string;
  userEmail: string;
  planType: Exclude<MembershipPlan, "free">;
  durationDays: number;
  amountCents: number;
  channel: string;
  payMethod: string;
  status: string;
  externalRef: string;
  paidAt: string | null;
  createdAt: string;
}

export interface AdminDashboardSnapshot {
  overview: AdminOverviewMetrics;
  funnel: AdminFunnelData;
  codes: AdminRedemptionCodeItem[];
  users: AdminUserItem[];
  orders: AdminOrderItem[];
  feedbacks: UserFeedbackRecord[];
}

export async function getAdminDashboardData(
  rangeDays = 7,
): Promise<AdminDashboardSnapshot> {
  const safeDays = [1, 7, 30, 90].includes(rangeDays) ? rangeDays : 7;
  const pool = db();

  // 1. 核心总览指标
  const [
    userStatsRes,
    resumeStatsRes,
    onlineStatsRes,
    orderStatsRes,
    codeStatsRes,
  ] = await Promise.all([
    pool.query<{
      total_users: string;
      today_users: string;
      seven_day_users: string;
      active_pro_users: string;
    }>(`
      SELECT
        COUNT(*)::text AS total_users,
        COUNT(*) FILTER (WHERE created_at >= date_trunc('day', now()))::text AS today_users,
        COUNT(*) FILTER (WHERE created_at >= now() - interval '7 days')::text AS seven_day_users,
        COUNT(*) FILTER (
          WHERE membership_plan IN ('monthly', 'quarterly', 'yearly')
            AND membership_expires_at > now()
        )::text AS active_pro_users
      FROM users
    `),
    pool.query<{ total_resumes: string }>(`
      SELECT COALESCE(
        SUM(
          CASE
            WHEN jsonb_typeof(library->'documents') = 'array'
            THEN jsonb_array_length(library->'documents')
            ELSE 0
          END
        ),
        0
      )::text AS total_resumes
      FROM resume_libraries
    `),
    pool.query<{ online_count: string; total_views: string }>(`
      SELECT
        (SELECT COUNT(*)::text FROM online_resumes WHERE enabled = true) AS online_count,
        (SELECT COUNT(*)::text FROM online_resume_views) AS total_views
    `),
    pool.query<{ paid_count: string; revenue_cents: string }>(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'paid')::text AS paid_count,
        COALESCE(SUM(amount_cents) FILTER (WHERE status = 'paid'), 0)::text AS revenue_cents
      FROM membership_orders
    `),
    pool.query<{ redeemed_count: string; unused_count: string }>(`
      SELECT
        COUNT(*) FILTER (WHERE redeemed_at IS NOT NULL)::text AS redeemed_count,
        COUNT(*) FILTER (WHERE redeemed_at IS NULL)::text AS unused_count
      FROM redemption_codes
    `),
  ]);

  const uRow = userStatsRes.rows[0];
  const rRow = resumeStatsRes.rows[0];
  const oRow = onlineStatsRes.rows[0];
  const mRow = orderStatsRes.rows[0];
  const cRow = codeStatsRes.rows[0];

  const overview: AdminOverviewMetrics = {
    totalUsers: Number.parseInt(uRow?.total_users || "0", 10),
    todayUsers: Number.parseInt(uRow?.today_users || "0", 10),
    sevenDayUsers: Number.parseInt(uRow?.seven_day_users || "0", 10),
    activeProUsers: Number.parseInt(uRow?.active_pro_users || "0", 10),
    totalResumes: Number.parseInt(rRow?.total_resumes || "0", 10),
    onlineResumesCount: Number.parseInt(oRow?.online_count || "0", 10),
    onlineResumeViews: Number.parseInt(oRow?.total_views || "0", 10),
    paidOrderCount: Number.parseInt(mRow?.paid_count || "0", 10),
    paidRevenueCents: Number.parseInt(mRow?.revenue_cents || "0", 10),
    redeemedCodeCount: Number.parseInt(cRow?.redeemed_count || "0", 10),
    unusedCodeCount: Number.parseInt(cRow?.unused_count || "0", 10),
  };

  // 2. 运营埋点与漏斗数据
  const [
    funnelCountsRes,
    paidInPeriodRes,
    triggerRes,
    exportFormatRes,
    recentEventsRes,
  ] = await Promise.all([
    pool.query<{
      uv_count: string;
      home_view: string;
      editor_open: string;
      export_attempt: string;
      paywall_open: string;
      contact_cs_click: string;
      checkout_create: string;
    }>(
      `
      SELECT
        COUNT(DISTINCT COALESCE(NULLIF(visitor_id, ''), user_id::text))::text AS uv_count,
        COUNT(*) FILTER (WHERE event_name = 'home_view')::text AS home_view,
        COUNT(*) FILTER (WHERE event_name = 'editor_open')::text AS editor_open,
        COUNT(*) FILTER (WHERE event_name = 'export_attempt')::text AS export_attempt,
        COUNT(*) FILTER (WHERE event_name = 'paywall_open')::text AS paywall_open,
        COUNT(*) FILTER (WHERE event_name = 'contact_cs_click')::text AS contact_cs_click,
        COUNT(*) FILTER (WHERE event_name = 'checkout_create')::text AS checkout_create
      FROM analytics_events
      WHERE created_at >= now() - ($1 * interval '1 day')
      `,
      [safeDays],
    ),
    pool.query<{ paid_count: string }>(
      `
      SELECT COUNT(*)::text AS paid_count
      FROM membership_orders
      WHERE status = 'paid'
        AND COALESCE(paid_at, created_at) >= now() - ($1 * interval '1 day')
      `,
      [safeDays],
    ),
    pool.query<{ trigger_label: string; cnt: string }>(
      `
      SELECT
        COALESCE(NULLIF(props->>'trigger', ''), '主动点击升级按钮') AS trigger_label,
        COUNT(*)::text AS cnt
      FROM analytics_events
      WHERE event_name = 'paywall_open'
        AND created_at >= now() - ($1 * interval '1 day')
      GROUP BY trigger_label
      ORDER BY COUNT(*) DESC
      LIMIT 8
      `,
      [safeDays],
    ),
    pool.query<{ format_label: string; cnt: string }>(
      `
      SELECT
        COALESCE(NULLIF(props->>'format', ''), 'pdf') AS format_label,
        COUNT(*)::text AS cnt
      FROM analytics_events
      WHERE event_name = 'export_attempt'
        AND created_at >= now() - ($1 * interval '1 day')
      GROUP BY format_label
      ORDER BY COUNT(*) DESC
      `,
      [safeDays],
    ),
    pool.query<{
      id: string;
      event_name: string;
      user_email: string | null;
      visitor_id: string;
      page_path: string;
      props: Record<string, unknown>;
      created_at: Date;
    }>(
      `
      SELECT
        e.id,
        e.event_name,
        u.email AS user_email,
        e.visitor_id,
        e.page_path,
        e.props,
        e.created_at
      FROM analytics_events e
      LEFT JOIN users u ON u.id = e.user_id
      ORDER BY e.created_at DESC
      LIMIT 30
      `,
    ),
  ]);

  const fRow = funnelCountsRes.rows[0];
  const funnel: AdminFunnelData = {
    rangeDays: safeDays,
    uvCount: Number.parseInt(fRow?.uv_count || "0", 10),
    homeViews: Number.parseInt(fRow?.home_view || "0", 10),
    editorOpens: Number.parseInt(fRow?.editor_open || "0", 10),
    exportAttempts: Number.parseInt(fRow?.export_attempt || "0", 10),
    paywallOpens: Number.parseInt(fRow?.paywall_open || "0", 10),
    contactCsClicks: Number.parseInt(fRow?.contact_cs_click || "0", 10),
    checkoutCreates: Number.parseInt(fRow?.checkout_create || "0", 10),
    paidOrRedeemedOrders: Number.parseInt(
      paidInPeriodRes.rows[0]?.paid_count || "0",
      10,
    ),
    paywallTriggers: triggerRes.rows.map((r) => ({
      trigger: r.trigger_label,
      count: Number.parseInt(r.cnt, 10),
    })),
    exportFormats: exportFormatRes.rows.map((r) => ({
      format: r.format_label,
      count: Number.parseInt(r.cnt, 10),
    })),
    recentEvents: recentEventsRes.rows.map((r) => ({
      id: r.id,
      eventName: r.event_name,
      userEmail: r.user_email,
      visitorId: r.visitor_id,
      pagePath: r.page_path,
      props: r.props || {},
      createdAt: r.created_at.toISOString(),
    })),
  };

  // 3. 激活码列表、用户列表、订单列表
  const [codesRes, usersRes, ordersRes] = await Promise.all([
    pool.query<{
      code: string;
      plan_type: Exclude<MembershipPlan, "free">;
      duration_days: number;
      batch_note: string;
      redeemed_email: string | null;
      redeemed_at: Date | null;
      created_at: Date;
    }>(`
      SELECT
        c.code,
        c.plan_type,
        c.duration_days,
        c.batch_note,
        u.email AS redeemed_email,
        c.redeemed_at,
        c.created_at
      FROM redemption_codes c
      LEFT JOIN users u ON u.id = c.redeemed_by
      ORDER BY c.created_at DESC, c.code ASC
      LIMIT 100
    `),
    pool.query<{
      id: string;
      email: string;
      membership_plan: string | null;
      membership_expires_at: Date | null;
      resume_count: number;
      created_at: Date;
    }>(`
      SELECT
        u.id,
        u.email,
        u.membership_plan,
        u.membership_expires_at,
        COALESCE(
          CASE
            WHEN jsonb_typeof(rl.library->'documents') = 'array'
            THEN jsonb_array_length(rl.library->'documents')
            ELSE 0
          END,
          0
        ) AS resume_count,
        u.created_at
      FROM users u
      LEFT JOIN resume_libraries rl ON rl.user_id = u.id
      ORDER BY u.created_at DESC
      LIMIT 100
    `),
    pool.query<{
      id: string;
      order_no: string | null;
      user_email: string;
      plan_type: Exclude<MembershipPlan, "free">;
      duration_days: number;
      amount_cents: number;
      channel: string;
      pay_method: string;
      status: string;
      external_ref: string;
      paid_at: Date | null;
      created_at: Date;
    }>(`
      SELECT
        id,
        order_no,
        user_email,
        plan_type,
        duration_days,
        amount_cents,
        channel,
        pay_method,
        status,
        external_ref,
        paid_at,
        created_at
      FROM membership_orders
      ORDER BY created_at DESC
      LIMIT 100
    `),
  ]);

  const codes: AdminRedemptionCodeItem[] = codesRes.rows.map((r) => ({
    code: r.code,
    planType: r.plan_type,
    durationDays: r.duration_days,
    batchNote: r.batch_note,
    redeemedByEmail: r.redeemed_email,
    redeemedAt: r.redeemed_at ? r.redeemed_at.toISOString() : null,
    createdAt: r.created_at.toISOString(),
  }));

  const users: AdminUserItem[] = usersRes.rows.map((r) => {
    const status = resolveMembershipStatus(
      r.membership_plan,
      r.membership_expires_at,
    );
    return {
      id: r.id,
      email: r.email,
      membershipPlan: status.plan,
      planLabel: status.planLabel,
      isPro: status.isPro,
      membershipExpiresAt: status.expiresAt,
      resumeCount: Number(r.resume_count || 0),
      createdAt: r.created_at.toISOString(),
    };
  });

  const orders: AdminOrderItem[] = ordersRes.rows.map((r) => ({
    id: r.id,
    orderNo: r.order_no || "-",
    userEmail: r.user_email,
    planType: r.plan_type,
    durationDays: r.duration_days,
    amountCents: r.amount_cents,
    channel: r.channel,
    payMethod: r.pay_method,
    status: r.status,
    externalRef: r.external_ref,
    paidAt: r.paid_at ? r.paid_at.toISOString() : null,
    createdAt: r.created_at.toISOString(),
  }));

  const feedbacks = await listAdminFeedbacks(60).catch(() => []);

  return {
    overview,
    funnel,
    codes,
    users,
    orders,
    feedbacks,
  };
}

const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function randomSegment(len = 4): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) {
    out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return out;
}

/**
 * 在管理后台批量生成会员激活码并入库
 */
export async function generateRedemptionCodesBatch(
  rawPlanType: string,
  rawCount: number,
  rawNote: string,
): Promise<AdminRedemptionCodeItem[]> {
  const planMeta = MEMBERSHIP_PLANS.find((p) => p.id === rawPlanType);
  if (!planMeta) {
    throw new ApiError(400, "invalid_plan", "请选择有效的套餐类型。");
  }
  const count = Math.min(Math.max(Math.floor(rawCount || 1), 1), 50);
  const note = (rawNote || "").trim().slice(0, 120) || `后台手动生成${planMeta.name}`;
  const prefix =
    planMeta.id === "monthly"
      ? "ROK-M30"
      : planMeta.id === "quarterly"
        ? "ROK-Q90"
        : "ROK-Y365";

  const created: AdminRedemptionCodeItem[] = [];
  for (let i = 0; i < count; i++) {
    const code = `${prefix}-${randomSegment(4)}-${randomSegment(4)}`;
    const res = await db().query<{ created_at: Date }>(
      `INSERT INTO redemption_codes (code, plan_type, duration_days, batch_note)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (code) DO NOTHING
       RETURNING created_at`,
      [code, planMeta.id, planMeta.durationDays, note],
    );
    if (res.rows[0]) {
      created.push({
        code,
        planType: planMeta.id,
        durationDays: planMeta.durationDays,
        batchNote: note,
        redeemedByEmail: null,
        redeemedAt: null,
        createdAt: res.rows[0].created_at.toISOString(),
      });
    }
  }
  return created;
}

/**
 * 管理员在后台直接为指定邮箱用户开通/顺延或重置会员身份
 */
export async function adminUpdateUserMembership(
  targetEmail: string,
  actionPlan: MembershipPlan,
): Promise<AdminUserItem> {
  const normalizedEmail = targetEmail.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new ApiError(400, "invalid_email", "请输入有效的用户邮箱。");
  }

  const userRes = await db().query<{
    id: string;
    email: string;
    membership_plan: string | null;
    membership_expires_at: Date | null;
    created_at: Date;
  }>(
    `SELECT id, email, membership_plan, membership_expires_at, created_at
       FROM users
      WHERE email = $1`,
    [normalizedEmail],
  );
  const user = userRes.rows[0];
  if (!user) {
    throw new ApiError(404, "user_not_found", "未找到该邮箱对应的注册用户。");
  }

  if (actionPlan === "free") {
    await db().query(
      `UPDATE users
          SET membership_plan = 'free',
              membership_expires_at = NULL,
              updated_at = now()
        WHERE id = $1`,
      [user.id],
    );
  } else {
    const planMeta = MEMBERSHIP_PLANS.find((p) => p.id === actionPlan);
    if (!planMeta) {
      throw new ApiError(400, "invalid_plan", "无效的会员套餐类型。");
    }
    const now = new Date();
    const currentExpiry =
      user.membership_expires_at && user.membership_expires_at > now
        ? user.membership_expires_at
        : now;
    const nextExpiry = new Date(
      currentExpiry.getTime() + planMeta.durationDays * 24 * 60 * 60 * 1000,
    );

    await db().query(
      `UPDATE users
          SET membership_plan = $1,
              membership_expires_at = $2,
              updated_at = now()
        WHERE id = $3`,
      [planMeta.id, nextExpiry, user.id],
    );

    const adminOrderNo = `ADM${Date.now()}${randomBytes(2).toString("hex").toUpperCase()}`;
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
      ) VALUES ($1, $2, $3, $4, $5, 0, 'admin_grant', 'admin_manual', 'paid', '管理员后台手动开通', now())`,
      [adminOrderNo, user.id, user.email, planMeta.id, planMeta.durationDays],
    );
  }

  const refreshed = await db().query<{
    id: string;
    email: string;
    membership_plan: string | null;
    membership_expires_at: Date | null;
    created_at: Date;
  }>(
    `SELECT id, email, membership_plan, membership_expires_at, created_at
       FROM users
      WHERE id = $1`,
    [user.id],
  );
  const row = refreshed.rows[0];
  const status = resolveMembershipStatus(
    row.membership_plan,
    row.membership_expires_at,
  );
  return {
    id: row.id,
    email: row.email,
    membershipPlan: status.plan,
    planLabel: status.planLabel,
    isPro: status.isPro,
    membershipExpiresAt: status.expiresAt,
    resumeCount: 0,
    createdAt: row.created_at.toISOString(),
  };
}
