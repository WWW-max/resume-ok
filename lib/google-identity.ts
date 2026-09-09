import { isValidEmail, normalizeEmail } from "./auth-validation";

export interface GoogleIdentity {
  subject: string;
  email: string;
  authoritativeEmail: boolean;
}

/** Apply only AFTER the Google library verifies the ID token signature, issuer and audience. */
export function googleIdentityFromClaims(
  claims:
    | {
        sub?: string;
        email?: string;
        email_verified?: boolean;
        nonce?: string;
        hd?: string;
        azp?: string;
      }
    | undefined,
  expectedNonce: string,
  clientId: string
): GoogleIdentity {
  const email = normalizeEmail(claims?.email);
  if (
    !claims?.sub ||
    claims.sub.length > 255 ||
    !expectedNonce ||
    claims.nonce !== expectedNonce ||
    (claims.azp !== undefined && claims.azp !== clientId) ||
    claims.email_verified !== true ||
    !isValidEmail(email)
  )
    throw new Error("invalid_google_identity");
  return {
    subject: claims.sub,
    email,
    // Google is not authoritative for an arbitrary third-party mailbox.
    authoritativeEmail:
      email.endsWith("@gmail.com") || Boolean(claims.hd?.trim()),
  };
}
