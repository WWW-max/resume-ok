import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { safeNextPath } from "@/lib/auth-validation";

export const metadata = { title: "登录 · ResumeOK" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : undefined);
  const mailboxUrl = process.env.NEXT_PUBLIC_MAILBOX_URL ?? "http://localhost:8025";
  return (
    <AuthCard title="欢迎回来" description="登录后，你的简历会保存在账号专属的 PostgreSQL 数据中。" footer={<>还没有账号？ <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-semibold text-green-700 hover:text-brand">免费注册</Link></>}>
      <LoginForm next={next} mailboxUrl={mailboxUrl} />
    </AuthCard>
  );
}
