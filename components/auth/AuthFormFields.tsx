import type { InputHTMLAttributes } from "react";

export function AuthField({
  label,
  placeholder,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <input
      aria-label={label}
      placeholder={placeholder ?? label}
      {...props}
      className="min-h-11 w-full rounded-xl border border-green-200 bg-white px-4 text-sm text-green-950 placeholder:text-neutral-400 outline-none transition focus:border-brand focus:ring-4 focus:ring-green-100 disabled:bg-neutral-50"
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
    <button
      type="submit"
      disabled={pending}
      className="mt-1 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-brand px-5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "请稍候…" : children}
    </button>
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
