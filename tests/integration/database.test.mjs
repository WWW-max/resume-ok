import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import pg from "pg";

const enabled = process.env.RUN_DB_INTEGRATION === "1";
const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres@127.0.0.1:5432/resume_ok";
const integration = enabled ? test : test.skip;

integration("PostgreSQL isolates resumes and enforces session/code security properties", async () => {
  const pool = new pg.Pool({ connectionString });
  const marker = `integration-${Date.now()}-${randomBytes(4).toString("hex")}`;
  const users = [];
  try {
    for (const suffix of ["a", "b"]) {
      const result = await pool.query(
        "INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id",
        [`${marker}-${suffix}@example.test`, await bcrypt.hash("test-password", 4)],
      );
      users.push(result.rows[0].id);
    }
    const libraries = [
      { version: 1, activeId: "same-name", documents: [{ id: "same-name", name: "同名简历", updatedAt: "", data: { owner: "A" } }] },
      { version: 1, activeId: "same-name", documents: [{ id: "same-name", name: "同名简历", updatedAt: "", data: { owner: "B" } }] },
    ];
    await Promise.all(users.map((userId, index) => pool.query(
      "INSERT INTO resume_libraries (user_id, library) VALUES ($1, $2::jsonb)",
      [userId, JSON.stringify(libraries[index])],
    )));
    const rows = await Promise.all(users.map((userId) => pool.query(
      "SELECT library FROM resume_libraries WHERE user_id = $1",
      [userId],
    )));
    assert.equal(rows[0].rows[0].library.documents[0].data.owner, "A");
    assert.equal(rows[1].rows[0].library.documents[0].data.owner, "B");

    const rawToken = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    await pool.query(
      "INSERT INTO sessions (user_id, token_hash, expires_at) VALUES ($1, $2, now() + interval '1 hour')",
      [users[0], tokenHash],
    );
    const stored = await pool.query("SELECT token_hash FROM sessions WHERE user_id = $1", [users[0]]);
    assert.equal(stored.rows[0].token_hash, tokenHash);
    assert.notEqual(stored.rows[0].token_hash, rawToken);

    const codeHash = await bcrypt.hash("123456", 4);
    const expired = await pool.query(
      `INSERT INTO login_codes (user_id, code_hash, expires_at)
       VALUES ($1, $2, now() - interval '1 second') RETURNING id`,
      [users[0], codeHash],
    );
    const expiredUsable = await pool.query(
      "SELECT id FROM login_codes WHERE id = $1 AND consumed_at IS NULL AND expires_at > now()",
      [expired.rows[0].id],
    );
    assert.equal(expiredUsable.rowCount, 0);

    const fresh = await pool.query(
      `INSERT INTO login_codes (user_id, code_hash, expires_at)
       VALUES ($1, $2, now() + interval '10 minutes') RETURNING id`,
      [users[0], codeHash],
    );
    const consumed = await pool.query(
      "UPDATE login_codes SET consumed_at = now() WHERE id = $1 AND consumed_at IS NULL RETURNING id",
      [fresh.rows[0].id],
    );
    assert.equal(consumed.rowCount, 1);
    const consumedAgain = await pool.query(
      "UPDATE login_codes SET consumed_at = now() WHERE id = $1 AND consumed_at IS NULL RETURNING id",
      [fresh.rows[0].id],
    );
    assert.equal(consumedAgain.rowCount, 0);
  } finally {
    if (users.length)
      await pool.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [users]);
    await pool.end();
  }
});
