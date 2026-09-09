import bcrypt from "bcryptjs";
import { isValidEmail, normalizeEmail } from "@/lib/auth-validation";
import { startSession } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import {
  ApiError,
  readJsonObject,
  requireSameOrigin,
  withApiErrors,
} from "@/lib/server/http";

export const runtime = "nodejs";
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("resume-ok-dummy-password", 12);

export const POST = withApiErrors(async (request) => {
  requireSameOrigin(request);
  const body = await readJsonObject(request, 16 * 1024);
  const email = normalizeEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";
  const result = isValidEmail(email)
    ? await db().query<{ id: string; email: string; password_hash: string | null }>(
        "SELECT id, email, password_hash FROM users WHERE email = $1",
        [email],
      )
    : { rows: [] };
  const user = result.rows[0];
  const valid = await bcrypt.compare(
    password || "invalid",
    user?.password_hash ?? DUMMY_PASSWORD_HASH,
  );
  if (!user?.password_hash || !valid)
    throw new ApiError(401, "invalid_credentials", "邮箱或密码错误。");
  await startSession(user.id);
  return Response.json({ user: { id: user.id, email: user.email } });
});
