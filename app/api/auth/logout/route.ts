import { endSession } from "@/lib/server/auth";
import { requireSameOrigin, withApiErrors } from "@/lib/server/http";

export const runtime = "nodejs";

export const POST = withApiErrors(async (request) => {
  requireSameOrigin(request);
  await endSession();
  return Response.json({ ok: true });
});
