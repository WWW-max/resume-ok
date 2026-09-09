import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/auth-validation";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string | string[] }> }) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : undefined);
  redirect(`/login?next=${encodeURIComponent(next)}`);
}
