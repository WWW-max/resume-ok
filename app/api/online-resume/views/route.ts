import { requireUser } from "@/lib/server/auth";
import { withApiErrors } from "@/lib/server/http";
import { queryUserOnlineResumeViews } from "@/lib/server/online-resumes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withApiErrors(async (request) => {
  const user = await requireUser();
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug") || "";
  const query = url.searchParams.get("q") || "";
  const downloadedOnly = url.searchParams.get("downloadedOnly") === "1";
  const offset = Number(url.searchParams.get("offset")) || 0;
  const limit = Number(url.searchParams.get("limit")) || 20;

  const data = await queryUserOnlineResumeViews({
    userId: user.id,
    slug,
    query,
    downloadedOnly,
    offset,
    limit,
  });

  return Response.json(data);
});
