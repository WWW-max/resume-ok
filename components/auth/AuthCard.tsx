import Link from "next/link";
import type { ReactNode } from "react";
import { Brand } from "@/components/Brand";
import { ui } from "@/lib/ui-styles";

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="relative grid min-h-screen place-items-center bg-[linear-gradient(135deg,#f1fbf5,#ffffff,#eaf9f0)] px-4 py-16 text-ink">
      <Link
        href="/"
        aria-label="返回 ResumeOK 首页"
        className="absolute top-5 left-5 inline-flex rounded-lg sm:top-6 sm:left-8"
      >
        <Brand />
      </Link>
      <section className="w-full max-w-md rounded-3xl border border-green-100 bg-white p-5 shadow-[0_24px_70px_#174e2920] sm:p-6">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold tracking-tight text-ink">
            {title.endsWith("ResumeOK") ? (
              <>
                {title.slice(0, -"ResumeOK".length)}
                <span>
                  Resume<span className={ui["brand-ok"]}>OK</span>
                </span>
              </>
            ) : (
              title
            )}
          </h1>
          <p className="mt-1.5 text-sm leading-5 text-neutral-500">
            {description}
          </p>
        </div>
        <div className="mt-4">{children}</div>
        <div className="mt-4 border-t border-green-100 pt-3 text-center text-xs leading-5 text-neutral-500">
          {footer && <div className="mb-1.5">{footer}</div>}
          <p className="text-xs text-neutral-400">
            继续登录即表示您同意
            <Link
              href="/terms"
              className="mx-0.5 text-green-700 underline underline-offset-2 hover:text-brand"
            >
              《用户服务协议》
            </Link>
            与
            <Link
              href="/privacy"
              className="ml-0.5 text-green-700 underline underline-offset-2 hover:text-brand"
            >
              《隐私政策》
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
