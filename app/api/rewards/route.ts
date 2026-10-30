import { NextResponse } from "next/server";
import { currentUser } from "@/lib/server/auth";
import { handleRouteError, readJson } from "@/lib/server/http";
import {
  getUserRewardsOverview,
  submitUserFeedback,
} from "@/lib/server/rewards";

export async function GET() {
  try {
    const user = await currentUser();
    const overview = await getUserRewardsOverview(user?.id ?? null);
    return NextResponse.json(overview);
  } catch (err) {
    return handleRouteError(err);
  }
}

interface SubmitFeedbackBody {
  category?: string;
  content?: string;
  contact?: string;
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    const body = await readJson<SubmitFeedbackBody>(req);
    const feedback = await submitUserFeedback({
      userId: user?.id ?? null,
      userEmail: user?.email ?? null,
      category: body.category,
      content: body.content || "",
      contact: body.contact,
    });
    return NextResponse.json({ ok: true, feedback });
  } catch (err) {
    return handleRouteError(err);
  }
}
