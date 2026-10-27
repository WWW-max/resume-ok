import { NextResponse } from "next/server";
import { getAdminDashboardData, requireAdminUser } from "@/lib/server/admin";
import { withApiErrors } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiErrors(async (request) => {
  await requireAdminUser();
  const { searchParams } = new URL(request.url);
  const daysParam = Number.parseInt(searchParams.get("days") || "7", 10);
  const snapshot = await getAdminDashboardData(daysParam);
  return NextResponse.json(snapshot);
});
