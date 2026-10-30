import type { InputHTMLAttributes } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AuthField({
  label,
  placeholder,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <Input
      aria-label={label}
      placeholder={placeholder ?? label}
      {...props}
      className="min-h-11 rounded-xl border-green-200 bg-white px-4 text-sm text-green-950 placeholder:text-neutral-400 focus:border-brand disabled:bg-neutral-50"
    />
  );
}

export function AuthSubmit({
  pending,
  children,
}: {
  pending: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="submit"
      disabled={pending}
      className="mt-1 min-h-11 w-full rounded-xl bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "请稍候…" : children}
    </Button>
  );
}

export async function apiMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return body?.error?.message || body?.message || "请求失败，请稍后重试。";
  } catch {
    return "请求失败，请稍后重试。";
  }
}
