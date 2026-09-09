import { safeNextPath } from "@/lib/auth-validation";
import { startSession } from "@/lib/server/auth";
import { db, transaction } from "@/lib/server/db";
import { resolveGoogleUser } from "@/lib/server/google-accounts";
import { googleConfig } from "@/lib/server/google-config";
import {
  consumeGoogleLogin,
  GOOGLE_LINK_COOKIE,
  googleCookieOptions,
  googleLoginError,
  googleRedirect,
  verifyGoogleCode,
} from "@/lib/server/google-oauth";
import { hashSessionToken } from "@/lib/session-token";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";

export const runtime = "nodejs";
export async function GET(request: Request) {
  let next = "/editor";
  try {
    if (!googleConfig()) return googleLoginError("google_unavailable");
    const params = new URL(request.url).searchParams;
    const flow = await consumeGoogleLogin(params.get("state"));
    if (!flow) return googleLoginError("google_expired");
    next = safeNextPath(flow.next_path);
    if (params.has("error")) return googleLoginError("google_cancelled", next);
    const code = params.get("code");
    if (!code || code.length > 4096)
      return googleLoginError("google_failed", next);
    const identity = await verifyGoogleCode(code, flow);
    const user = await transaction((client) =>
      resolveGoogleUser(client, identity)
    );
    if (!user) {
      const token = randomBytes(32).toString("base64url");
      await db().query(
        "DELETE FROM google_email_links WHERE expires_at <= now()"
      );
      await db().query(
        `INSERT INTO google_email_links (token_hash, google_subject, email, expires_at)
         VALUES ($1, $2, $3, now() + interval '10 minutes')`,
        [hashSessionToken(token), identity.subject, identity.email]
      );
      (await cookies()).set(GOOGLE_LINK_COOKIE, token, googleCookieOptions());
      return googleLoginError("google_verify_email", next);
    }
    await startSession(user.id);
    (await cookies()).set(GOOGLE_LINK_COOKIE, "", googleCookieOptions(0));
    return googleRedirect(next);
  } catch {
    console.error("Google sign-in could not be completed");
    return googleLoginError("google_failed", next);
  }
}
