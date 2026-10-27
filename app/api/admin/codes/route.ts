import { NextResponse } from "next/server";
import {
  generateRedemptionCodesBatch,
  requireAdminUser,
} from "@/lib/server/admin";
import { jsonError, readJson, toApiError } from "@/lib/server/http";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireAdminUser();
    const body = await readJson<{
      planType?: string;
      count?: number;
      batchNote?: string;
    }>(request);

    const codes = await generateRedemptionCodesBatch(
      body.planType || "quarterly",
      Number(body.count || 1),
      body.batchNote || "",
    );

    return NextResponse.json({ codes });
  } catch (error) {
    return jsonError(toApiError(error));
  }
}
