import bcrypt from "bcryptjs";
import { isValidEmail, normalizeEmail } from "@/lib/auth-validation";
import { startSession } from "@/lib/server/auth";
import { transaction } from "@/lib/server/db";
import {
  ApiError,
  readJsonObject,
  requireSameOrigin,
  withApiErrors,
} from "@/lib/server/http";

export const runtime = "nodejs";
const DUMMY_CODE_HASH = bcrypt.hashSync("000000", 10);

export const POST = withApiErrors(async (request) => {
  requireSameOrigin(request);
  const body = await readJsonObject(request, 16 * 1024);
  const email = normalizeEmail(body.email);
  const code = typeof body.code === "string" ? body.code.trim() : "";
  const candidate = /^\d{6}$/.test(code) ? code : "invalid";

  const user = await transaction(async (client) => {
    const result = isValidEmail(email)
      ? await client.query<{
          id: string;
          user_id: string;
          email: string;
          code_hash: string;
          attempts: number;
          expires_at: Date;
        }>(
          `SELECT login_codes.id, login_codes.user_id, users.email,
                  login_codes.code_hash, login_codes.attempts, login_codes.expires_at
             FROM login_codes
             JOIN users ON users.id = login_codes.user_id
            WHERE users.email = $1 AND login_codes.consumed_at IS NULL
            ORDER BY login_codes.created_at DESC
            LIMIT 1
            FOR UPDATE OF login_codes`,
          [email],
        )
      : { rows: [] };
    const loginCode = result.rows[0];
    const matches = await bcrypt.compare(candidate, loginCode?.code_hash ?? DUMMY_CODE_HASH);
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
          [loginCode.id],
        );
      return null;
    }
    await client.query("UPDATE login_codes SET consumed_at = now() WHERE id = $1", [
      loginCode.id,
    ]);
    return { id: loginCode.user_id, email: loginCode.email };
  });

  if (!user)
    throw new ApiError(401, "invalid_code", "验证码无效或已过期。");
  await startSession(user.id);
  return Response.json({ user });
});
