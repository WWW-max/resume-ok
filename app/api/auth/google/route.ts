import { safeNextPath } from "@/lib/auth-validation";
import { beginGoogleLogin, googleLoginError } from "@/lib/server/google-oauth";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const next = safeNextPath(new URL(request.url).searchParams.get("next"));
  try {
    return await beginGoogleLogin(next);
  } catch {
    // SDK errors can contain OAuth credentials. Never log the raw error or request URL.
    console.error("Unable to start Google sign-in");
    return googleLoginError("google_failed", next);
  }
}
