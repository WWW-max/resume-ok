import { NextResponse } from "next/server";
import {
  generateRedemptionCodesBatch,
  requireAdminUser,
} from "@/lib/server/admin";
import { readJsonObject, withApiErrors } from "@/lib/server/http";

export const runtime = "nodejs";

export const POST = withApiErrors(async (request) => {
  await requireAdminUser();
  const body = await readJsonObject(request, 16 * 1024);

  const codes = await generateRedemptionCodesBatch(
    typeof body.planType === "string" && body.planType
      ? body.planType
      : "quarterly",
    Number(body.count || 1),
    typeof body.batchNote === "string" ? body.batchNote : "",
  );

  return NextResponse.json({ codes });
});
