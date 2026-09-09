import type { GoogleIdentity } from "@/lib/google-identity";
import { hashSessionToken } from "@/lib/session-token";
import type { PoolClient } from "pg";
import "server-only";
import type { AuthUser } from "./auth";

async function findGoogleUser(client: PoolClient, subject: string) {
  const result = await client.query<AuthUser>(
    `SELECT users.id, users.email FROM google_accounts
     JOIN users ON users.id = google_accounts.user_id WHERE google_subject = $1`,
    [subject]
  );
  return result.rows[0] ?? null;
}

export async function resolveGoogleUser(
  client: PoolClient,
  identity: GoogleIdentity
) {
  // Both first sign-in and a pending mailbox link serialize on the stable Google subject.
  await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 1))", [
    identity.subject,
  ]);
  const existing = await findGoogleUser(client, identity.subject);
  if (existing) return existing; // Never switch account merely because Google's email changes.
  if (!identity.authoritativeEmail) return null;
  await client.query(
    "INSERT INTO users (email) VALUES ($1) ON CONFLICT (email) DO NOTHING",
    [identity.email]
  );
  const result = await client.query<AuthUser>(
    "SELECT id, email FROM users WHERE email = $1",
    [identity.email]
  );
  const user = result.rows[0];
  await client.query(
    "INSERT INTO google_accounts (google_subject, user_id) VALUES ($1, $2)",
    [identity.subject, user.id]
  );
  return user;
}

/** Claim after mailbox verification, BEFORE creating a user, to keep lock ordering consistent. */
export async function claimGoogleEmailLink(
  client: PoolClient,
  email: string,
  pendingToken?: string
) {
  if (!pendingToken || !/^[\w-]{43}$/.test(pendingToken)) return null;
  const pending = await client.query<{ google_subject: string }>(
    `DELETE FROM google_email_links WHERE token_hash = $1 AND email = $2 AND expires_at > now()
     RETURNING google_subject`,
    [hashSessionToken(pendingToken), email]
  );
  if (!pending.rows[0]) return null;
  const subject = pending.rows[0].google_subject;
  await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 1))", [
    subject,
  ]);
  return subject;
}

/** The subject lock must already be held by claimGoogleEmailLink in this transaction. */
export async function completeGoogleEmailLink(
  client: PoolClient,
  user: AuthUser,
  subject: string | null
) {
  if (!subject) return;
  const existing = await findGoogleUser(client, subject);
  // Never reassign a Google identity, but don't block a valid mailbox login either.
  if (!existing)
    await client.query(
      "INSERT INTO google_accounts (google_subject, user_id) VALUES ($1, $2)",
      [subject, user.id]
    );
}
