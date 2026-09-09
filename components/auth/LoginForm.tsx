"use client";
import { safeNextPath } from "@/lib/auth-validation";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthField, AuthSubmit, apiMessage } from "./AuthFormFields";

type Mode = "password" | "code";

export function LoginForm({
  next,
  mailboxUrl,
  initialEmail = "",
}: {
  next: string;
  mailboxUrl: string;
  initialEmail?: string;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("code");
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
      setMessage(text);
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
      const endpoint =
        mode === "password"
          ? "/api/auth/login/password"
          : "/api/auth/login/code/verify";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          ...(mode === "password"
            ? { password: form.get("password") }
            : { code: form.get("code") }),
        }),
      });
      if (!response.ok) throw new Error(await apiMessage(response));
      router.replace(safeNextPath(next));
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "登录失败，请稍后重试。"
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <div
        className="grid grid-cols-2 rounded-xl bg-green-50 p-1"
        role="tablist"
        aria-label="登录方式"
      >
        {(["code", "password"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => {
              setMode(value);
              setError("");
              setMessage("");
            }}
            className={`min-h-10 rounded-lg text-sm font-medium ${
              mode === value
                ? "bg-white text-green-800 shadow-sm"
                : "text-neutral-500"
            }`}
          >
            {value === "password" ? "密码登录" : "验证码登录"}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="mt-5 grid gap-4">
        <AuthField
          label="邮箱"
          name="email"
          defaultValue={initialEmail}
          type="email"
          autoComplete="email"
          required
          maxLength={254}
        />
        {mode === "password" ? (
          <AuthField
            label="密码"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        ) : (
          <div className="grid grid-cols-[1fr_auto] items-end gap-2">
            <AuthField
              label="6 位验证码"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
            />
            <button
              type="button"
              disabled={requesting}
              onClick={(event) => requestCode(event.currentTarget.form!)}
              className="min-h-12 rounded-xl border border-green-200 px-4 text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-60"
            >
              {requesting ? "发送中…" : "发送验证码"}
            </button>
          </div>
        )}
        {message && (
          <p
            role="status"
            className="rounded-lg bg-green-50 px-3 py-2 text-sm leading-6 text-green-800"
          >
            {message}{" "}
            {mailboxUrl && (
              <a
                href={mailboxUrl}
                target="_blank"
                rel="noreferrer"
                className="font-semibold underline"
              >
                打开开发收件箱
              </a>
            )}
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <p className="text-xs leading-5 text-neutral-500">
          {mode === "code"
            ? "未注册的邮箱将在验证成功后自动创建账号。"
            : "密码登录仅适用于已设置密码的账号，新用户请使用验证码登录。"}
        </p>
        <AuthSubmit pending={pending}>
          {mode === "code" ? "登录 / 注册" : "登录"}
        </AuthSubmit>
      </form>
    </>
  );
}
