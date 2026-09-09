import { randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { isValidEmail, normalizeEmail } from "@/lib/auth-validation";
import { transaction } from "@/lib/server/db";
import { ApiError, readJsonObject, requireSameOrigin, withApiErrors } from "@/lib/server/http";
import { sendLoginCode } from "@/lib/server/mailer";

export const runtime = "nodejs";
const GENERIC_MESSAGE = "验证码已发送，请查收邮箱；未注册的邮箱验证后将自动创建账号。";

export const POST = withApiErrors(async (request) => {
  requireSameOrigin(request);
  const body = await readJsonObject(request, 16 * 1024);
  const email = normalizeEmail(body.email);
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const codeHash = await bcrypt.hash(code, 10);
  if (!isValidEmail(email)) throw new ApiError(400, "invalid_email", "请输入有效的邮箱地址。");

  const requestedIp = (request.headers.get("x-forwarded-for")?.split(",", 1)[0] ?? "")
    .trim()
    .slice(0, 128) || null;
  const issued = await transaction(async (client) => {
    // Serialize issuance for both existing and not-yet-registered emails.
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [email]);
    const recent = await client.query<{ last_at: Date | null; hourly_count: string }>(
      `SELECT max(created_at) AS last_at,
              count(*) FILTER (WHERE created_at > now() - interval '1 hour') AS hourly_count
         FROM login_codes
        WHERE email = $1`,
      [email],
    );
    const lastAt = recent.rows[0]?.last_at;
    const hourlyCount = Number(recent.rows[0]?.hourly_count ?? 0);
    if ((lastAt && Date.now() - new Date(lastAt).getTime() < 60_000) || hourlyCount >= 5)
      return null;
    await client.query(
      "UPDATE login_codes SET consumed_at = now() WHERE email = $1 AND consumed_at IS NULL",
      [email],
    );
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO login_codes (email, code_hash, requested_ip, expires_at)
       VALUES ($1, $2, $3, now() + interval '10 minutes')
       RETURNING id`,
      [email, codeHash, requestedIp],
    );
    return inserted.rows[0].id;
  });

  if (!issued) throw new ApiError(429, "rate_limited", "验证码请求过于频繁，请稍后重试。");
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
      throw new ApiError(503, "delivery_failed", "邮件发送失败，请稍后重试。");
    }
  }
  return Response.json({ message: GENERIC_MESSAGE });
});
