"use client";

import { useState } from "react";
import {
  Check,
  Crown,
  KeyRound,
  Sparkles,
  X,
  ExternalLink,
} from "lucide-react";
import {
  MEMBERSHIP_PLANS,
  PRO_MODAL_PRIVILEGES,
  formatMembershipExpiry,
  type MembershipPlan,
  type MembershipStatus,
} from "@/lib/membership";

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
  const [codeInput, setCodeInput] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!open) return null;

  const checkoutUrl = process.env.NEXT_PUBLIC_CHECKOUT_URL || "";

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
        className="max-h-[92vh] w-[min(calc(100vw-2rem),720px)] overflow-y-auto rounded-3xl border border-[#cdebd9] bg-white p-5 shadow-[0_24px_60px_#10391d2e] sm:p-7"
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
                一次开通，解锁多份简历、智能导入解析、转英文、全格式导出与 HR 访客实时追踪
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
                onClick={() => setSelectedPlan(plan.id)}
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

        <div className="mt-5 rounded-2xl border border-[#e3f3e9] bg-[#f9fdfb] p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[#1b4d2e]">
              PRO 会员解锁全部 6 大核心权益
            </h3>
            <span className="text-[11px] text-muted-ink">
              免费版仅支持 1 份简历 + 基础模板 + PDF 导出
            </span>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
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

        <form
          onSubmit={(e) => void handleRedeem(e)}
          className="mt-5 rounded-2xl border border-[#d6eee0] bg-white p-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="membership-redeem-input"
              className="flex items-center gap-1.5 text-xs font-semibold text-ink"
            >
              <KeyRound size={14} className="text-[#0cb449]" />
              使用会员激活码 / 兑换码立即开通
            </label>
            {checkoutUrl && (
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0cb449] hover:underline"
              >
                购买获取激活码
                <ExternalLink size={12} />
              </a>
            )}
          </div>
          <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
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
              className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-brand px-5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-brand-dark disabled:opacity-60"
            >
              <Sparkles size={14} />
              {redeeming ? "正在兑换…" : "立即兑换开通"}
            </button>
          </div>
          {errorMsg && (
            <p className="mt-2 text-xs text-red-600" role="alert">
              {errorMsg}
            </p>
          )}
          {successMsg && (
            <p className="mt-2 text-xs font-medium text-[#0c8a3e]" role="status">
              {successMsg}
            </p>
          )}
          <p className="mt-2.5 text-[11px] text-muted-ink">
            提示：会员为买断时长制，绝无自动扣费；如在有效期内再次兑换激活码，有效期将在原到期时间基础上自动顺延累加。
          </p>
        </form>
      </div>
    </div>
  );
}
