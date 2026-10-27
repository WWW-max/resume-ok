import { getCurrentUser } from "@/lib/server/auth";
import { query } from "@/lib/server/db";
import { readJsonObject, withApiErrors } from "@/lib/server/http";

export const runtime = "nodejs";

/**
 * POST /api/analytics/track
 * 接收前端上报的运营埋点事件并写入 analytics_events 表。
 */
export const POST = withApiErrors(async (request) => {
  const body = await readJsonObject(request, 8 * 1024);
  const eventName =
    typeof body.eventName === "string"
      ? body.eventName.trim().slice(0, 64)
      : "";
  if (!eventName || !/^[a-z0-9_:-]+$/i.test(eventName)) {
    return Response.json({ ok: false }, { status: 400 });
  }

  const visitorId =
    typeof body.visitorId === "string"
      ? body.visitorId.trim().slice(0, 80)
      : "";
  const pagePath =
    typeof body.pagePath === "string"
      ? body.pagePath.trim().slice(0, 200)
      : "";
  const rawProps =
    body.props && typeof body.props === "object" && !Array.isArray(body.props)
      ? (body.props as Record<string, unknown>)
      : {};

  const safeProps: Record<string, string | number | boolean | null> = {};
  for (const [k, v] of Object.entries(rawProps).slice(0, 20)) {
    if (
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean" ||
      v === null
    ) {
      safeProps[k.slice(0, 48)] =
        typeof v === "string" ? v.slice(0, 200) : v;
    }
  }

  const user = await getCurrentUser().catch(() => null);
  await query(
    `INSERT INTO analytics_events (event_name, user_id, visitor_id, page_path, props)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [eventName, user?.id ?? null, visitorId, pagePath, JSON.stringify(safeProps)],
  );

  return Response.json({ ok: true });
});
