"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { safeNextPath } from "@/lib/auth-validation";
import { AuthField, AuthSubmit, apiMessage } from "./AuthFormFields";

type Mode = "password" | "code";

export function LoginForm({ next, mailboxUrl }: { next: string; mailboxUrl: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("password");
  const [pending, setPending] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function requestCode(form: HTMLFormElement) {
    if (requesting) return;
    const email = new FormData(form).get("email");
    if (!email) {
      setError("请先输入邮箱。");
      return;
    }
    setRequesting(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/auth/login/code/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const text = await apiMessage(response);
      if (!response.ok) throw new Error(text);
      setMessage(`${text} 本地开发时请在 Mailpit 收件箱查看。`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "验证码请求失败。");
    } finally {
      setRequesting(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError("");
    try {
      const endpoint = mode === "password" ? "/api/auth/login/password" : "/api/auth/login/code/verify";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          ...(mode === "password" ? { password: form.get("password") } : { code: form.get("code") }),
        }),
      });
      if (!response.ok) throw new Error(await apiMessage(response));
      router.replace(safeNextPath(next));
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "登录失败，请稍后重试。");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 rounded-xl bg-green-50 p-1" role="tablist" aria-label="登录方式">
        {(["password", "code"] as const).map((value) => (
          <button key={value} type="button" role="tab" aria-selected={mode === value} onClick={() => { setMode(value); setError(""); setMessage(""); }} className={`min-h-10 rounded-lg text-sm font-medium ${mode === value ? "bg-white text-green-800 shadow-sm" : "text-neutral-500"}`}>
            {value === "password" ? "密码登录" : "验证码登录"}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="mt-5 grid gap-4">
        <AuthField label="邮箱" name="email" type="email" autoComplete="email" required maxLength={254} />
        {mode === "password" ? (
          <AuthField label="密码" name="password" type="password" autoComplete="current-password" required />
        ) : (
          <div className="grid grid-cols-[1fr_auto] items-end gap-2">
            <AuthField label="6 位验证码" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required />
            <button type="button" disabled={requesting} onClick={(event) => requestCode(event.currentTarget.form!)} className="min-h-12 rounded-xl border border-green-200 px-4 text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-60">
              {requesting ? "发送中…" : "发送验证码"}
            </button>
          </div>
        )}
        {message && <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm leading-6 text-green-800">{message} <a href={mailboxUrl} target="_blank" rel="noreferrer" className="font-semibold underline">打开 Mailpit</a></p>}
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <AuthSubmit pending={pending}>登录</AuthSubmit>
      </form>
    </>
  );
}
