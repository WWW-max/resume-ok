import { currentUser } from "@/lib/server/auth";
import { withApiErrors } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiErrors(async () => {
  const user = await currentUser();
  if (!user)
    return Response.json(
      { error: { code: "unauthorized", message: "请先登录。" } },
      { status: 401 },
    );
  return Response.json({ user });
});
