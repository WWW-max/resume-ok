import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ViewStatisticDashboard } from "@/components/editor/ViewStatisticDashboard";
import { currentUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "在线简历访客统计",
  robots: { index: false, follow: false },
};

export default async function ViewStatisticPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string | string[] }>;
}) {
  const { slug } = await searchParams;
  const user = await currentUser();
  const initialSlug = typeof slug === "string" ? slug : "";
  if (!user) {
    const next = initialSlug
      ? `/view-statistic?slug=${encodeURIComponent(initialSlug)}`
      : "/view-statistic";
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  return <ViewStatisticDashboard initialSlug={initialSlug} />;
}
