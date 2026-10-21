import { requireUser } from "@/lib/server/auth";
import {
  readJsonObject,
  requireSameOrigin,
  withApiErrors,
} from "@/lib/server/http";
import { redeemMembershipCode } from "@/lib/server/membership";

export const runtime = "nodejs";

export const GET = withApiErrors(async () => {
  const user = await requireUser();
  return Response.json({
    membership: {
      plan: user.membershipPlan,
      expiresAt: user.membershipExpiresAt,
      isPro: user.isPro,
      planLabel: user.planLabel,
    },
  });
});

export const POST = withApiErrors(async (request) => {
  requireSameOrigin(request);
  const user = await requireUser();
  const body = await readJsonObject(request, 2048);
  const code = typeof body.code === "string" ? body.code : "";
  const membership = await redeemMembershipCode(user.id, user.email, code);
  return Response.json({ membership });
});
