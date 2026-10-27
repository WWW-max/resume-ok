import { NextResponse } from "next/server";
import {
  adminUpdateUserMembership,
  requireAdminUser,
} from "@/lib/server/admin";
import { jsonError, readJson, toApiError } from "@/lib/server/http";
import type { MembershipPlan } from "@/lib/membership";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireAdminUser();
    const body = await readJson<{
      email?: string;
      plan?: MembershipPlan;
    }>(request);

    const updatedUser = await adminUpdateUserMembership(
      body.email || "",
      body.plan || "quarterly",
    );

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    return jsonError(toApiError(error));
  }
}
