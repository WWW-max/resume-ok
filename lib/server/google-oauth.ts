import { safeNextPath } from "@/lib/auth-validation";
import { googleIdentityFromClaims } from "@/lib/google-identity";
import { hashSessionToken } from "@/lib/session-token";
import { CodeChallengeMethod, OAuth2Client } from "google-auth-library";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import "server-only";
import { db } from "./db";
import { googleConfig } from "./google-config";

export const GOOGLE_BROWSER_COOKIE = "resumeok_google_browser";
export const GOOGLE_LINK_COOKIE = "resumeok_google_link";
export const GOOGLE_FLOW_SECONDS = 600;
export function googleCookieOptions(maxAge = GOOGLE_FLOW_SECONDS) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}
export function googleRedirect(path: string) {
  return new Response(null, {
    status: 303,
    headers: {
      Location: path,
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
export function googleLoginError(error: string, next = "/editor") {
  return googleRedirect(
    `/login?${new URLSearchParams({ error, next: safeNextPath(next) })}`
  );
}

export async function beginGoogleLogin(next: string) {
  const config = googleConfig();
  if (!config) return googleLoginError("google_unavailable", next);
  const client = new OAuth2Client(
    config.clientId,
    config.clientSecret,
    config.redirectUri
  );
  const state = randomBytes(32).toString("base64url");
  const browserToken = randomBytes(32).toString("base64url");
  const nonce = randomBytes(32).toString("base64url");
  const { codeVerifier, codeChallenge } =
    await client.generateCodeVerifierAsync();
  await db().query(
    "DELETE FROM google_login_requests WHERE expires_at <= now()"
  );
  await db().query(
    `INSERT INTO google_login_requests (state_hash, browser_hash, code_verifier, nonce, next_path, expires_at)
     VALUES ($1, $2, $3, $4, $5, now() + interval '10 minutes')`,
    [
      hashSessionToken(state),
      hashSessionToken(browserToken),
      codeVerifier,
      nonce,
      safeNextPath(next),
    ]
  );
  const cookieStore = await cookies();
  cookieStore.set(GOOGLE_BROWSER_COOKIE, browserToken, googleCookieOptions());
  cookieStore.set(GOOGLE_LINK_COOKIE, "", googleCookieOptions(0));
  return googleRedirect(
    client.generateAuthUrl({
      scope: ["openid", "email"],
      state,
      nonce,
      prompt: "select_account",
      code_challenge: codeChallenge,
      code_challenge_method: CodeChallengeMethod.S256,
    })
  );
}

export async function consumeGoogleLogin(state: string | null) {
  const cookieStore = await cookies();
  const browserToken = cookieStore.get(GOOGLE_BROWSER_COOKIE)?.value;
  if (
    !state ||
    !/^[\w-]{43}$/.test(state) ||
    !browserToken ||
    !/^[\w-]{43}$/.test(browserToken)
  )
    return null;
  // A mismatched callback must not invalidate a different in-flight login.
  const result = await db().query<{
    code_verifier: string;
    nonce: string;
    next_path: string;
  }>(
    `DELETE FROM google_login_requests WHERE state_hash = $1 AND browser_hash = $2 AND expires_at > now()
     RETURNING code_verifier, nonce, next_path`,
    [hashSessionToken(state), hashSessionToken(browserToken)]
  );
  if (result.rows[0])
    cookieStore.set(GOOGLE_BROWSER_COOKIE, "", googleCookieOptions(0));
  return result.rows[0] ?? null;
}

export async function verifyGoogleCode(
  code: string,
  flow: { code_verifier: string; nonce: string }
) {
  const config = googleConfig();
  if (!config) throw new Error("google_unavailable");
  const client = new OAuth2Client(
    config.clientId,
    config.clientSecret,
    config.redirectUri
  );
  const { tokens } = await client.getToken({
    code,
    codeVerifier: flow.code_verifier,
    redirect_uri: config.redirectUri,
  });
  if (!tokens.id_token) throw new Error("missing_google_identity");
  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: config.clientId,
  });
  return googleIdentityFromClaims(
    ticket.getPayload(),
    flow.nonce,
    config.clientId
  );
}
