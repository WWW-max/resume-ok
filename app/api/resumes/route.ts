import { parseLibrary } from "@/lib/resume-library";
import { db } from "@/lib/server/db";
import { requireUser } from "@/lib/server/auth";
import {
  ApiError,
  readJsonObject,
  requireSameOrigin,
  withApiErrors,
} from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_LIBRARY_BYTES = 5 * 1024 * 1024;

export const GET = withApiErrors(async () => {
  const user = await requireUser();
  const result = await db().query<{ library: unknown; updated_at: Date }>(
    "SELECT library, updated_at FROM resume_libraries WHERE user_id = $1",
    [user.id],
  );
  const row = result.rows[0];
  if (!row) return Response.json({ library: null, updatedAt: null });
  const library = parseLibrary(JSON.stringify(row.library));
  return Response.json({ library, updatedAt: row.updated_at });
});

export const PUT = withApiErrors(async (request) => {
  requireSameOrigin(request);
  const user = await requireUser();
  const body = await readJsonObject(request, MAX_LIBRARY_BYTES);
  if (!("library" in body))
    throw new ApiError(400, "invalid_library", "缺少简历库数据。");
  let library;
  try {
    library = parseLibrary(JSON.stringify(body.library));
  } catch {
    throw new ApiError(400, "invalid_library", "简历库格式无效。");
  }
  const result = await db().query<{ updated_at: Date }>(
    `INSERT INTO resume_libraries (user_id, version, library)
     VALUES ($1, $2, $3::jsonb)
     ON CONFLICT (user_id) DO UPDATE
       SET version = EXCLUDED.version,
           library = EXCLUDED.library,
           updated_at = now()
     RETURNING updated_at`,
    [user.id, library.version, JSON.stringify(library)],
  );
  return Response.json({ ok: true, updatedAt: result.rows[0].updated_at });
});
