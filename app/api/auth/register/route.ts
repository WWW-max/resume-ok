import bcrypt from "bcryptjs";
import { normalizeEmail, isValidEmail, passwordError } from "@/lib/auth-validation";
import { startSession } from "@/lib/server/auth";
import { db } from "@/lib/server/db";
import {
  ApiError,
  readJsonObject,
  requireSameOrigin,
  withApiErrors,
} from "@/lib/server/http";

export const runtime = "nodejs";

export const POST = withApiErrors(async (request) => {
  requireSameOrigin(request);
  const body = await readJsonObject(request, 16 * 1024);
  const email = normalizeEmail(body.email);
  const password = body.password;
  if (!isValidEmail(email))
    throw new ApiError(400, "invalid_credentials", "邮箱或密码格式无效。");
  const invalidPassword = passwordError(password);
  if (invalidPassword)
    throw new ApiError(400, "invalid_credentials", invalidPassword);

  const passwordHash = await bcrypt.hash(password as string, 12);
  try {
    const result = await db().query<{ id: string; email: string }>(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email`,
      [email, passwordHash],
    );
    const user = result.rows[0];
    await startSession(user.id);
    return Response.json({ user }, { status: 201 });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "23505")
      throw new ApiError(
        409,
        "registration_failed",
        "暂时无法注册，请检查信息或直接登录。",
      );
    throw error;
  }
});
