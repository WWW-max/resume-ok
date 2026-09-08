"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { safeNextPath } from "@/lib/auth-validation";
import { AuthField, AuthSubmit, apiMessage } from "./AuthFormFields";

export function RegisterForm({ next }: { next: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password !== String(form.get("confirmPassword") ?? "")) {
      setError("两次输入的密码不一致。");
      return;
    }
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password }),
      });
      if (!response.ok) throw new Error(await apiMessage(response));
      router.replace(safeNextPath(next));
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "注册失败，请稍后重试。");
    } finally {
      setPending(false);
    }
  }
  return (
    <form onSubmit={submit} className="grid gap-4">
      <AuthField label="邮箱" name="email" type="email" autoComplete="email" required maxLength={254} />
      <AuthField label="密码" name="password" type="password" autoComplete="new-password" required minLength={8} aria-describedby="password-hint" />
      <p id="password-hint" className="-mt-2 text-xs text-neutral-500">至少 8 个字符，最多 72 个 UTF-8 字节。</p>
      <AuthField label="确认密码" name="confirmPassword" type="password" autoComplete="new-password" required minLength={8} />
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <AuthSubmit pending={pending}>创建账号</AuthSubmit>
    </form>
  );
}
