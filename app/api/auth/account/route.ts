import { endSession, requireUser } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import {
  ApiError,
  readJsonObject,
  requireSameOrigin,
  withApiErrors,
} from "@/lib/server/http";

export const runtime = "nodejs";

export const DELETE = withApiErrors(async (request) => {
  requireSameOrigin(request);
  const user = await requireUser();
  const body = await readJsonObject(request, 2048);
  const confirmation =
    typeof body.confirmation === "string" ? body.confirmation.trim() : "";

  if (confirmation !== "确认注销") {
    throw new ApiError(400, "invalid_confirmation", "请输入「确认注销」以确认删除账号。");
  }

  const pool = db();
  await pool.query("DELETE FROM login_codes WHERE email = $1 OR user_id = $2", [
    user.email,
    user.id,
  ]);
  await pool.query("DELETE FROM google_email_links WHERE email = $1", [
    user.email,
  ]);
  await pool.query("DELETE FROM users WHERE id = $1", [user.id]);

  await endSession();
  return Response.json({ ok: true });
});
