import { requireUser } from "@/lib/server/auth";
import {
  ApiError,
  readJsonObject,
  requireSameOrigin,
  withApiErrors,
} from "@/lib/server/http";
import {
  listUserOnlineResumes,
  publishOnlineResume,
  unpublishOnlineResume,
} from "@/lib/server/online-resumes";
import { isResumeData } from "@/lib/resume-library";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 2 * 1024 * 1024;

export const GET = withApiErrors(async () => {
  const user = await requireUser();
  const items = await listUserOnlineResumes(user.id);
  return Response.json({ items });
});

export const POST = withApiErrors(async (request) => {
  requireSameOrigin(request);
  const user = await requireUser();
  const body = await readJsonObject(request, MAX_BODY_BYTES);

  const documentId =
    typeof body.documentId === "string" ? body.documentId.trim() : "";
  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const title = typeof body.title === "string" ? body.title.trim() : slug;

  if (!documentId) {
    throw new ApiError(400, "missing_document_id", "缺少简历文档 ID。");
  }
  if (!isResumeData(body.data)) {
    throw new ApiError(400, "invalid_resume_data", "简历数据格式无效。");
  }

  const record = await publishOnlineResume({
    userId: user.id,
    documentId,
    slug,
    title,
    data: body.data,
  });

  return Response.json({ item: record });
});

export const DELETE = withApiErrors(async (request) => {
  requireSameOrigin(request);
  const user = await requireUser();
  const body = await readJsonObject(request, 64 * 1024);

  const documentId =
    typeof body.documentId === "string" ? body.documentId.trim() : "";
  if (!documentId) {
    throw new ApiError(400, "missing_document_id", "缺少简历文档 ID。");
  }

  await unpublishOnlineResume({
    userId: user.id,
    documentId,
  });

  return Response.json({ ok: true });
});
