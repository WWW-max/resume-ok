import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { safeNextPath } from "@/lib/auth-validation";
import { db } from "@/lib/server/db";
import { googleConfig } from "@/lib/server/google-config";
import { hashSessionToken } from "@/lib/session-token";
import { cookies } from "next/headers";
import Image from "next/image";

export const metadata = { title: "登录 / 注册 · ResumeOK" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string | string[];
    error?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const next = safeNextPath(
    typeof params.next === "string" ? params.next : undefined
  );
  const mailboxUrl =
    process.env.NODE_ENV === "development"
      ? process.env.NEXT_PUBLIC_MAILBOX_URL ?? "http://localhost:8025"
      : "";
  const errors: Record<string, string> = {
    google_unavailable: "Google 登录暂不可用，请使用邮箱登录。",
    google_failed: "Google 登录未能完成，请重试或使用邮箱登录。",
    google_expired: "Google 登录请求已过期，请重新点击登录。",
    google_cancelled: "已取消 Google 登录，你可以重试或使用邮箱登录。",
    google_verify_email:
      "请先验证 Google 账号使用的邮箱，完成后会自动关联，下次即可直接使用 Google 登录。",
  };
  const notice =
    typeof params.error === "string" ? errors[params.error] : undefined;
  let googleEmail = "";
  const pending = (await cookies()).get("resumeok_google_link")?.value;
  if (pending && /^[\w-]{43}$/.test(pending)) {
    const result = await db().query<{ email: string }>(
      "SELECT email FROM google_email_links WHERE token_hash = $1 AND expires_at > now()",
      [hashSessionToken(pending)]
    );
    googleEmail = result.rows[0]?.email ?? "";
  }
  return (
    <AuthCard
      title="欢迎使用 ResumeOK"
      description="登录或注册，随时随地继续完善你的简历。"
      footer="首次登录会自动创建账号，无需单独注册。"
    >
      {notice && (
        <p
          role="status"
          className="mb-5 rounded-xl bg-green-50 px-4 py-3 text-sm leading-6 text-green-900"
        >
          {notice}
        </p>
      )}
      {googleConfig() ? (
        <form action="/api/auth/google" method="get" className="mb-5">
          <input type="hidden" name="next" value={next} />
          <button
            type="submit"
            className="flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-neutral-500 bg-white px-3 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <Image
              src="/brand/google-g.png"
              className="object-contain"
              width={20}
              height={20}
              alt=""
              unoptimized
            />
            使用 Google 登录
          </button>
        </form>
      ) : (
        <div className="mb-5">
          <button
            type="button"
            disabled
            aria-describedby="google-unavailable"
            className="flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-500 disabled:cursor-not-allowed"
          >
            <Image
              src="/brand/google-g.png"
              className="object-contain"
              width={20}
              height={20}
              alt=""
              unoptimized
            />
            使用 Google 登录
          </button>
          <p
            id="google-unavailable"
            className="mt-2 text-center text-xs text-neutral-500"
          >
            暂不可用，请使用邮箱登录
          </p>
        </div>
      )}
      <div className="mb-5 flex items-center gap-3 text-xs text-neutral-400">
        <span className="h-px flex-1 bg-neutral-100" />
        或使用邮箱
        <span className="h-px flex-1 bg-neutral-100" />
      </div>
      <LoginForm
        key={googleEmail}
        next={next}
        mailboxUrl={mailboxUrl}
        initialEmail={googleEmail}
      />
    </AuthCard>
  );
}
