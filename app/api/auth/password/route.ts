import bcrypt from "bcryptjs";
import { passwordError } from "@/lib/auth-validation";
import { requireUser } from "@/lib/server/auth";
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
  const user = await requireUser();
  const body = await readJsonObject(request, 16 * 1024);
  const password = typeof body.password === "string" ? body.password : "";
  const confirmPassword =
    typeof body.confirmPassword === "string" ? body.confirmPassword : password;

  const invalid = passwordError(password);
  if (invalid) {
    throw new ApiError(400, "invalid_password", invalid);
  }
  if (password !== confirmPassword) {
    throw new ApiError(400, "password_mismatch", "两次输入的密码不一致。");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db().query(
    `UPDATE users
        SET password_hash = $1,
            updated_at = now()
      WHERE id = $2`,
    [passwordHash, user.id],
  );

  return Response.json({
    message: "登录密码设置成功，下次可直接使用邮箱与密码登录。",
  });
});
