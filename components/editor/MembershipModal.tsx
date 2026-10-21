"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Crown,
  ExternalLink,
  KeyRound,
  MessageCircle,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import {
  CUSTOMER_SERVICE_CONFIG,
  MEMBERSHIP_PLANS,
  PRO_MODAL_PRIVILEGES,
  formatMembershipExpiry,
  type MembershipPlan,
  type MembershipStatus,
  type PaymentMethod,
} from "@/lib/membership";

interface ActiveCheckoutOrder {
  orderNo: string;
  planType: Exclude<MembershipPlan, "free">;
  planName: string;
  price: string;
  payMethod: PaymentMethod;
  status: "pending" | "paid" | "closed";
  qrUrl: string;
  expiresAt: string;
  isSandbox: boolean;
}

/**
 * 根据二维码文本确定性生成高对比度 SVG 矩阵码（用于本地沙盒及纯文本链接展示）
 */
function PseudoQrSvg({
  value,
  accentColor,
}: {
  value: string;
  accentColor: string;
}) {
  const size = 21;
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  function isFinderPattern(r: number, c: number) {
    const inTopLeft = r < 7 && c < 7;
    const inTopRight = r < 7 && c >= size - 7;
    const inBottomLeft = r >= size - 7 && c < 7;
    return inTopLeft || inTopRight || inBottomLeft;
  }

  function finderBit(r: number, c: number, baseR: number, baseC: number) {
    const lr = r - baseR;
    const lc = c - baseC;
    if (lr === 0 || lr === 6 || lc === 0 || lc === 6) return true;
    if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) return true;
    return false;
  }

  const cells: Array<{ r: number; c: number }> = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (r < 7 && c < 7) {
        if (finderBit(r, c, 0, 0)) cells.push({ r, c });
        continue;
      }
      if (r < 7 && c >= size - 7) {
        if (finderBit(r, c, 0, size - 7)) cells.push({ r, c });
        continue;
      }
      if (r >= size - 7 && c < 7) {
        if (finderBit(r, c, size - 7, 0)) cells.push({ r, c });
        continue;
      }
      if (
        (r === 7 && (c <= 7 || c >= size - 8)) ||
        (c === 7 && (r <= 7 || r >= size - 8)) ||
        (r === size - 8 && c <= 7) ||
        (c === size - 8 && r <= 7)
      ) {
        continue;
      }
      if (r >= 8 && r <= 12 && c >= 8 && c <= 12) {
        continue;
      }
      const seed = Math.imul(hash ^ (r * 31 + c * 17), 2654435761) >>> 0;
      if (seed % 10 < 5 || isFinderPattern(r, c)) {
        cells.push({ r, c });
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="size-36 rounded-lg bg-white p-2"
      aria-label="支付二维码"
    >
      {cells.map(({ r, c }) => (
        <rect
          key={`${r}-${c}`}
          x={c}
          y={r}
          width={0.92}
          height={0.92}
          rx={0.18}
          fill="#13331e"
        />
      ))}
      <rect
        x={8.2}
        y={8.2}
        width={4.6}
        height={4.6}
        rx={0.9}
        fill={accentColor}
      />
      <text
        x={10.5}
        y={11.3}
        textAnchor="middle"
        fontSize="2.2"
        fontWeight="bold"
        fill="#ffffff"
      >
        ¥
      </text>
    </svg>
  );
}

export function MembershipModal({
  open,
  reason,
  membership,
  onClose,
  onRedeemed,
}: {
  open: boolean;
  reason?: string;
  membership: MembershipStatus;
  onClose: () => void;
  onRedeemed: (next: MembershipStatus) => void;
}) {
  const [selectedPlan, setSelectedPlan] =
    useState<Exclude<MembershipPlan, "free">>("quarterly");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("wechat");
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [activeOrder, setActiveOrder] = useState<ActiveCheckoutOrder | null>(
    null,
  );
  const [simulatingPay, setSimulatingPay] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [showContactCard, setShowContactCard] = useState(false);
  const [copiedWechat, setCopiedWechat] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const activeOrderNo = activeOrder?.orderNo ?? "";
  const activeOrderStatus = activeOrder?.status ?? "";

  // 当存在待支付扫码订单时，每 2.5 秒自动轮询订单状态
  useEffect(() => {
    if (!open || !activeOrderNo || activeOrderStatus !== "pending") return;
    let cancelled = false;

    const timer = window.setInterval(async () => {
      try {
        const res = await fetch(
          `/api/membership/checkout?orderNo=${encodeURIComponent(activeOrderNo)}`,
          { cache: "no-store" },
        );
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          status?: "pending" | "paid" | "closed";
          membership?: MembershipStatus;
        };
        if (cancelled) return;
        if (data.status === "paid" && data.membership) {
          setActiveOrder((prev) =>
            prev ? { ...prev, status: "paid" } : null,
          );
          setSuccessMsg(
            `支付成功！已为您开通/顺延 ${data.membership.planLabel}（有效期至 ${formatMembershipExpiry(data.membership.expiresAt)}）。`,
          );
          onRedeemed(data.membership);
        } else if (data.status === "closed") {
          setActiveOrder((prev) =>
            prev ? { ...prev, status: "closed" } : null,
          );
        }
      } catch {
        // Ignore transient network errors during polling
      }
    }, 2500);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [open, activeOrderNo, activeOrderStatus, onRedeemed]);

  if (!open) return null;

  const currentPlanMeta =
    MEMBERSHIP_PLANS.find((p) => p.id === selectedPlan) ?? MEMBERSHIP_PLANS[1];

  async function handleCreateCheckoutOrder() {
    if (creatingOrder) return;
    setCreatingOrder(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/membership/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType: selectedPlan,
          payMethod,
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        order?: ActiveCheckoutOrder;
        error?: { message?: string };
      };
      if (!res.ok || !payload.order) {
        throw new Error(
          payload.error?.message || "创建支付订单失败，请稍后重试。",
        );
      }
      setActiveOrder(payload.order);
    } catch (error) {
      setErrorMsg(
        error instanceof Error ? error.message : "创建订单失败，请稍后重试。",
      );
    } finally {
      setCreatingOrder(false);
    }
  }

  async function handleSimulateSandboxPayment() {
    if (!activeOrder || simulatingPay) return;
    setSimulatingPay(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/membership/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sandbox: "true",
          orderNo: activeOrder.orderNo,
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        membership?: MembershipStatus;
        error?: { message?: string };
      };
      if (!res.ok || !payload.membership) {
        throw new Error(payload.error?.message || "模拟支付回调失败。");
      }
      setActiveOrder((prev) => (prev ? { ...prev, status: "paid" } : null));
      setSuccessMsg(
        `支付成功！已为您开通/顺延 ${payload.membership.planLabel}（有效期至 ${formatMembershipExpiry(payload.membership.expiresAt)}）。`,
      );
      onRedeemed(payload.membership);
    } catch (error) {
      setErrorMsg(
        error instanceof Error ? error.message : "模拟支付失败，请重试。",
      );
    } finally {
      setSimulatingPay(false);
    }
  }

  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault();
    if (redeeming) return;
    const clean = codeInput.trim();
    if (!clean) {
      setErrorMsg("请输入会员激活码。");
      return;
    }
    setRedeeming(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/membership/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: clean }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        membership?: MembershipStatus;
        error?: { message?: string };
      };
      if (!res.ok || !payload.membership) {
        throw new Error(
          payload.error?.message || "激活码兑换失败，请核对后重试。",
        );
      }
      setCodeInput("");
      setSuccessMsg(
        `兑换成功！已为您开通/顺延 ${payload.membership.planLabel}（有效期至 ${formatMembershipExpiry(payload.membership.expiresAt)}）。`,
      );
      onRedeemed(payload.membership);
    } catch (error) {
      setErrorMsg(
        error instanceof Error ? error.message : "激活码兑换失败，请稍后重试。",
      );
    } finally {
      setRedeeming(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="membership-modal-title"
      className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4 backdrop-blur-[1px] print:hidden"
      onClick={onClose}
    >
      <div
        className="max-h-[92vh] w-[min(calc(100vw-2rem),740px)] overflow-y-auto rounded-3xl border border-[#cdebd9] bg-white p-5 shadow-[0_24px_60px_#10391d2e] sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[linear-gradient(135deg,#12b653,#079541)] text-white shadow-sm">
              <Crown size={20} />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="membership-modal-title"
                  className="text-lg font-bold tracking-tight text-ink sm:text-xl"
                >
                  升级 ResumeOK PRO 会员
                </h2>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    membership.isPro
                      ? "bg-[#e8f8ee] text-[#0c8a3e]"
                      : "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {membership.isPro
                    ? `${membership.planLabel} · ${formatMembershipExpiry(membership.expiresAt)} 到期`
                    : "当前：免费版"}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted-ink">
                买断时长制，不自动扣费 · 开通立即解锁全部高级求职权益
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭会员弹窗"
            className="grid size-8 shrink-0 place-items-center rounded-full text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        {reason && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#cdebd9] bg-[#f2fbf6] px-3.5 py-2.5 text-xs font-medium text-[#146c38]">
            <Sparkles size={15} className="shrink-0 text-[#0cb449]" />
            <span>{reason}</span>
          </div>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {MEMBERSHIP_PLANS.map((plan) => {
            const active = selectedPlan === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => {
                  setSelectedPlan(plan.id);
                  setActiveOrder(null);
                  setErrorMsg("");
                }}
                className={`relative flex flex-col rounded-2xl border p-4 text-left transition-all ${
                  active
                    ? "border-[#12b653] bg-[#f4fcf7] shadow-[0_8px_24px_#12b6531a] ring-2 ring-[#12b653]/20"
                    : "border-[#dfeee5] bg-white hover:border-[#9ee0b8] hover:bg-[#fafdfb]"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-2.5 right-3 rounded-full bg-brand px-2.5 py-0.5 text-[10px] font-semibold text-white shadow-xs">
                    {plan.badge}
                  </span>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-ink">{plan.name}</span>
                  <span className="rounded-md bg-[#e8f8ee] px-1.5 py-0.5 text-[10px] font-medium text-[#13803f]">
                    {plan.periodLabel}
                  </span>
                </div>
                <div className="mt-2.5 flex items-baseline gap-1.5">
                  <span className="text-xs font-bold text-[#0c9c43]">¥</span>
                  <span className="text-2xl font-extrabold tracking-tight text-ink">
                    {plan.price}
                  </span>
                  <span className="text-xs text-neutral-400 line-through">
                    ¥{plan.originalPrice}
                  </span>
                </div>
                <p className="mt-1 text-[11px] font-medium text-[#158844]">
                  {plan.dailyCostLabel}
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-muted-ink">
                  {plan.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* 在线扫码支付收银台 */}
        <div className="mt-4 rounded-2xl border border-[#cdebd9] bg-[#f6fcf8] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-ink">支付方式：</span>
              <button
                type="button"
                onClick={() => {
                  setPayMethod("wechat");
                  setActiveOrder(null);
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  payMethod === "wechat"
                    ? "border-[#12b653] bg-white font-semibold text-[#0d853d] shadow-2xs"
                    : "border-[#d8efe1] bg-white/70 text-muted-ink hover:bg-white"
                }`}
              >
                <span className="size-2 rounded-full bg-[#07c160]" />
                微信支付
              </button>
              <button
                type="button"
                onClick={() => {
                  setPayMethod("alipay");
                  setActiveOrder(null);
                }}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  payMethod === "alipay"
                    ? "border-[#12b653] bg-white font-semibold text-[#0d853d] shadow-2xs"
                    : "border-[#d8efe1] bg-white/70 text-muted-ink hover:bg-white"
                }`}
              >
                <span className="size-2 rounded-full bg-[#0d9444]" />
                支付宝
              </button>
            </div>

            <button
              type="button"
              disabled={creatingOrder}
              onClick={() => void handleCreateCheckoutOrder()}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-brand px-5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-brand-dark disabled:opacity-60"
            >
              <QrCode size={15} />
              {creatingOrder
                ? "正在生成支付码…"
                : activeOrder && activeOrder.status === "pending"
                  ? `重新生成二维码 (¥${currentPlanMeta.price})`
                  : `立即扫码开通 ${currentPlanMeta.name} (¥${currentPlanMeta.price})`}
            </button>
          </div>

          {activeOrder && activeOrder.status === "pending" && (
            <div className="mt-4 flex flex-col items-center gap-4 rounded-xl border border-[#d6eee0] bg-white p-4 sm:flex-row">
              <div className="shrink-0 rounded-xl border border-[#e2f3e8] bg-[#f9fdfb] p-2 shadow-2xs">
                <PseudoQrSvg
                  value={activeOrder.qrUrl}
                  accentColor={
                    activeOrder.payMethod === "wechat" ? "#07c160" : "#0d9444"
                  }
                />
              </div>
              <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className="rounded-md bg-[#e8f8ee] px-2 py-0.5 text-xs font-semibold text-[#0d853d]">
                    {activeOrder.payMethod === "wechat"
                      ? "请使用微信扫一扫"
                      : "请使用支付宝扫一扫"}
                  </span>
                  <span className="text-xs text-muted-ink">
                    订单号：<code className="font-mono">{activeOrder.orderNo}</code>
                  </span>
                </div>
                <p className="text-sm font-bold text-ink">
                  {activeOrder.planName} · 应付金额{" "}
                  <span className="text-lg text-[#0c9c43]">
                    ¥{activeOrder.price}
                  </span>
                </p>
                <div className="flex items-center justify-center gap-1.5 text-xs text-[#267a47] sm:justify-start">
                  <RefreshCw size={12} className="animate-spin" />
                  <span>正在实时检测支付状态，付款成功后将自动为您开通…</span>
                </div>
                {activeOrder.isSandbox && (
                  <div className="pt-1">
                    <button
                      type="button"
                      disabled={simulatingPay}
                      onClick={() => void handleSimulateSandboxPayment()}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#bce6cb] bg-[#eefbf3] px-3 py-1.5 text-xs font-semibold text-[#0d853d] transition-colors hover:bg-[#dcf6e6] disabled:opacity-60"
                    >
                      <ShieldCheck size={14} />
                      {simulatingPay
                        ? "正在确认入账…"
                        : "模拟手机扫码支付成功（沙盒测试）"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 6大核心权益说明 */}
        <div className="mt-4 rounded-2xl border border-[#e3f3e9] bg-[#f9fdfb] p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[#1b4d2e]">
              PRO 会员解锁全部 6 大核心权益
            </h3>
            <span className="text-[11px] text-muted-ink">
              免费版仅支持 1 份简历 + 基础模板 + PDF 导出
            </span>
          </div>
          <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
            {PRO_MODAL_PRIVILEGES.map((item) => (
              <div
                key={item}
                className="flex items-start gap-2 text-xs leading-5 text-[#274d35]"
              >
                <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-[#dff7e8] text-[#0cb449]">
                  <Check size={11} strokeWidth={2.5} />
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 激活码兑换 + 联系客服获取激活码 */}
        <div className="mt-4 rounded-2xl border border-[#d6eee0] bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="membership-redeem-input"
              className="flex items-center gap-1.5 text-xs font-semibold text-ink"
            >
              <KeyRound size={14} className="text-[#0cb449]" />
              方式二：使用会员激活码 / 兑换码立即开通
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowContactCard((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded-full border border-[#c6e9d3] bg-[#f2fbf6] px-2.5 py-1 text-xs font-semibold text-[#0d853d] transition-colors hover:bg-[#e3f7ec]"
              >
                <MessageCircle size={12.5} />
                {showContactCard ? "收起客服信息" : "没有激活码？联系客服获取"}
              </button>
              {CUSTOMER_SERVICE_CONFIG.externalShopUrl && (
                <a
                  href={CUSTOMER_SERVICE_CONFIG.externalShopUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0cb449] hover:underline"
                >
                  自助购买激活码
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>

          {showContactCard && (
            <div className="mt-3 rounded-xl border border-[#cdebd9] bg-[#f5fcf8] p-3.5 text-xs">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <p className="font-semibold text-[#134726]">
                    添加专属客服微信购买 / 领取会员激活码：
                  </p>
                  <p className="text-[11px] leading-relaxed text-[#386b4a]">
                    {CUSTOMER_SERVICE_CONFIG.guideText}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="rounded-md border border-[#cdebd9] bg-white px-2.5 py-1 font-mono text-xs font-bold text-[#0d853d]">
                      微信号：{CUSTOMER_SERVICE_CONFIG.wechatId}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard
                          .writeText(CUSTOMER_SERVICE_CONFIG.wechatId)
                          .catch(() => {});
                        setCopiedWechat(true);
                      }}
                      className="inline-flex items-center gap-1 rounded-md bg-brand px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-brand-dark"
                    >
                      {copiedWechat ? <Check size={12} /> : <Copy size={12} />}
                      {copiedWechat ? "已复制微信号" : "复制客服微信号"}
                    </button>
                  </div>
                </div>
                {CUSTOMER_SERVICE_CONFIG.qrCodeImageUrl && (
                  <Image
                    src={CUSTOMER_SERVICE_CONFIG.qrCodeImageUrl}
                    alt="客服微信二维码"
                    width={96}
                    height={96}
                    unoptimized
                    className="size-24 shrink-0 rounded-lg border border-[#d8efe1] bg-white object-contain p-1"
                  />
                )}
              </div>
            </div>
          )}

          <form
            onSubmit={(e) => void handleRedeem(e)}
            className="mt-2.5 flex flex-col gap-2 sm:flex-row"
          >
            <input
              id="membership-redeem-input"
              type="text"
              value={codeInput}
              onChange={(e) => {
                setCodeInput(e.target.value.toUpperCase());
                setErrorMsg("");
                setSuccessMsg("");
              }}
              placeholder="请输入激活码，例如：ROK-Q90-XXXX-XXXX"
              className="min-w-0 flex-1 rounded-xl border border-[#cfead9] bg-[#f9fdfb] px-3.5 py-2.5 font-mono text-xs uppercase tracking-wider text-ink placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-neutral-400 focus:border-[#12b653] focus:bg-white focus:outline-none focus-visible:outline-none"
            />
            <button
              type="submit"
              disabled={redeeming}
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[#12b653] bg-[#f2fbf6] px-5 text-xs font-semibold text-[#0d853d] transition-colors hover:bg-[#e3f7ec] disabled:opacity-60"
            >
              <Sparkles size={14} />
              {redeeming ? "正在兑换…" : "立即兑换开通"}
            </button>
          </form>

          {errorMsg && (
            <p className="mt-2 text-xs text-red-600" role="alert">
              {errorMsg}
            </p>
          )}
          {successMsg && (
            <p
              className="mt-2 text-xs font-semibold text-[#0c8a3e]"
              role="status"
            >
              {successMsg}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
