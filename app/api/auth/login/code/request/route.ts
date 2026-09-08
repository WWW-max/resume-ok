import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { isValidEmail, normalizeEmail } from "@/lib/auth-validation";
import { transaction } from "@/lib/server/db";
import { readJsonObject, requireSameOrigin, withApiErrors } from "@/lib/server/http";
import { sendLoginCode } from "@/lib/server/mailer";

export const runtime = "nodejs";
const GENERIC_MESSAGE = "如果该邮箱已注册，登录验证码会发送到邮箱。";

export const POST = withApiErrors(async (request) => {
  requireSameOrigin(request);
  const body = await readJsonObject(request, 16 * 1024);
  const email = normalizeEmail(body.email);
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const codeHash = await bcrypt.hash(code, 10);
  if (!isValidEmail(email)) return Response.json({ message: GENERIC_MESSAGE });

  const requestedIp = (request.headers.get("x-forwarded-for")?.split(",", 1)[0] ?? "")
    .trim()
    .slice(0, 128) || null;
  const issued = await transaction(async (client) => {
    const users = await client.query<{ id: string }>(
      "SELECT id FROM users WHERE email = $1 FOR UPDATE",
      [email],
    );
    const user = users.rows[0];
    if (!user) return null;
    const recent = await client.query<{ last_at: Date | null; hourly_count: string }>(
      `SELECT max(created_at) AS last_at,
              count(*) FILTER (WHERE created_at > now() - interval '1 hour') AS hourly_count
         FROM login_codes
        WHERE user_id = $1`,
      [user.id],
    );
    const lastAt = recent.rows[0]?.last_at;
    const hourlyCount = Number(recent.rows[0]?.hourly_count ?? 0);
    if ((lastAt && Date.now() - new Date(lastAt).getTime() < 60_000) || hourlyCount >= 5)
      return null;
    await client.query(
      "UPDATE login_codes SET consumed_at = now() WHERE user_id = $1 AND consumed_at IS NULL",
      [user.id],
    );
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO login_codes (user_id, code_hash, requested_ip, expires_at)
       VALUES ($1, $2, $3, now() + interval '10 minutes')
       RETURNING id`,
      [user.id, codeHash, requestedIp],
    );
    return inserted.rows[0].id;
  });

  if (issued) {
    try {
      await sendLoginCode(email, code);
    } catch (error) {
      console.error("Unable to deliver login code", error);
      await transaction(async (client) => {
        await client.query(
          "UPDATE login_codes SET consumed_at = now() WHERE id = $1",
          [issued],
        );
      });
    }
  }
  return Response.json({ message: GENERIC_MESSAGE });
});
