import { AuthCard } from "@/components/auth/AuthCard";
import { LoginForm } from "@/components/auth/LoginForm";
import { safeNextPath } from "@/lib/auth-validation";

export const metadata = { title: "登录 / 注册 · ResumeOK" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : undefined);
  const mailboxUrl = process.env.NODE_ENV === "development" ? (process.env.NEXT_PUBLIC_MAILBOX_URL ?? "http://localhost:8025") : "";
  return (
    <AuthCard title="欢迎使用 ResumeOK" description="登录或注册，随时随地继续完善你的简历。" footer="首次使用？输入邮箱并验证即可，无需单独注册。">
      <LoginForm next={next} mailboxUrl={mailboxUrl} />
    </AuthCard>
  );
}
