import { NextResponse } from "next/server";
import {
  adminUpdateUserMembership,
  requireAdminUser,
} from "@/lib/server/admin";
import { readJsonObject, withApiErrors } from "@/lib/server/http";
import type { MembershipPlan } from "@/lib/membership";

export const runtime = "nodejs";

export const POST = withApiErrors(async (request) => {
  await requireAdminUser();
  const body = await readJsonObject(request, 16 * 1024);

  const updatedUser = await adminUpdateUserMembership(
    typeof body.email === "string" ? body.email : "",
    (typeof body.plan === "string" && body.plan
      ? body.plan
      : "quarterly") as MembershipPlan,
  );

  return NextResponse.json({ user: updatedUser });
});
