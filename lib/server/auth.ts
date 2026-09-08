import "server-only";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "./db";
import { hashSessionToken } from "@/lib/session-token";

export const SESSION_COOKIE = "resumeok_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export interface AuthUser {
  id: string;
  email: string;
}

function cookieOptions(maxAge = SESSION_MAX_AGE_SECONDS) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export async function startSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  await db().query(
    `INSERT INTO sessions (user_id, token_hash, expires_at)
     VALUES ($1, $2, now() + ($3 * interval '1 second'))`,
    [userId, tokenHash, SESSION_MAX_AGE_SECONDS],
  );
  (await cookies()).set(SESSION_COOKIE, token, cookieOptions());
}

export async function currentUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const result = await db().query<AuthUser>(
    `SELECT users.id, users.email
       FROM sessions
       JOIN users ON users.id = sessions.user_id
      WHERE sessions.token_hash = $1 AND sessions.expires_at > now()`,
    [hashSessionToken(token)],
  );
  return result.rows[0] ?? null;
}

export async function requireUser(): Promise<AuthUser> {
  const user = await currentUser();
  if (!user) {
    const { ApiError } = await import("./http");
    throw new ApiError(401, "unauthorized", "请先登录。");
  }
  return user;
}

export async function endSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token)
    await db().query("DELETE FROM sessions WHERE token_hash = $1", [
      hashSessionToken(token),
    ]);
  cookieStore.set(SESSION_COOKIE, "", cookieOptions(0));
}
