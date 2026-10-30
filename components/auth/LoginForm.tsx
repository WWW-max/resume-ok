"use client";
import { safeNextPath } from "@/lib/auth-validation";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function requestCode(form: HTMLFormElement) {
    if (requesting || cooldown > 0) return;
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
      setCooldown(60);
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
      <Tabs
        value={mode}
        onValueChange={(value) => {
          setMode(value as Mode);
          setError("");
          setMessage("");
        }}
      >
        <TabsList
          aria-label="登录方式"
          className="grid h-11 w-full grid-cols-2 rounded-xl bg-green-50 p-1"
        >
          <TabsTrigger
            value="code"
            className="min-h-9 rounded-lg text-sm font-medium text-neutral-500 data-[state=active]:bg-white data-[state=active]:text-green-800 data-[state=active]:shadow-sm"
          >
            验证码登录
          </TabsTrigger>
          <TabsTrigger
            value="password"
            className="min-h-9 rounded-lg text-sm font-medium text-neutral-500 data-[state=active]:bg-white data-[state=active]:text-green-800 data-[state=active]:shadow-sm"
          >
            密码登录
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <form onSubmit={submit} className="mt-4 grid gap-3">
        <AuthField
          label="邮箱"
          placeholder="请输入邮箱"
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
            placeholder="请输入密码"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        ) : (
          <div className="grid grid-cols-[1fr_auto] items-center gap-2">
            <AuthField
              label="6 位验证码"
              placeholder="请输入 6 位验证码"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
            />
            <Button
              type="button"
              variant="outline"
              disabled={requesting || cooldown > 0}
              onClick={(event) => requestCode(event.currentTarget.form!)}
              className="min-h-11 min-w-28 rounded-xl border-green-200 bg-white px-4 text-sm font-medium tabular-nums text-green-700 shadow-none hover:bg-green-50 hover:text-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {requesting
                ? "发送中…"
                : cooldown > 0
                  ? `${cooldown}s 后重发`
                  : "发送验证码"}
            </Button>
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
        <AuthSubmit pending={pending}>
          {mode === "code" ? "登录 / 注册" : "登录"}
        </AuthSubmit>
      </form>
    </>
  );
}
