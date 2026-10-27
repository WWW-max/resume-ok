"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Check,
  Copy,
  CreditCard,
  Crown,
  FileText,
  Filter,
  Globe,
  KeyRound,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { Brand } from "@/components/Brand";
import {
  MEMBERSHIP_PLANS,
  formatMembershipExpiry,
  type MembershipPlan,
} from "@/lib/membership";
import type {
  AdminDashboardSnapshot,
  AdminRedemptionCodeItem,
} from "@/lib/server/admin";

type AdminTabId = "overview" | "analytics" | "codes" | "users" | "orders";

const EVENT_LABELS: Record<string, string> = {
  home_view: "访问官网首页",
  editor_open: "进入简历编辑器",
  export_attempt: "点击导出简历",
  paywall_open: "弹出会员收银台",
  contact_cs_click: "点击/复制客服微信",
  checkout_create: "发起扫码支付订单",
};

const PLAN_BADGE_MAP: Record<string, string> = {
  free: "免费版",
  monthly: "月度会员 (30天)",
  quarterly: "季度会员 (90天)",
  yearly: "年度会员 (365天)",
};

function formatDateTime(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes(),
  ).padStart(2, "0")}`;
}

function formatYuan(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`;
}

export function AdminDashboardClient({
  adminEmail,
  initialData,
}: {
  adminEmail: string;
  initialData: AdminDashboardSnapshot;
}) {
  const [data, setData] = useState<AdminDashboardSnapshot>(initialData);
  const [activeTab, setActiveTab] = useState<AdminTabId>("overview");
  const [rangeDays, setRangeDays] = useState<number>(
    initialData.funnel.rangeDays || 7,
  );
  const [loading, setLoading] = useState(false);

  // 激活码生成状态
  const [genPlan, setGenPlan] =
    useState<Exclude<MembershipPlan, "free">>("quarterly");
  const [genCount, setGenCount] = useState<number>(5);
  const [genNote, setGenNote] = useState<string>("");
  const [generatingCodes, setGeneratingCodes] = useState(false);
  const [newlyGeneratedCodes, setNewlyGeneratedCodes] = useState<
    AdminRedemptionCodeItem[]
  >([]);
  const [codeFilter, setCodeFilter] = useState<"all" | "unused" | "redeemed">(
    "all",
  );
  const [copiedKey, setCopiedKey] = useState<string>("");

  // 用户管理状态
  const [userSearch, setUserSearch] = useState("");
  const [grantEmail, setGrantEmail] = useState("");
  const [grantPlan, setGrantPlan] = useState<MembershipPlan>("quarterly");
  const [grantingUser, setGrantingUser] = useState(false);
  const [actionNotice, setActionNotice] = useState("");
  const [actionError, setActionError] = useState("");

  async function refreshDashboard(days = rangeDays) {
    setLoading(true);
    setActionError("");
    try {
      const res = await fetch(`/api/admin/dashboard?days=${days}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("刷新后台数据失败");
      const next = (await res.json()) as AdminDashboardSnapshot;
      setData(next);
      setRangeDays(days);
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "刷新数据失败，请重试",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyText(text: string, key: string) {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? "" : prev));
    }, 2000);
  }

  async function handleGenerateCodes(e: React.FormEvent) {
    e.preventDefault();
    if (generatingCodes) return;
    setGeneratingCodes(true);
    setActionError("");
    setActionNotice("");
    try {
      const res = await fetch("/api/admin/codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType: genPlan,
          count: genCount,
          batchNote: genNote,
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        codes?: AdminRedemptionCodeItem[];
        error?: { message?: string };
      };
      if (!res.ok || !payload.codes) {
        throw new Error(payload.error?.message || "生成激活码失败");
      }
      setNewlyGeneratedCodes(payload.codes);
      setActionNotice(`成功生成 ${payload.codes.length} 个激活码！`);
      await refreshDashboard(rangeDays);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "生成激活码失败");
    } finally {
      setGeneratingCodes(false);
    }
  }

  async function handleGrantMembership(
    targetEmail: string,
    plan: MembershipPlan,
  ) {
    if (!targetEmail.trim() || grantingUser) return;
    setGrantingUser(true);
    setActionError("");
    setActionNotice("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail.trim(), plan }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        user?: { email: string; planLabel: string };
        error?: { message?: string };
      };
      if (!res.ok || !payload.user) {
        throw new Error(payload.error?.message || "更新用户会员状态失败");
      }
      setActionNotice(
        `已将用户 ${payload.user.email} 更新为：${payload.user.planLabel}`,
      );
      setGrantEmail("");
      await refreshDashboard(rangeDays);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "操作失败");
    } finally {
      setGrantingUser(false);
    }
  }

  const { overview, funnel, codes, users, orders } = data;

  const filteredCodes = codes.filter((item) => {
    if (codeFilter === "unused") return !item.redeemedAt;
    if (codeFilter === "redeemed") return Boolean(item.redeemedAt);
    return true;
  });

  const filteredUsers = users.filter((u) =>
    userSearch.trim()
      ? u.email.toLowerCase().includes(userSearch.trim().toLowerCase())
      : true,
  );

  // 漏斗转化率计算基准
  const maxFunnelVal = Math.max(
    funnel.homeViews,
    funnel.editorOpens,
    funnel.paywallOpens,
    1,
  );
  const funnelSteps = [
    {
      label: "1. 访问官网首页 (home_view)",
      count: funnel.homeViews,
      desc: "落地页曝光人次",
    },
    {
      label: "2. 进入简历工作台 (editor_open)",
      count: funnel.editorOpens,
      desc: "开始编辑或浏览模板",
    },
    {
      label: "3. 尝试导出简历 (export_attempt)",
      count: funnel.exportAttempts,
      desc: "点击导出 PDF / Word / 长图 / MD",
    },
    {
      label: "4. 触发会员收银台 (paywall_open)",
      count: funnel.paywallOpens,
      desc: "遇到会员卡点或主动点击升级 PRO",
    },
    {
      label: "5. 意向转化动作 (客服咨询 + 发起扫码订单)",
      count: funnel.contactCsClicks + funnel.checkoutCreates,
      desc: `联系客服 ${funnel.contactCsClicks} 次 / 扫码下单 ${funnel.checkoutCreates} 次`,
    },
    {
      label: "6. 成功开通会员 (成交/兑换入账)",
      count: funnel.paidOrRedeemedOrders,
      desc: "周期内已完成支付或激活码兑换单数",
    },
  ];

  const tabs: Array<{ id: AdminTabId; label: string; badge?: number }> = [
    { id: "overview", label: "核心总览" },
    { id: "analytics", label: "运营埋点与漏斗" },
    { id: "codes", label: "激活码发卡", badge: overview.unusedCodeCount },
    { id: "users", label: "用户与会员", badge: overview.totalUsers },
    { id: "orders", label: "订单流水", badge: orders.length },
  ];

  return (
    <div className="min-h-screen bg-[#f6faf7] text-ink">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-30 border-b border-[#d9ece0] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Link href="/" className="shrink-0">
              <Brand />
            </Link>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#bce6cb] bg-[#eaf9f0] px-2 py-0.5 text-[11px] font-bold text-[#0d853d] sm:px-2.5 sm:text-xs">
              <ShieldCheck size={13} />
              <span className="hidden min-[400px]:inline">Admin </span>运营中台
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs sm:gap-2.5">
            <span className="hidden rounded-lg bg-[#f2fbf6] px-2.5 py-1.5 font-medium text-[#255c39] md:inline-block">
              管理员：{adminEmail}
            </span>
            <button
              type="button"
              onClick={() => void refreshDashboard(rangeDays)}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#cde8d6] bg-white px-2.5 py-1.5 font-semibold text-[#184d2b] transition-colors hover:bg-[#f2fbf6] disabled:opacity-60 sm:px-3"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              <span>
                刷新<span className="hidden min-[440px]:inline">数据</span>
              </span>
            </button>
            <Link
              href="/editor"
              className="inline-flex items-center gap-1 rounded-lg bg-brand px-2.5 py-1.5 font-semibold text-white transition-colors hover:bg-brand-dark sm:px-3"
            >
              <ArrowLeft size={13} />
              <span>返回工作台</span>
            </Link>
          </div>
        </div>

        {/* 二级 Tab 切换栏 */}
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setActionError("");
                  setActionNotice("");
                }}
                className={`relative flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors sm:text-sm ${
                  active
                    ? "border-brand text-brand"
                    : "border-transparent text-muted-ink hover:text-ink"
                }`}
              >
                <span>{tab.label}</span>
                {typeof tab.badge === "number" && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[11px] ${
                      active
                        ? "bg-[#e3f7ec] text-[#0d853d]"
                        : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* 全局操作反馈提示 */}
        {actionNotice && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-[#bce6cb] bg-[#eaf9f0] px-4 py-2.5 text-xs font-semibold text-[#0d853d]">
            <span>{actionNotice}</span>
            <button
              type="button"
              onClick={() => setActionNotice("")}
              className="text-[#0d853d] hover:underline"
            >
              关闭
            </button>
          </div>
        )}
        {actionError && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700">
            <span>{actionError}</span>
            <button
              type="button"
              onClick={() => setActionError("")}
              className="text-red-700 hover:underline"
            >
              关闭
            </button>
          </div>
        )}

        {/* ==================== 1. 核心总览看板 ==================== */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* 6 张核心指标卡片 */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-2xl border border-[#d8eee0] bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-ink">
                    累计注册用户
                  </span>
                  <span className="grid size-8 place-items-center rounded-xl bg-[#eaf9f0] text-[#0cb449]">
                    <Users size={16} />
                  </span>
                </div>
                <p className="mt-2 text-2xl font-extrabold text-ink">
                  {overview.totalUsers}
                </p>
                <p className="mt-1 text-xs text-muted-ink">
                  今日新增{" "}
                  <strong className="text-[#0d853d]">
                    +{overview.todayUsers}
                  </strong>{" "}
                  · 近 7 日新增{" "}
                  <strong className="text-[#0d853d]">
                    +{overview.sevenDayUsers}
                  </strong>
                </p>
              </div>

              <div className="rounded-2xl border border-[#d8eee0] bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-ink">
                    当前有效 PRO 会员
                  </span>
                  <span className="grid size-8 place-items-center rounded-xl bg-[#eaf9f0] text-[#0cb449]">
                    <Crown size={16} />
                  </span>
                </div>
                <p className="mt-2 text-2xl font-extrabold text-[#0d853d]">
                  {overview.activeProUsers}
                </p>
                <p className="mt-1 text-xs text-muted-ink">
                  付费渗透率{" "}
                  <strong className="text-ink">
                    {overview.totalUsers > 0
                      ? `${((overview.activeProUsers / overview.totalUsers) * 100).toFixed(1)}%`
                      : "0.0%"}
                  </strong>
                </p>
              </div>

              <div className="rounded-2xl border border-[#d8eee0] bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-ink">
                    累计订单收入 & 兑换单数
                  </span>
                  <span className="grid size-8 place-items-center rounded-xl bg-[#eaf9f0] text-[#0cb449]">
                    <CreditCard size={16} />
                  </span>
                </div>
                <p className="mt-2 text-2xl font-extrabold text-ink">
                  {formatYuan(overview.paidRevenueCents)}
                </p>
                <p className="mt-1 text-xs text-muted-ink">
                  累计成交/兑换{" "}
                  <strong className="text-[#0d853d]">
                    {overview.paidOrderCount}
                  </strong>{" "}
                  单 · 已核销激活码{" "}
                  <strong className="text-[#0d853d]">
                    {overview.redeemedCodeCount}
                  </strong>{" "}
                  个
                </p>
              </div>

              <div className="rounded-2xl border border-[#d8eee0] bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-ink">
                    近 {funnel.rangeDays} 天活跃访客 (UV)
                  </span>
                  <span className="grid size-8 place-items-center rounded-xl bg-[#eaf9f0] text-[#0cb449]">
                    <Activity size={16} />
                  </span>
                </div>
                <p className="mt-2 text-2xl font-extrabold text-ink">
                  {funnel.uvCount}
                </p>
                <p className="mt-1 text-xs text-muted-ink">
                  首页访问 {funnel.homeViews} 次 · 工作台打开{" "}
                  {funnel.editorOpens} 次
                </p>
              </div>

              <div className="rounded-2xl border border-[#d8eee0] bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-ink">
                    云端存储简历总数
                  </span>
                  <span className="grid size-8 place-items-center rounded-xl bg-[#eaf9f0] text-[#0cb449]">
                    <FileText size={16} />
                  </span>
                </div>
                <p className="mt-2 text-2xl font-extrabold text-ink">
                  {overview.totalResumes}
                </p>
                <p className="mt-1 text-xs text-muted-ink">
                  人均创建{" "}
                  {overview.totalUsers > 0
                    ? (overview.totalResumes / overview.totalUsers).toFixed(1)
                    : "0"}{" "}
                  份简历
                </p>
              </div>

              <div className="rounded-2xl border border-[#d8eee0] bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-ink">
                    在线简历分享 & 浏览
                  </span>
                  <span className="grid size-8 place-items-center rounded-xl bg-[#eaf9f0] text-[#0cb449]">
                    <Globe size={16} />
                  </span>
                </div>
                <p className="mt-2 text-2xl font-extrabold text-ink">
                  {overview.onlineResumesCount}{" "}
                  <span className="text-xs font-normal text-muted-ink">
                    份开启中
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-ink">
                  累计被 HR / 访客浏览{" "}
                  <strong className="text-[#0d853d]">
                    {overview.onlineResumeViews}
                  </strong>{" "}
                  次
                </p>
              </div>
            </div>

            {/* 快捷操作卡片 + 漏斗速览 */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-[#d8eee0] bg-white p-5">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
                    <KeyRound size={16} className="text-[#0cb449]" />
                    快速生成客服激活码（发卡台）
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab("codes")}
                    className="text-xs font-semibold text-[#0d853d] hover:underline"
                  >
                    查看全部激活码 ({codes.length}) →
                  </button>
                </div>
                <form
                  onSubmit={(e) => void handleGenerateCodes(e)}
                  className="mt-4 space-y-3"
                >
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-muted-ink">
                        套餐类型
                      </label>
                      <select
                        value={genPlan}
                        onChange={(e) =>
                          setGenPlan(
                            e.target.value as Exclude<MembershipPlan, "free">,
                          )
                        }
                        className="mt-1 w-full rounded-xl border border-[#cfead9] bg-[#f9fdfb] px-3 py-2 text-xs font-semibold text-ink focus:border-brand focus:outline-none"
                      >
                        {MEMBERSHIP_PLANS.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} (¥{p.price} / {p.durationDays}天)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-muted-ink">
                        生成数量 (1-50)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={genCount}
                        onChange={(e) =>
                          setGenCount(Number(e.target.value || 1))
                        }
                        className="mt-1 w-full rounded-xl border border-[#cfead9] bg-[#f9fdfb] px-3 py-2 text-xs font-semibold text-ink focus:border-brand focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-muted-ink">
                        批次备注
                      </label>
                      <input
                        type="text"
                        value={genNote}
                        onChange={(e) => setGenNote(e.target.value)}
                        placeholder="如：微信客户发卡"
                        className="mt-1 w-full rounded-xl border border-[#cfead9] bg-[#f9fdfb] px-3 py-2 text-xs text-ink focus:border-brand focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={generatingCodes}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
                  >
                    <Plus size={14} />
                    {generatingCodes ? "正在生成…" : "立即生成激活码"}
                  </button>
                </form>

                {newlyGeneratedCodes.length > 0 && (
                  <div className="mt-4 rounded-xl border border-[#bce6cb] bg-[#f2fbf6] p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#134726]">
                        本次新生成激活码（共 {newlyGeneratedCodes.length} 个）：
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          void handleCopyText(
                            newlyGeneratedCodes.map((c) => c.code).join("\n"),
                            "batch-new",
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-md bg-brand px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-brand-dark"
                      >
                        {copiedKey === "batch-new" ? (
                          <Check size={12} />
                        ) : (
                          <Copy size={12} />
                        )}
                        {copiedKey === "batch-new" ? "已全部复制" : "一键复制全部"}
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {newlyGeneratedCodes.map((item) => (
                        <button
                          key={item.code}
                          type="button"
                          onClick={() =>
                            void handleCopyText(item.code, item.code)
                          }
                          className="inline-flex items-center gap-1 rounded-md border border-[#cdebd9] bg-white px-2 py-1 font-mono text-xs font-bold text-[#0d853d] hover:bg-[#eaf9f0]"
                        >
                          <span>{item.code}</span>
                          {copiedKey === item.code ? (
                            <Check size={11} />
                          ) : (
                            <Copy size={11} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[#d8eee0] bg-white p-5">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
                    <Sparkles size={16} className="text-[#0cb449]" />
                    手动为用户开通/顺延 PRO 会员
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab("users")}
                    className="text-xs font-semibold text-[#0d853d] hover:underline"
                  >
                    管理全部用户 ({users.length}) →
                  </button>
                </div>
                <p className="mt-1 text-xs text-muted-ink">
                  无需发送激活码，输入客户注册邮箱即可直接为其开通或顺延会员时长。
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void handleGrantMembership(grantEmail, grantPlan);
                  }}
                  className="mt-4 space-y-3"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-muted-ink">
                        用户登录邮箱
                      </label>
                      <input
                        type="email"
                        required
                        value={grantEmail}
                        onChange={(e) => setGrantEmail(e.target.value)}
                        placeholder="user@example.com"
                        className="mt-1 w-full rounded-xl border border-[#cfead9] bg-[#f9fdfb] px-3 py-2 text-xs text-ink focus:border-brand focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-muted-ink">
                        变更会员档位
                      </label>
                      <select
                        value={grantPlan}
                        onChange={(e) =>
                          setGrantPlan(e.target.value as MembershipPlan)
                        }
                        className="mt-1 w-full rounded-xl border border-[#cfead9] bg-[#f9fdfb] px-3 py-2 text-xs font-semibold text-ink focus:border-brand focus:outline-none"
                      >
                        <option value="monthly">开通/顺延 月卡 (+30天)</option>
                        <option value="quarterly">开通/顺延 季卡 (+90天)</option>
                        <option value="yearly">开通/顺延 年卡 (+365天)</option>
                        <option value="free">重置为 免费版</option>
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={grantingUser}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
                  >
                    <Crown size={14} />
                    {grantingUser ? "正在执行…" : "立即执行会员变更"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 2. 运营埋点与转化漏斗 ==================== */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* 时间范围筛选栏 */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d8eee0] bg-white p-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-[#0cb449]" />
                <div>
                  <h2 className="text-sm font-bold text-ink">
                    全链路运营转化漏斗 & 付费卡点归因
                  </h2>
                  <p className="text-xs text-muted-ink">
                    实时统计访客从进入首页、编辑简历、触发会员弹窗到联系客服或下单的转化表现
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 7, 30, 90].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => void refreshDashboard(d)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                      rangeDays === d
                        ? "bg-brand text-white"
                        : "border border-[#d8eee0] bg-[#f9fdfb] text-ink hover:bg-[#eaf9f0]"
                    }`}
                  >
                    {d === 1 ? "今日 (24h)" : `近 ${d} 天`}
                  </button>
                ))}
              </div>
            </div>

            {/* 转化漏斗可视化 */}
            <div className="rounded-2xl border border-[#d8eee0] bg-white p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-ink">
                核心转化漏斗（近 {funnel.rangeDays} 天 · 独立访客 UV:{" "}
                {funnel.uvCount}）
              </h3>
              <div className="mt-4 space-y-3.5">
                {funnelSteps.map((step, idx) => {
                  const pct = Math.min(
                    100,
                    Math.max(
                      step.count > 0 ? 4 : 0,
                      Math.round((step.count / maxFunnelVal) * 100),
                    ),
                  );
                  const prevCount =
                    idx > 0 ? funnelSteps[idx - 1].count : step.count;
                  const stepRate =
                    idx > 0 && prevCount > 0
                      ? `${Math.round((step.count / prevCount) * 100)}%`
                      : null;

                  return (
                    <div key={step.label} className="space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-ink">
                          {step.label}
                        </span>
                        <div className="ml-auto flex items-center gap-2 sm:gap-3">
                          <span className="hidden text-[11px] text-muted-ink sm:inline">
                            {step.desc}
                          </span>
                          {stepRate && (
                            <span className="rounded-md bg-[#eaf9f0] px-1.5 py-0.5 text-[11px] font-bold text-[#0d853d]">
                              环比 {stepRate}
                            </span>
                          )}
                          <span className="w-10 text-right font-mono text-sm font-extrabold text-ink sm:w-12">
                            {step.count}
                          </span>
                        </div>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#eef7f1]">
                        <div
                          className="h-full rounded-full bg-brand transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 付费墙触发原因排行 + 导出格式偏好 */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-[#d8eee0] bg-white p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
                  <BarChart3 size={16} className="text-[#0cb449]" />
                  会员收银台触发原因排行榜 (Paywall Triggers)
                </h3>
                <p className="mt-1 text-xs text-muted-ink">
                  看看用户最常因为哪个 PRO 权益被拦截而产生付费意愿
                </p>
                {funnel.paywallTriggers.length === 0 ? (
                  <p className="mt-6 text-center text-xs text-muted-ink">
                    当前时间段暂无收银台触发记录
                  </p>
                ) : (
                  <div className="mt-4 space-y-2.5">
                    {funnel.paywallTriggers.map((item, i) => (
                      <div
                        key={item.trigger}
                        className="flex items-center justify-between gap-3 rounded-xl border border-[#e6f4ec] bg-[#f9fdfb] px-3.5 py-2.5 text-xs"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#dff7e8] text-[11px] font-bold text-[#0d853d]">
                            {i + 1}
                          </span>
                          <span className="truncate font-medium text-ink">
                            {item.trigger}
                          </span>
                        </div>
                        <span className="shrink-0 font-mono font-bold text-[#0d853d]">
                          {item.count} 次
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[#d8eee0] bg-white p-5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
                  <Filter size={16} className="text-[#0cb449]" />
                  用户导出格式点击分布 (Export Formats)
                </h3>
                <p className="mt-1 text-xs text-muted-ink">
                  统计用户在工作台点击下载 PDF / Word / 高清长图 / Markdown 的频次
                </p>
                {funnel.exportFormats.length === 0 ? (
                  <p className="mt-6 text-center text-xs text-muted-ink">
                    当前时间段暂无导出点击记录
                  </p>
                ) : (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {funnel.exportFormats.map((item) => (
                      <div
                        key={item.format}
                        className="rounded-xl border border-[#e6f4ec] bg-[#f9fdfb] p-3.5"
                      >
                        <span className="text-xs font-bold uppercase text-muted-ink">
                          {item.format} 格式
                        </span>
                        <p className="mt-1 text-xl font-extrabold text-ink">
                          {item.count}{" "}
                          <span className="text-xs font-normal text-muted-ink">
                            次
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 最近 30 条实时埋点事件流 */}
            <div className="rounded-2xl border border-[#d8eee0] bg-white p-5">
              <h3 className="text-sm font-bold text-ink">
                最近 30 条实时用户行为埋点明细
              </h3>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="whitespace-nowrap border-b border-[#e5f3ea] text-muted-ink">
                      <th className="py-2.5 pr-4 font-semibold">发生时间</th>
                      <th className="py-2.5 pr-4 font-semibold">事件名称</th>
                      <th className="py-2.5 pr-4 font-semibold">
                        用户邮箱 / 访客标识
                      </th>
                      <th className="py-2.5 pr-4 font-semibold">页面路径</th>
                      <th className="py-2.5 font-semibold">附加属性 (Props)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f8f3]">
                    {funnel.recentEvents.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="py-6 text-center text-muted-ink"
                        >
                          暂无埋点记录
                        </td>
                      </tr>
                    ) : (
                      funnel.recentEvents.map((ev) => (
                        <tr key={ev.id} className="hover:bg-[#f9fdfb]">
                          <td className="whitespace-nowrap py-2.5 pr-4 font-mono text-muted-ink">
                            {formatDateTime(ev.createdAt)}
                          </td>
                          <td className="whitespace-nowrap py-2.5 pr-4">
                            <span className="rounded-md bg-[#eaf9f0] px-2 py-0.5 font-semibold text-[#0d853d]">
                              {EVENT_LABELS[ev.eventName] || ev.eventName}
                            </span>
                          </td>
                          <td className="whitespace-nowrap py-2.5 pr-4 font-mono">
                            {ev.userEmail ||
                              (ev.visitorId
                                ? `访客:${ev.visitorId.slice(0, 10)}`
                                : "匿名访客")}
                          </td>
                          <td className="whitespace-nowrap py-2.5 pr-4 font-mono text-muted-ink">
                            {ev.pagePath || "/"}
                          </td>
                          <td className="max-w-md truncate py-2.5 font-mono text-[11px] text-muted-ink">
                            {Object.keys(ev.props || {}).length > 0
                              ? JSON.stringify(ev.props)
                              : "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 3. 激活码发卡与核销管理 ==================== */}
        {activeTab === "codes" && (
          <div className="space-y-6">
            {/* 批量生成激活码表单 */}
            <div className="rounded-2xl border border-[#d8eee0] bg-white p-5">
              <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
                <KeyRound size={16} className="text-[#0cb449]" />
                批量生成会员激活码 / 兑换码
              </h2>
              <p className="mt-1 text-xs text-muted-ink">
                生成的激活码实时写入数据库，可直接复制发给微信客户或放入自动发卡平台。
              </p>
              <form
                onSubmit={(e) => void handleGenerateCodes(e)}
                className="mt-4 grid gap-3 sm:grid-cols-[1.2fr_110px_1.5fr_auto] sm:items-end"
              >
                <div className="min-w-0">
                  <label className="block text-[11px] font-semibold text-muted-ink">
                    套餐类型
                  </label>
                  <select
                    value={genPlan}
                    onChange={(e) =>
                      setGenPlan(
                        e.target.value as Exclude<MembershipPlan, "free">,
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-[#cfead9] bg-[#f9fdfb] px-3 py-2 text-xs font-semibold text-ink focus:border-brand focus:outline-none"
                  >
                    {MEMBERSHIP_PLANS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (¥{p.price} · {p.durationDays}天)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="min-w-0">
                  <label className="block text-[11px] font-semibold text-muted-ink">
                    生成数量
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={genCount}
                    onChange={(e) => setGenCount(Number(e.target.value || 1))}
                    className="mt-1 w-full rounded-xl border border-[#cfead9] bg-[#f9fdfb] px-3 py-2 text-xs font-semibold text-ink focus:border-brand focus:outline-none"
                  />
                </div>

                <div className="min-w-0">
                  <label className="block text-[11px] font-semibold text-muted-ink">
                    批次备注（选填）
                  </label>
                  <input
                    type="text"
                    value={genNote}
                    onChange={(e) => setGenNote(e.target.value)}
                    placeholder="如：小红书活动批次 / 微信私域客户"
                    className="mt-1 w-full rounded-xl border border-[#cfead9] bg-[#f9fdfb] px-3 py-2 text-xs text-ink focus:border-brand focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={generatingCodes}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-brand px-5 text-xs font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
                >
                  <Plus size={14} />
                  {generatingCodes ? "正在生成…" : "立即生成"}
                </button>
              </form>

              {newlyGeneratedCodes.length > 0 && (
                <div className="mt-4 rounded-xl border border-[#bce6cb] bg-[#f2fbf6] p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#134726]">
                      新生成激活码（点击单个或一键复制全部）：
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        void handleCopyText(
                          newlyGeneratedCodes.map((c) => c.code).join("\n"),
                          "codes-batch-copy",
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-md bg-brand px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-brand-dark"
                    >
                      {copiedKey === "codes-batch-copy" ? (
                        <Check size={12} />
                      ) : (
                        <Copy size={12} />
                      )}
                      {copiedKey === "codes-batch-copy"
                        ? "已复制全部"
                        : "一键复制全部"}
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {newlyGeneratedCodes.map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => void handleCopyText(item.code, item.code)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#cdebd9] bg-white px-2.5 py-1 font-mono text-xs font-bold text-[#0d853d] hover:bg-[#eaf9f0]"
                      >
                        <span>{item.code}</span>
                        {copiedKey === item.code ? (
                          <Check size={12} />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 激活码库存与核销明细 */}
            <div className="rounded-2xl border border-[#d8eee0] bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-ink">
                    激活码库存与核销列表
                  </h3>
                  <span className="text-xs text-muted-ink">
                    （未核销 {overview.unusedCodeCount} 个 · 已核销{" "}
                    {overview.redeemedCodeCount} 个）
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {(
                    [
                      { id: "all", label: "全部" },
                      { id: "unused", label: "仅看可用" },
                      { id: "redeemed", label: "已核销" },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCodeFilter(item.id)}
                      className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                        codeFilter === item.id
                          ? "bg-brand text-white"
                          : "border border-[#d8eee0] bg-[#f9fdfb] text-ink hover:bg-[#eaf9f0]"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="whitespace-nowrap border-b border-[#e5f3ea] text-muted-ink">
                      <th className="py-2.5 pr-4 font-semibold">激活码</th>
                      <th className="py-2.5 pr-4 font-semibold">套餐档位</th>
                      <th className="py-2.5 pr-4 font-semibold">状态</th>
                      <th className="py-2.5 pr-4 font-semibold">核销用户</th>
                      <th className="py-2.5 pr-4 font-semibold">批次备注</th>
                      <th className="py-2.5 pr-4 font-semibold">
                        生成 / 核销时间
                      </th>
                      <th className="py-2.5 font-semibold">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f8f3]">
                    {filteredCodes.map((c) => {
                      const isUsed = Boolean(c.redeemedAt);
                      return (
                        <tr key={c.code} className="hover:bg-[#f9fdfb]">
                          <td className="whitespace-nowrap py-2.5 pr-4 font-mono font-bold text-ink">
                            {c.code}
                          </td>
                          <td className="whitespace-nowrap py-2.5 pr-4">
                            {PLAN_BADGE_MAP[c.planType] || c.planType}
                          </td>
                          <td className="whitespace-nowrap py-2.5 pr-4">
                            {isUsed ? (
                              <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-semibold text-neutral-600">
                                已使用
                              </span>
                            ) : (
                              <span className="rounded-md bg-[#eaf9f0] px-2 py-0.5 text-[11px] font-semibold text-[#0d853d]">
                                可使用
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap py-2.5 pr-4 font-mono text-muted-ink">
                            {c.redeemedByEmail || "-"}
                          </td>
                          <td className="py-2.5 pr-4 text-muted-ink">
                            {c.batchNote || "-"}
                          </td>
                          <td className="whitespace-nowrap py-2.5 pr-4 font-mono text-muted-ink">
                            {isUsed
                              ? `核销: ${formatDateTime(c.redeemedAt)}`
                              : `创建: ${formatDateTime(c.createdAt)}`}
                          </td>
                          <td className="whitespace-nowrap py-2.5">
                            <button
                              type="button"
                              onClick={() => void handleCopyText(c.code, c.code)}
                              className="inline-flex items-center gap-1 rounded-md border border-[#cdebd9] bg-white px-2 py-1 text-[11px] font-semibold text-[#0d853d] hover:bg-[#eaf9f0]"
                            >
                              {copiedKey === c.code ? (
                                <Check size={11} />
                              ) : (
                                <Copy size={11} />
                              )}
                              {copiedKey === c.code ? "已复制" : "复制"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 4. 用户与会员管理 ==================== */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-[#d8eee0] bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-ink">
                    注册用户与会员身份管理（共 {users.length} 人）
                  </h2>
                  <p className="text-xs text-muted-ink">
                    支持按邮箱搜索用户，并支持一键为其赠送月卡/季卡/年卡或重置为免费版
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search
                    size={14}
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-ink"
                  />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="搜索用户邮箱…"
                    className="w-full rounded-xl border border-[#cfead9] bg-[#f9fdfb] py-1.5 pr-3 pl-8 text-xs text-ink focus:border-brand focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="whitespace-nowrap border-b border-[#e5f3ea] text-muted-ink">
                      <th className="py-2.5 pr-4 font-semibold">用户邮箱</th>
                      <th className="py-2.5 pr-4 font-semibold">当前会员状态</th>
                      <th className="py-2.5 pr-4 font-semibold">到期时间</th>
                      <th className="py-2.5 pr-4 font-semibold">简历数量</th>
                      <th className="py-2.5 pr-4 font-semibold">注册时间</th>
                      <th className="py-2.5 font-semibold">快捷开通 / 续期</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f8f3]">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-[#f9fdfb]">
                        <td className="whitespace-nowrap py-2.5 pr-4 font-mono font-semibold text-ink">
                          {u.email}
                        </td>
                        <td className="whitespace-nowrap py-2.5 pr-4">
                          {u.isPro ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf9f0] px-2.5 py-0.5 text-[11px] font-bold text-[#0d853d]">
                              <Crown size={11} />
                              {u.planLabel}
                            </span>
                          ) : (
                            <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-neutral-600">
                              免费版
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap py-2.5 pr-4 font-mono text-muted-ink">
                          {u.isPro
                            ? formatMembershipExpiry(u.membershipExpiresAt)
                            : "-"}
                        </td>
                        <td className="whitespace-nowrap py-2.5 pr-4 font-mono">
                          {u.resumeCount} 份
                        </td>
                        <td className="whitespace-nowrap py-2.5 pr-4 font-mono text-muted-ink">
                          {formatDateTime(u.createdAt)}
                        </td>
                        <td className="whitespace-nowrap py-2.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={grantingUser}
                              onClick={() =>
                                void handleGrantMembership(u.email, "monthly")
                              }
                              className="rounded-md border border-[#cdebd9] bg-[#f2fbf6] px-2 py-1 text-[11px] font-semibold text-[#0d853d] hover:bg-[#dff5e8]"
                            >
                              +月卡
                            </button>
                            <button
                              type="button"
                              disabled={grantingUser}
                              onClick={() =>
                                void handleGrantMembership(u.email, "quarterly")
                              }
                              className="rounded-md border border-[#cdebd9] bg-[#f2fbf6] px-2 py-1 text-[11px] font-semibold text-[#0d853d] hover:bg-[#dff5e8]"
                            >
                              +季卡
                            </button>
                            <button
                              type="button"
                              disabled={grantingUser}
                              onClick={() =>
                                void handleGrantMembership(u.email, "yearly")
                              }
                              className="rounded-md border border-[#cdebd9] bg-[#f2fbf6] px-2 py-1 text-[11px] font-semibold text-[#0d853d] hover:bg-[#dff5e8]"
                            >
                              +年卡
                            </button>
                            {u.isPro && (
                              <button
                                type="button"
                                disabled={grantingUser}
                                onClick={() =>
                                  void handleGrantMembership(u.email, "free")
                                }
                                className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-[11px] text-neutral-600 hover:bg-neutral-100"
                              >
                                重置免费
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================== 5. 支付与兑换订单流水 ==================== */}
        {activeTab === "orders" && (
          <div className="rounded-2xl border border-[#d8eee0] bg-white p-5">
            <h2 className="text-sm font-bold text-ink">
              会员订单与激活码兑换流水（最近 {orders.length} 笔）
            </h2>
            <p className="mt-1 text-xs text-muted-ink">
              包含扫码支付订单、激活码兑换订单以及管理员后台手动开通记录
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="whitespace-nowrap border-b border-[#e5f3ea] text-muted-ink">
                    <th className="py-2.5 pr-4 font-semibold">订单号</th>
                    <th className="py-2.5 pr-4 font-semibold">用户邮箱</th>
                    <th className="py-2.5 pr-4 font-semibold">套餐类型</th>
                    <th className="py-2.5 pr-4 font-semibold">实付金额</th>
                    <th className="py-2.5 pr-4 font-semibold">开通渠道</th>
                    <th className="py-2.5 pr-4 font-semibold">状态</th>
                    <th className="py-2.5 pr-4 font-semibold">外部凭据 / 激活码</th>
                    <th className="py-2.5 font-semibold">创建时间</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f8f3]">
                  {orders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-6 text-center text-muted-ink"
                      >
                        暂无订单流水
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id} className="hover:bg-[#f9fdfb]">
                        <td className="whitespace-nowrap py-2.5 pr-4 font-mono text-ink">
                          {o.orderNo}
                        </td>
                        <td className="whitespace-nowrap py-2.5 pr-4 font-mono">
                          {o.userEmail}
                        </td>
                        <td className="whitespace-nowrap py-2.5 pr-4">
                          {PLAN_BADGE_MAP[o.planType] || o.planType}
                        </td>
                        <td className="whitespace-nowrap py-2.5 pr-4 font-mono font-bold text-[#0d853d]">
                          {formatYuan(o.amountCents)}
                        </td>
                        <td className="whitespace-nowrap py-2.5 pr-4">
                          {o.channel === "redemption_code"
                            ? "激活码兑换"
                            : o.channel === "admin_grant"
                              ? "后台手动开通"
                              : `${o.payMethod} (${o.channel})`}
                        </td>
                        <td className="whitespace-nowrap py-2.5 pr-4">
                          {o.status === "paid" ? (
                            <span className="rounded-md bg-[#eaf9f0] px-2 py-0.5 text-[11px] font-semibold text-[#0d853d]">
                              已入账
                            </span>
                          ) : (
                            <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                              {o.status === "pending" ? "待支付" : "已关闭"}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap py-2.5 pr-4 font-mono text-muted-ink">
                          {o.externalRef || "-"}
                        </td>
                        <td className="whitespace-nowrap py-2.5 font-mono text-muted-ink">
                          {formatDateTime(o.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
