import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { currentUser } from "@/lib/server/auth";
import { getAdminDashboardData, isAdminEmail } from "@/lib/server/admin";
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "运营管理中台 — ResumeOK",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminDashboardPage() {
  const user = await currentUser();
  if (!user || !isAdminEmail(user.email)) {
    notFound();
  }

  const initialData = await getAdminDashboardData(7);

  return (
    <AdminDashboardClient adminEmail={user.email} initialData={initialData} />
  );
}
