import bcrypt from "bcryptjs";
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import test from "node:test";
import pg from "pg";
import loadTs from "../helpers/load-ts.cjs";

const integration = process.env.RUN_DB_INTEGRATION === "1" ? test : test.skip;
const httpIntegration =
  process.env.RUN_HTTP_INTEGRATION === "1" ? test : test.skip;
const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres@127.0.0.1:5432/resume_ok";
const hash = (value) => createHash("sha256").update(value).digest("hex");
const { resolveGoogleUser, claimGoogleEmailLink, completeGoogleEmailLink } =
  loadTs("lib/server/google-accounts.ts");
async function transaction(pool, work) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

integration(
  "Google account resolution preserves existing data, stable subjects and concurrent uniqueness",
  async () => {
    const pool = new pg.Pool({ connectionString });
    const marker = `google-${Date.now()}-${randomBytes(4).toString("hex")}`;
    const email = `${marker}@gmail.com`;
    const secondEmail = `${marker}-new@gmail.com`;
    try {
      const original = (
        await pool.query(
          "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id,email",
          [email, "preserved-hash"]
        )
      ).rows[0];
      await pool.query(
        "INSERT INTO resume_libraries (user_id, library) VALUES ($1, $2::jsonb)",
        [original.id, JSON.stringify({ owner: marker })]
      );
      const identity = { subject: marker, email, authoritativeEmail: true };
      const results = await Promise.all(
        [1, 2].map(() =>
          transaction(pool, (c) => resolveGoogleUser(c, identity))
        )
      );
      assert.ok(results.every((r) => r.id === original.id));
      const stable = await transaction(pool, (c) =>
        resolveGoogleUser(c, {
          ...identity,
          email: secondEmail,
          authoritativeEmail: false,
        })
      );
      assert.equal(stable.id, original.id);
      assert.equal(stable.email, email);
      assert.equal(
        (
          await pool.query("SELECT id FROM users WHERE email = $1", [
            secondEmail,
          ])
        ).rowCount,
        0
      );
      assert.equal(
        (
          await pool.query("SELECT password_hash FROM users WHERE id = $1", [
            original.id,
          ])
        ).rows[0].password_hash,
        "preserved-hash"
      );
      assert.equal(
        (
          await pool.query(
            "SELECT library FROM resume_libraries WHERE user_id = $1",
            [original.id]
          )
        ).rows[0].library.owner,
        marker
      );
      const created = await transaction(pool, (c) =>
        resolveGoogleUser(c, {
          subject: marker + "-new",
          email: secondEmail,
          authoritativeEmail: true,
        })
      );
      assert.notEqual(created.id, original.id);
      assert.equal(
        (
          await pool.query("SELECT password_hash FROM users WHERE id = $1", [
            created.id,
          ])
        ).rows[0].password_hash,
        null
      );
    } finally {
      await pool.query("DELETE FROM users WHERE email = ANY($1::text[])", [
        [email, secondEmail],
      ]);
      await pool.end();
    }
  }
);

integration(
  "Third-party Google emails require matching mailbox proof; conflicting links never move ownership",
  async () => {
    const pool = new pg.Pool({ connectionString });
    const marker = `google-link-${Date.now()}-${randomBytes(4).toString(
      "hex"
    )}`;
    const email = `${marker}@thirdparty.test`;
    const otherEmail = `${marker}-other@thirdparty.test`;
    const token = randomBytes(32).toString("base64url");
    const expired = randomBytes(32).toString("base64url");
    try {
      assert.equal(
        await transaction(pool, (c) =>
          resolveGoogleUser(c, {
            subject: marker,
            email,
            authoritativeEmail: false,
          })
        ),
        null
      );
      assert.equal(
        (await pool.query("SELECT id FROM users WHERE email = $1", [email]))
          .rowCount,
        0
      );
      await pool.query(
        "INSERT INTO google_email_links (token_hash, google_subject, email, expires_at) VALUES ($1,$2,$3,now()+interval '10 minutes'),($4,$2,$3,now()-interval '1 second')",
        [hash(token), marker, email, hash(expired)]
      );
      assert.equal(
        await transaction(pool, (c) =>
          claimGoogleEmailLink(c, otherEmail, token)
        ),
        null
      );
      assert.equal(
        await transaction(pool, (c) => claimGoogleEmailLink(c, email, expired)),
        null
      );
      const user = await transaction(pool, async (c) => {
        const subject = await claimGoogleEmailLink(c, email, token);
        assert.equal(subject, marker);
        const user = (
          await c.query(
            "INSERT INTO users (email) VALUES ($1) RETURNING id,email",
            [email]
          )
        ).rows[0];
        await completeGoogleEmailLink(c, user, subject);
        return user;
      });
      assert.equal(
        await transaction(pool, (c) => claimGoogleEmailLink(c, email, token)),
        null
      );
      assert.equal(
        (
          await transaction(pool, (c) =>
            resolveGoogleUser(c, {
              subject: marker,
              email,
              authoritativeEmail: false,
            })
          )
        ).id,
        user.id
      );
      // A stale conflicting flow cannot reassign a subject or break valid email login.
      await pool.query(
        "INSERT INTO google_email_links (token_hash,google_subject,email,expires_at) VALUES ($1,$2,$3,now()+interval '10 minutes')",
        [hash(token), marker, otherEmail]
      );
      await transaction(pool, async (c) => {
        const subject = await claimGoogleEmailLink(c, otherEmail, token);
        const other = (
          await c.query(
            "INSERT INTO users (email) VALUES ($1) RETURNING id,email",
            [otherEmail]
          )
        ).rows[0];
        await completeGoogleEmailLink(c, other, subject);
      });
      assert.equal(
        (
          await pool.query(
            "SELECT user_id FROM google_accounts WHERE google_subject = $1",
            [marker]
          )
        ).rows[0].user_id,
        user.id
      );
    } finally {
      await pool.query(
        "DELETE FROM google_email_links WHERE google_subject = $1",
        [marker]
      );
      await pool.query("DELETE FROM users WHERE email = ANY($1::text[])", [
        [email, otherEmail],
      ]);
      await pool.end();
    }
  }
);

integration(
  "Google state is bound to the browser, expires, and can be consumed exactly once",
  async () => {
    const pool = new pg.Pool({ connectionString });
    const state = randomBytes(32).toString("base64url");
    const token = randomBytes(32).toString("base64url");
    let browserToken = randomBytes(32).toString("base64url");
    const oauth = loadTs("lib/server/google-oauth.ts", {
      "./db": { db: () => pool },
      "next/headers": {
        cookies: async () => ({
          get: () => ({ value: browserToken }),
          set: () => {},
        }),
      },
    });
    try {
      await pool.query(
        "INSERT INTO google_login_requests (state_hash,browser_hash,code_verifier,nonce,next_path,expires_at) VALUES ($1,$2,'verifier','nonce','/editor?view=templates',now()+interval '10 minutes')",
        [hash(state), hash(token)]
      );
      assert.equal(await oauth.consumeGoogleLogin(state), null);
      browserToken = token;
      const results = await Promise.all([
        oauth.consumeGoogleLogin(state),
        oauth.consumeGoogleLogin(state),
      ]);
      assert.equal(results.filter(Boolean).length, 1);
      assert.equal(results.find(Boolean).next_path, "/editor?view=templates");
      await pool.query(
        "INSERT INTO google_login_requests (state_hash,browser_hash,code_verifier,nonce,next_path,expires_at) VALUES ($1,$2,'verifier','nonce','/editor',now()-interval '1 second')",
        [hash(state), hash(token)]
      );
      assert.equal(await oauth.consumeGoogleLogin(state), null);
    } finally {
      await pool.query(
        "DELETE FROM google_login_requests WHERE state_hash = $1",
        [hash(state)]
      );
      await pool.end();
    }
  }
);

httpIntegration(
  "HTTP email verification completes pending Google link only after valid code",
  async () => {
    const baseUrl = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";
    const pool = new pg.Pool({ connectionString });
    const marker = `google-http-${Date.now()}-${randomBytes(4).toString(
      "hex"
    )}`;
    const email = `${marker}@thirdparty.test`;
    const token = randomBytes(32).toString("base64url");
    const cookie = `resumeok_google_link=${token}`;
    const request = (code) =>
      fetch(`${baseUrl}/api/auth/login/code/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: baseUrl,
          Cookie: cookie,
        },
        body: JSON.stringify({ email, code }),
      });
    try {
      await pool.query(
        "INSERT INTO google_email_links (token_hash,google_subject,email,expires_at) VALUES ($1,$2,$3,now()+interval '10 minutes')",
        [hash(token), marker, email]
      );
      await pool.query(
        "INSERT INTO login_codes (email,code_hash,expires_at) VALUES ($1,$2,now()+interval '10 minutes')",
        [email, await bcrypt.hash("123456", 4)]
      );
      assert.equal((await request("000000")).status, 401);
      assert.equal(
        (await pool.query("SELECT id FROM users WHERE email = $1", [email]))
          .rowCount,
        0
      );
      assert.equal(
        (
          await pool.query(
            "SELECT google_subject FROM google_accounts WHERE google_subject = $1",
            [marker]
          )
        ).rowCount,
        0
      );
      const response = await request("123456");
      assert.equal(response.status, 200);
      assert.match(response.headers.get("set-cookie"), /resumeok_session=/);
      const user = (await response.json()).user;
      assert.equal(
        (
          await pool.query(
            "SELECT user_id FROM google_accounts WHERE google_subject = $1",
            [marker]
          )
        ).rows[0].user_id,
        user.id
      );
      assert.equal(
        (
          await pool.query(
            "SELECT token_hash FROM google_email_links WHERE token_hash = $1",
            [hash(token)]
          )
        ).rowCount,
        0
      );
    } finally {
      await pool.query(
        "DELETE FROM google_email_links WHERE google_subject = $1",
        [marker]
      );
      await pool.query("DELETE FROM login_codes WHERE email = $1", [email]);
      await pool.query("DELETE FROM users WHERE email = $1", [email]);
      await pool.end();
    }
  }
);
