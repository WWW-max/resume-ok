"use client";

import { useState, type FormEvent } from "react";
import { Check, KeyRound, X } from "lucide-react";

export function PasswordSetupModal({
  open,
  userEmail,
  onClose,
}: {
  open: boolean;
  userEmail: string;
  onClose: () => void;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!open) return null;

  function handleClose() {
    if (saving) return;
    setPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess("");
    onClose();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (saving) return;
    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("密码至少需要 8 个字符。");
      return;
    }
    if (password !== confirmPassword) {
      setError("两次输入的密码不一致，请重新确认。");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmPassword }),
      });
      const payload = (await res.json().catch(() => ({}))) as {
        message?: string;
        error?: { message?: string };
      };
      if (!res.ok) {
        throw new Error(payload.error?.message || "设置密码失败，请稍后重试。");
      }
      setSuccess(
        payload.message || "登录密码设置成功！下次可直接通过邮箱+密码登录。",
      );
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "设置密码失败，请稍后重试。",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="password-setup-dialog-title"
      className="fixed inset-0 z-50 grid place-items-center bg-black/25 p-4 backdrop-blur-[1px] print:hidden"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-[#d8efe1] bg-white p-5 shadow-[0_16px_40px_#10391d26]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#e8f8ee] text-[#0cb449]">
              <KeyRound size={17} />
            </span>
            <div>
              <h2
                id="password-setup-dialog-title"
                className="text-base font-semibold text-ink"
              >
                设置 / 修改登录密码
              </h2>
              <p className="text-[11px] text-muted-ink">{userEmail}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="关闭弹窗"
            className="grid size-7 place-items-center rounded-lg text-muted-ink hover:bg-[#f2fbf6] hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="mt-4 space-y-3">
          <div>
            <label
              htmlFor="new-password-input"
              className="mb-1 block text-xs font-medium text-ink"
            >
              新登录密码（至少 8 位）
            </label>
            <input
              id="new-password-input"
              type="password"
              autoFocus
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
                setSuccess("");
              }}
              placeholder="请输入至少 8 位密码"
              className="w-full rounded-xl border border-[#cfead9] bg-[#f9fdfb] px-3 py-2 text-xs text-ink placeholder:text-neutral-400 focus:border-brand focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="confirm-password-input"
              className="mb-1 block text-xs font-medium text-ink"
            >
              确认新密码
            </label>
            <input
              id="confirm-password-input"
              type="password"
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError("");
                setSuccess("");
              }}
              placeholder="请再次输入新密码"
              className="w-full rounded-xl border border-[#cfead9] bg-[#f9fdfb] px-3 py-2 text-xs text-ink placeholder:text-neutral-400 focus:border-brand focus:bg-white focus:outline-none"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"
            >
              {error}
            </p>
          )}

          {success && (
            <p
              role="status"
              className="flex items-center gap-1.5 rounded-lg bg-[#e8f8ee] px-3 py-2 text-xs font-semibold text-[#0d853d]"
            >
              <Check size={14} className="shrink-0" />
              <span>{success}</span>
            </p>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={handleClose}
              className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[#d8efe1] bg-white px-3.5 text-xs font-medium text-ink transition-colors hover:bg-[#f4fbf6] disabled:opacity-60"
            >
              {success ? "完成" : "取消"}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-brand px-4 text-xs font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
            >
              {saving ? "保存中…" : "保存密码"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
