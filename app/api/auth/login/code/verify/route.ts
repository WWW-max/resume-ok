import { isValidEmail, normalizeEmail } from "@/lib/auth-validation";
import { startSession } from "@/lib/server/auth";
import { transaction } from "@/lib/server/db";
import {
  claimGoogleEmailLink,
  completeGoogleEmailLink,
} from "@/lib/server/google-accounts";
import {
  GOOGLE_LINK_COOKIE,
  googleCookieOptions,
} from "@/lib/server/google-oauth";
import {
  ApiError,
  readJsonObject,
  requireSameOrigin,
  withApiErrors,
} from "@/lib/server/http";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export const runtime = "nodejs";
const DUMMY_CODE_HASH = bcrypt.hashSync("000000", 10);

export const POST = withApiErrors(async (request) => {
  requireSameOrigin(request);
  const body = await readJsonObject(request, 16 * 1024);
  const email = normalizeEmail(body.email);
  const code = typeof body.code === "string" ? body.code.trim() : "";
  const candidate = /^\d{6}$/.test(code) ? code : "invalid";

  const pendingGoogleToken = (await cookies()).get(GOOGLE_LINK_COOKIE)?.value;
  const user = await transaction(async (client) => {
    const result = isValidEmail(email)
      ? await client.query<{
          id: string;
          email: string;
          code_hash: string;
          attempts: number;
          expires_at: Date;
        }>(
          `SELECT login_codes.id, login_codes.email,
                  login_codes.code_hash, login_codes.attempts, login_codes.expires_at
             FROM login_codes
            WHERE login_codes.email = $1 AND login_codes.consumed_at IS NULL
            ORDER BY login_codes.created_at DESC
            LIMIT 1
            FOR UPDATE OF login_codes`,
          [email]
        )
      : { rows: [] };
    const loginCode = result.rows[0];
    const matches = await bcrypt.compare(
      candidate,
      loginCode?.code_hash ?? DUMMY_CODE_HASH
    );
    const usable =
      loginCode &&
      loginCode.attempts < 5 &&
      new Date(loginCode.expires_at).getTime() > Date.now();
    if (!usable || !matches) {
      if (loginCode)
        await client.query(
          `UPDATE login_codes
              SET attempts = attempts + 1,
                  consumed_at = CASE WHEN attempts + 1 >= 5 THEN now() ELSE consumed_at END
            WHERE id = $1`,
          [loginCode.id]
        );
      return null;
    }
    await client.query(
      "UPDATE login_codes SET consumed_at = now() WHERE id = $1",
      [loginCode.id]
    );
    const pendingGoogleSubject = await claimGoogleEmailLink(
      client,
      email,
      pendingGoogleToken
    );
    // A code proves mailbox ownership. Never create an account before this point.
    await client.query(
      "INSERT INTO users (email) VALUES ($1) ON CONFLICT (email) DO NOTHING",
      [email]
    );
    const account = await client.query<{ id: string; email: string }>(
      "SELECT id, email FROM users WHERE email = $1",
      [email]
    );
    await completeGoogleEmailLink(
      client,
      account.rows[0],
      pendingGoogleSubject
    );
    return account.rows[0];
  });

  if (!user) throw new ApiError(401, "invalid_code", "验证码无效或已过期。");
  await startSession(user.id);
  if (pendingGoogleToken)
    (await cookies()).set(GOOGLE_LINK_COOKIE, "", googleCookieOptions(0));
  return Response.json({ user });
});
