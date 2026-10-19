import { createLibrary, parseLibrary } from "@/lib/resume-library";
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
  if (!row) {
    const initial = createLibrary();
    const inserted = await db().query<{ library: unknown; updated_at: Date }>(
      `INSERT INTO resume_libraries (user_id, version, library)
       VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (user_id) DO UPDATE
         SET updated_at = resume_libraries.updated_at
       RETURNING library, updated_at`,
      [user.id, initial.version, JSON.stringify(initial)],
    );
    const created = inserted.rows[0];
    return Response.json({
      userId: user.id,
      library: parseLibrary(JSON.stringify(created.library)),
      updatedAt: created.updated_at,
    });
  }
  const raw = JSON.stringify(row.library);
  const library = parseLibrary(raw);
  const normalized = JSON.stringify(library);
  if (normalized !== raw) {
    await db().query(
      "UPDATE resume_libraries SET library = $2::jsonb, version = $3 WHERE user_id = $1",
      [user.id, normalized, library.version],
    );
  }
  return Response.json({
    userId: user.id,
    library,
    updatedAt: row.updated_at,
  });
});

export const PUT = withApiErrors(async (request) => {
  requireSameOrigin(request);
  const user = await requireUser();
  const body = await readJsonObject(request, MAX_LIBRARY_BYTES);
  if (typeof body.userId === "string" && body.userId !== user.id)
    throw new ApiError(409, "user_mismatch", "当前登录账号已变更，请刷新页面。");
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
