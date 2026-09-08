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
    <main className="grid min-h-screen place-items-center bg-[linear-gradient(135deg,#f1fbf5,#ffffff,#eaf9f0)] px-5 py-12 text-ink">
      <section className="w-full max-w-md rounded-3xl border border-green-100 bg-white p-6 shadow-[0_24px_70px_#174e2920] sm:p-9">
        <Link href="/" aria-label="返回 ResumeOK 首页" className="inline-flex rounded-lg">
          <Brand />
        </Link>
        <h1 className="mt-8 text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-neutral-500">{description}</p>
        <div className="mt-7">{children}</div>
        <div className="mt-7 border-t border-green-100 pt-5 text-center text-sm text-neutral-500">
          {footer}
        </div>
      </section>
    </main>
  );
}
