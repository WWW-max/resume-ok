import Link from "next/link";
import type { ReactNode } from "react";
import { Brand } from "@/components/Brand";

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="grid min-h-screen place-items-center bg-[linear-gradient(135deg,#f1fbf5,#ffffff,#eaf9f0)] px-4 py-6 text-ink sm:py-8">
      <section className="w-full max-w-md rounded-3xl border border-green-100 bg-white p-5 shadow-[0_24px_70px_#174e2920] sm:p-7">
        <Link href="/" aria-label="返回 ResumeOK 首页" className="inline-flex rounded-lg">
          <Brand small />
        </Link>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1.5 text-sm leading-5 text-neutral-500">{description}</p>
        <div className="mt-5">{children}</div>
        <div className="mt-5 border-t border-green-100 pt-4 text-center text-xs leading-5 text-neutral-500 sm:text-sm">
          <div>{footer}</div>
          <p className="mt-2 text-xs text-neutral-400">
            继续登录即表示您同意{" "}
            <Link
              href="/terms"
              className="text-green-700 underline underline-offset-2 hover:text-brand"
            >
              《用户服务协议》
            </Link>{" "}
            与{" "}
            <Link
              href="/privacy"
              className="text-green-700 underline underline-offset-2 hover:text-brand"
            >
              《隐私政策》
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
