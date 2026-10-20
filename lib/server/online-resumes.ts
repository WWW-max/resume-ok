import "server-only";
import { db } from "@/lib/server/db";
import { ApiError } from "@/lib/server/http";
import { isResumeData, parseLibrary } from "@/lib/resume-library";
import type { ResumeData } from "@/lib/resume-data";

let schemaEnsured = false;

async function ensureOnlineResumesTable() {
  if (schemaEnsured) return;
  await db().query(`
    CREATE TABLE IF NOT EXISTS online_resumes (
      slug text PRIMARY KEY,
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      document_id text NOT NULL,
      title text NOT NULL,
      resume_data jsonb NOT NULL,
      enabled boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT online_resumes_user_doc_unique UNIQUE (user_id, document_id)
    );
    CREATE INDEX IF NOT EXISTS online_resumes_user_id_idx ON online_resumes(user_id);
  `);
  schemaEnsured = true;
}

export function normalizeOnlineSlug(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw
    .trim()
    .replace(/[\r\n\t/\\?#%&]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export interface OnlineResumeRecord {
  slug: string;
  documentId: string;
  title: string;
  enabled: boolean;
  updatedAt: Date;
}

export async function listUserOnlineResumes(
  userId: string,
): Promise<OnlineResumeRecord[]> {
  await ensureOnlineResumesTable();
  const res = await db().query<{
    slug: string;
    document_id: string;
    title: string;
    enabled: boolean;
    updated_at: Date;
  }>(
    `SELECT slug, document_id, title, enabled, updated_at
     FROM online_resumes
     WHERE user_id = $1`,
    [userId],
  );
  return res.rows.map((r) => ({
    slug: r.slug,
    documentId: r.document_id,
    title: r.title,
    enabled: r.enabled,
    updatedAt: r.updated_at,
  }));
}

export async function publishOnlineResume(params: {
  userId: string;
  documentId: string;
  slug: string;
  title: string;
  data: ResumeData;
}): Promise<OnlineResumeRecord> {
  await ensureOnlineResumesTable();
  const slug = normalizeOnlineSlug(params.slug);
  if (!slug) {
    throw new ApiError(400, "invalid_slug", "请输入有效的在线简历链接名称。");
  }
  if (!isResumeData(params.data)) {
    throw new ApiError(400, "invalid_resume_data", "简历数据格式无效。");
  }

  // Check if another user or another document of the same user already owns this slug
  const existing = await db().query<{
    user_id: string;
    document_id: string;
  }>(
    `SELECT user_id, document_id FROM online_resumes WHERE slug = $1`,
    [slug],
  );
  const conflict = existing.rows[0];
  if (
    conflict &&
    (conflict.user_id !== params.userId ||
      conflict.document_id !== params.documentId)
  ) {
    throw new ApiError(
      409,
      "slug_taken",
      `链接后缀「${slug}」已被占用，请更换一个名称（例如加上岗位或编号）。`,
    );
  }

  // Upsert by (user_id, document_id) so renaming the slug updates the existing record
  const result = await db().query<{
    slug: string;
    document_id: string;
    title: string;
    enabled: boolean;
    updated_at: Date;
  }>(
    `INSERT INTO online_resumes (slug, user_id, document_id, title, resume_data, enabled, updated_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, true, now())
     ON CONFLICT (user_id, document_id) DO UPDATE
       SET slug = EXCLUDED.slug,
           title = EXCLUDED.title,
           resume_data = EXCLUDED.resume_data,
           enabled = true,
           updated_at = now()
     RETURNING slug, document_id, title, enabled, updated_at`,
    [
      slug,
      params.userId,
      params.documentId,
      params.title.trim().slice(0, 80) || slug,
      JSON.stringify(params.data),
    ],
  );

  const row = result.rows[0];
  return {
    slug: row.slug,
    documentId: row.document_id,
    title: row.title,
    enabled: row.enabled,
    updatedAt: row.updated_at,
  };
}

export async function unpublishOnlineResume(params: {
  userId: string;
  documentId: string;
}): Promise<void> {
  await ensureOnlineResumesTable();
  await db().query(
    `DELETE FROM online_resumes WHERE user_id = $1 AND document_id = $2`,
    [params.userId, params.documentId],
  );
}

export async function getPublicOnlineResumeBySlug(rawSlug: string): Promise<{
  slug: string;
  title: string;
  data: ResumeData;
  updatedAt: Date;
} | null> {
  await ensureOnlineResumesTable();
  const slug = rawSlug.trim();
  if (!slug) return null;

  const result = await db().query<{
    slug: string;
    user_id: string;
    document_id: string;
    title: string;
    resume_data: unknown;
    updated_at: Date;
    library: unknown;
  }>(
    `SELECT o.slug, o.user_id, o.document_id, o.title, o.resume_data, o.updated_at,
            l.library
     FROM online_resumes o
     LEFT JOIN resume_libraries l ON l.user_id = o.user_id
     WHERE o.slug = $1 AND o.enabled = true`,
    [slug],
  );

  const row = result.rows[0];
  if (!row) return null;

  // Prefer the live document from the user's resume_libraries if still present and not archived
  if (row.library) {
    try {
      const lib = parseLibrary(JSON.stringify(row.library));
      const liveDoc = lib.documents.find(
        (d) => d.id === row.document_id && !d.archived,
      );
      if (liveDoc && isResumeData(liveDoc.data)) {
        return {
          slug: row.slug,
          title: liveDoc.name || row.title,
          data: liveDoc.data,
          updatedAt: row.updated_at,
        };
      }
    } catch {
      // Fallback to snapshot stored in online_resumes
    }
  }

  if (isResumeData(row.resume_data)) {
    return {
      slug: row.slug,
      title: row.title,
      data: row.resume_data,
      updatedAt: row.updated_at,
    };
  }

  return null;
}
