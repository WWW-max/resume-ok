import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/server/admin";
import { ApiError, handleRouteError, readJson } from "@/lib/server/http";
import { adminAdoptFeedback } from "@/lib/server/rewards";

interface AdoptFeedbackBody {
  feedbackId?: string;
  adminNote?: string;
}

export async function POST(req: Request) {
  try {
    await requireAdminUser();
    const body = await readJson<AdoptFeedbackBody>(req);
    if (!body.feedbackId) {
      throw new ApiError(400, "missing_feedback_id", "缺少反馈记录 ID。");
    }
    const result = await adminAdoptFeedback(body.feedbackId, body.adminNote);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return handleRouteError(err);
  }
}
