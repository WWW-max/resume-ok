import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { safeNextPath } from "@/lib/auth-validation";

export const metadata = { title: "注册 · ResumeOK" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : undefined);
  return (
    <AuthCard title="创建 ResumeOK 账号" description="用邮箱注册，开始在不同设备安全访问你的简历。" footer={<>已有账号？ <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-green-700 hover:text-brand">立即登录</Link></>}>
      <RegisterForm next={next} />
    </AuthCard>
  );
}
