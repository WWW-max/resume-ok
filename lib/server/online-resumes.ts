import "server-only";
import { db } from "@/lib/server/db";
import { ApiError } from "@/lib/server/http";
import { isResumeData } from "@/lib/resume-library";
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

    CREATE TABLE IF NOT EXISTS online_resume_views (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      slug text NOT NULL REFERENCES online_resumes(slug) ON DELETE CASCADE,
      source_tag text NOT NULL DEFAULT '',
      device_label text NOT NULL DEFAULT '',
      ip_address text NOT NULL DEFAULT '',
      downloaded_pdf boolean NOT NULL DEFAULT false,
      viewed_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS online_resume_views_slug_viewed_idx
      ON online_resume_views(slug, viewed_at DESC);
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

export function parseVisitorDevice(userAgent: string): string {
  const ua = userAgent || "";
  let os = "";
  if (/iPhone/i.test(ua)) os = "iPhone";
  else if (/iPad/i.test(ua)) os = "iPad";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Macintosh|Mac OS X/i.test(ua)) os = "Mac";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/Linux/i.test(ua)) os = "Linux";

  const isDesktop = os === "Mac" || os === "Windows" || os === "Linux";
  let app = "浏览器";
  if (/Feishu|Lark/i.test(ua)) app = isDesktop ? "飞书桌面端" : "飞书";
  else if (/DingTalk/i.test(ua)) app = isDesktop ? "钉钉桌面端" : "钉钉";
  else if (/wxwork/i.test(ua)) app = isDesktop ? "企业微信桌面端" : "企业微信";
  else if (/MicroMessenger/i.test(ua)) app = isDesktop ? "微信桌面端" : "微信";
  else if (/Edg\//i.test(ua)) app = "Edge";
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) app = "Chrome";
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) app = "Safari";
  else if (/Firefox/i.test(ua)) app = "Firefox";

  return os ? `${app} (${os})` : app;
}

export interface OnlineResumeViewItem {
  id: string;
  slug: string;
  resumeTitle: string;
  sourceTag: string;
  deviceLabel: string;
  ipAddress: string;
  downloadedPdf: boolean;
  viewedAt: string;
}

export interface OnlineResumeRecord {
  slug: string;
  documentId: string;
  title: string;
  enabled: boolean;
  updatedAt: Date;
  resumeData: ResumeData | null;
  totalViews: number;
  totalDownloads: number;
  recentViews: OnlineResumeViewItem[];
}

export async function listUserOnlineResumes(
  userId: string,
): Promise<OnlineResumeRecord[]> {
  await ensureOnlineResumesTable();
  const res = await db().query<{
    slug: string;
    document_id: string;
    title: string;
    resume_data: unknown;
    enabled: boolean;
    updated_at: Date;
    total_views: string;
    total_downloads: string;
  }>(
    `SELECT o.slug, o.document_id, o.title, o.resume_data, o.enabled, o.updated_at,
            COUNT(v.id)::text AS total_views,
            COUNT(v.id) FILTER (WHERE v.downloaded_pdf = true)::text AS total_downloads
     FROM online_resumes o
     LEFT JOIN online_resume_views v ON v.slug = o.slug
     WHERE o.user_id = $1
     GROUP BY o.slug, o.document_id, o.title, o.resume_data, o.enabled, o.updated_at`,
    [userId],
  );

  if (res.rows.length === 0) return [];

  const slugs = res.rows.map((r) => r.slug);
  const viewsRes = await db().query<{
    id: string;
    slug: string;
    source_tag: string;
    device_label: string;
    ip_address: string;
    downloaded_pdf: boolean;
    viewed_at: Date;
  }>(
    `SELECT id, slug, source_tag, device_label, ip_address, downloaded_pdf, viewed_at
     FROM online_resume_views
     WHERE slug = ANY($1::text[])
     ORDER BY viewed_at DESC
     LIMIT 100`,
    [slugs],
  );

  const titleBySlug = new Map(res.rows.map((r) => [r.slug, r.title]));
  const viewsBySlug = new Map<string, OnlineResumeViewItem[]>();
  for (const v of viewsRes.rows) {
    const list = viewsBySlug.get(v.slug) ?? [];
    if (list.length < 5) {
      list.push({
        id: v.id,
        slug: v.slug,
        resumeTitle: titleBySlug.get(v.slug) || v.slug,
        sourceTag: v.source_tag,
        deviceLabel: v.device_label,
        ipAddress: v.ip_address,
        downloadedPdf: v.downloaded_pdf,
        viewedAt: v.viewed_at.toISOString(),
      });
      viewsBySlug.set(v.slug, list);
    }
  }

  return res.rows.map((r) => ({
    slug: r.slug,
    documentId: r.document_id,
    title: r.title,
    enabled: r.enabled,
    updatedAt: r.updated_at,
    resumeData: isResumeData(r.resume_data) ? r.resume_data : null,
    totalViews: Number(r.total_views) || 0,
    totalDownloads: Number(r.total_downloads) || 0,
    recentViews: viewsBySlug.get(r.slug) ?? [],
  }));
}

export type StatsTimePeriod = "all" | "day" | "week" | "month";

export async function queryUserOnlineResumeViews(params: {
  userId: string;
  slug?: string;
  query?: string;
  downloadedOnly?: boolean;
  period?: StatsTimePeriod;
  offset?: number;
  limit?: number;
}): Promise<{
  resumes: Array<{ slug: string; title: string }>;
  summary: {
    totalViews: number;
    uniqueVisitors: number;
    totalDownloads: number;
  };
  total: number;
  hasMore: boolean;
  items: OnlineResumeViewItem[];
}> {
  await ensureOnlineResumesTable();
  const limit = Math.min(50, Math.max(1, params.limit ?? 20));
  const offset = Math.max(0, params.offset ?? 0);
  const slugFilter = params.slug?.trim() || "";
  const searchQuery = params.query?.trim() || "";
  const downloadedOnly = Boolean(params.downloadedOnly);
  const period: StatsTimePeriod =
    params.period === "day" ||
    params.period === "week" ||
    params.period === "month"
      ? params.period
      : "all";

  const resumesRes = await db().query<{ slug: string; title: string }>(
    `SELECT slug, title FROM online_resumes WHERE user_id = $1 ORDER BY updated_at DESC`,
    [params.userId],
  );
  const resumes = resumesRes.rows;
  if (resumes.length === 0) {
    return {
      resumes: [],
      summary: { totalViews: 0, uniqueVisitors: 0, totalDownloads: 0 },
      total: 0,
      hasMore: false,
      items: [],
    };
  }

  const summaryRes = await db().query<{
    total_views: string;
    unique_visitors: string;
    total_downloads: string;
  }>(
    `SELECT COUNT(v.id)::text AS total_views,
            COUNT(DISTINCT NULLIF(v.ip_address, ''))::text AS unique_visitors,
            COUNT(v.id) FILTER (WHERE v.downloaded_pdf = true)::text AS total_downloads
     FROM online_resume_views v
     INNER JOIN online_resumes o ON o.slug = v.slug
     WHERE o.user_id = $1
       AND ($2 = '' OR o.slug = $2)
       AND (
         $3 = 'all'
         OR ($3 = 'day' AND v.viewed_at >= date_trunc('day', now()))
         OR ($3 = 'week' AND v.viewed_at >= now() - interval '7 days')
         OR ($3 = 'month' AND v.viewed_at >= now() - interval '30 days')
       )`,
    [params.userId, slugFilter, period],
  );
  const sRow = summaryRes.rows[0];

  const countRes = await db().query<{ total: string }>(
    `SELECT COUNT(v.id)::text AS total
     FROM online_resume_views v
     INNER JOIN online_resumes o ON o.slug = v.slug
     WHERE o.user_id = $1
       AND ($2 = '' OR o.slug = $2)
       AND ($3 = '' OR v.source_tag ILIKE '%' || $3 || '%' OR v.ip_address ILIKE '%' || $3 || '%' OR v.device_label ILIKE '%' || $3 || '%')
       AND ($4 = false OR v.downloaded_pdf = true)
       AND (
         $5 = 'all'
         OR ($5 = 'day' AND v.viewed_at >= date_trunc('day', now()))
         OR ($5 = 'week' AND v.viewed_at >= now() - interval '7 days')
         OR ($5 = 'month' AND v.viewed_at >= now() - interval '30 days')
       )`,
    [params.userId, slugFilter, searchQuery, downloadedOnly, period],
  );
  const total = Number(countRes.rows[0]?.total) || 0;

  const listRes = await db().query<{
    id: string;
    slug: string;
    title: string;
    source_tag: string;
    device_label: string;
    ip_address: string;
    downloaded_pdf: boolean;
    viewed_at: Date;
  }>(
    `SELECT v.id, v.slug, o.title, v.source_tag, v.device_label, v.ip_address, v.downloaded_pdf, v.viewed_at
     FROM online_resume_views v
     INNER JOIN online_resumes o ON o.slug = v.slug
     WHERE o.user_id = $1
       AND ($2 = '' OR o.slug = $2)
       AND ($3 = '' OR v.source_tag ILIKE '%' || $3 || '%' OR v.ip_address ILIKE '%' || $3 || '%' OR v.device_label ILIKE '%' || $3 || '%')
       AND ($4 = false OR v.downloaded_pdf = true)
       AND (
         $5 = 'all'
         OR ($5 = 'day' AND v.viewed_at >= date_trunc('day', now()))
         OR ($5 = 'week' AND v.viewed_at >= now() - interval '7 days')
         OR ($5 = 'month' AND v.viewed_at >= now() - interval '30 days')
       )
     ORDER BY v.viewed_at DESC
     LIMIT $6 OFFSET $7`,
    [
      params.userId,
      slugFilter,
      searchQuery,
      downloadedOnly,
      period,
      limit,
      offset,
    ],
  );

  const items: OnlineResumeViewItem[] = listRes.rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    resumeTitle: r.title || r.slug,
    sourceTag: r.source_tag,
    deviceLabel: r.device_label,
    ipAddress: r.ip_address,
    downloadedPdf: r.downloaded_pdf,
    viewedAt: r.viewed_at.toISOString(),
  }));

  return {
    resumes,
    summary: {
      totalViews: Number(sRow?.total_views) || 0,
      uniqueVisitors: Number(sRow?.unique_visitors) || 0,
      totalDownloads: Number(sRow?.total_downloads) || 0,
    },
    total,
    hasMore: offset + items.length < total,
    items,
  };
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

  await db().query(
    `INSERT INTO online_resumes (slug, user_id, document_id, title, resume_data, enabled, updated_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, true, now())
     ON CONFLICT (user_id, document_id) DO UPDATE
       SET slug = EXCLUDED.slug,
           title = EXCLUDED.title,
           resume_data = EXCLUDED.resume_data,
           enabled = true,
           updated_at = now()`,
    [
      slug,
      params.userId,
      params.documentId,
      params.title.trim().slice(0, 80) || slug,
      JSON.stringify(params.data),
    ],
  );

  const all = await listUserOnlineResumes(params.userId);
  const matched = all.find((item) => item.documentId === params.documentId);
  if (!matched) {
    throw new ApiError(500, "publish_failed", "保存失败，请重试。");
  }
  return matched;
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

export async function recordOnlineResumeVisit(params: {
  slug: string;
  sourceTag: string;
  userAgent: string;
  ipAddress: string;
}): Promise<string | null> {
  await ensureOnlineResumesTable();
  const slug = params.slug.trim();
  if (!slug) return null;

  const exists = await db().query<{ slug: string }>(
    `SELECT slug FROM online_resumes WHERE slug = $1 AND enabled = true`,
    [slug],
  );
  if (!exists.rows[0]) return null;

  const cleanTag = params.sourceTag.trim().slice(0, 48);
  const deviceLabel = parseVisitorDevice(params.userAgent);
  const cleanIp = params.ipAddress.trim().slice(0, 80);

  // Deduplicate rapid double-renders within 5 seconds from same IP + device + tag
  const recent = await db().query<{ id: string }>(
    `SELECT id FROM online_resume_views
     WHERE slug = $1
       AND source_tag = $2
       AND device_label = $3
       AND ip_address = $4
       AND viewed_at > now() - interval '5 seconds'
     ORDER BY viewed_at DESC
     LIMIT 1`,
    [slug, cleanTag, deviceLabel, cleanIp],
  );
  if (recent.rows[0]) {
    return recent.rows[0].id;
  }

  const inserted = await db().query<{ id: string }>(
    `INSERT INTO online_resume_views (slug, source_tag, device_label, ip_address)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [slug, cleanTag, deviceLabel, cleanIp],
  );
  return inserted.rows[0]?.id ?? null;
}

export async function markOnlineResumeDownloaded(params: {
  slug: string;
  viewId?: string;
}): Promise<void> {
  await ensureOnlineResumesTable();
  const slug = params.slug.trim();
  if (!slug) return;

  if (params.viewId) {
    await db().query(
      `UPDATE online_resume_views
       SET downloaded_pdf = true
       WHERE id = $1::uuid AND slug = $2`,
      [params.viewId, slug],
    );
    return;
  }

  await db().query(
    `UPDATE online_resume_views
     SET downloaded_pdf = true
     WHERE id = (
       SELECT id FROM online_resume_views
       WHERE slug = $1
       ORDER BY viewed_at DESC
       LIMIT 1
     )`,
    [slug],
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
    title: string;
    resume_data: unknown;
    updated_at: Date;
  }>(
    `SELECT slug, title, resume_data, updated_at
     FROM online_resumes
     WHERE slug = $1 AND enabled = true`,
    [slug],
  );

  const row = result.rows[0];
  if (!row) return null;

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
