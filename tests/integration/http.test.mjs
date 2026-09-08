import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes, createHash } from "node:crypto";
import pg from "pg";

const enabled = process.env.RUN_HTTP_INTEGRATION === "1";
const integration = enabled ? test : test.skip;
const baseUrl = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";
const mailpitUrl = process.env.NEXT_PUBLIC_MAILBOX_URL ?? "http://127.0.0.1:8025";
const connectionString = process.env.DATABASE_URL ?? "postgresql://postgres@127.0.0.1:5432/resume_ok";

function client() {
  let cookie = "";
  return {
    get cookie() { return cookie; },
    async request(path, options = {}) {
      const headers = new Headers(options.headers);
      headers.set("Origin", baseUrl);
      if (cookie) headers.set("Cookie", cookie);
      const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
      const setCookie = response.headers.get("set-cookie");
      if (setCookie) cookie = setCookie.split(";", 1)[0];
      return response;
    },
  };
}

function resumeLibrary(owner) {
  return {
    version: 1,
    activeId: "same-name",
    documents: [{
      id: "same-name",
      name: "同名简历",
      updatedAt: new Date().toISOString(),
      data: {
        name: owner,
        title: "",
        phone: "",
        email: "",
        location: "",
        github: "",
        website: "",
        avatar: "",
        schoolLogo: "",
        summary: "",
        workExperiences: [],
        educations: [],
        projects: [],
        skills: [],
        sectionOrder: ["summary", "workExperiences", "projects", "educations", "skills"],
      },
    }],
  };
}

async function jsonRequest(agent, path, body) {
  return agent.request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

integration("HTTP auth, Mailpit code login, and per-user resume isolation work end to end", async () => {
  const marker = `http-${Date.now()}-${randomBytes(4).toString("hex")}`;
  const emails = [`${marker}-a@example.test`, `${marker}-b@example.test`];
  const password = "integration-password";
  const pool = new pg.Pool({ connectionString });
  let mailId;
  try {
    const agents = [client(), client()];
    for (let index = 0; index < agents.length; index++) {
      const response = await jsonRequest(agents[index], "/api/auth/register", { email: emails[index], password });
      assert.equal(response.status, 201);
      assert.match(agents[index].cookie, /^resumeok_session=/);
      const library = resumeLibrary(index === 0 ? "A" : "B");
      const saved = await agents[index].request("/api/resumes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ library }),
      });
      assert.equal(saved.status, 200);
    }
    const libraries = await Promise.all(agents.map(async (agent) => {
      const response = await agent.request("/api/resumes");
      assert.equal(response.status, 200);
      return (await response.json()).library;
    }));
    assert.equal(libraries[0].documents[0].data.name, "A");
    assert.equal(libraries[1].documents[0].data.name, "B");

    const passwordAgent = client();
    const passwordLogin = await jsonRequest(
      passwordAgent,
      "/api/auth/login/password",
      { email: emails[0], password },
    );
    assert.equal(passwordLogin.status, 200);
    const passwordLibrary = await passwordAgent.request("/api/resumes");
    assert.equal(passwordLibrary.status, 200);
    assert.equal(
      (await passwordLibrary.json()).library.documents[0].data.name,
      "A",
    );
    const logout = await passwordAgent.request("/api/auth/logout", {
      method: "POST",
    });
    assert.equal(logout.status, 200);
    assert.equal((await passwordAgent.request("/api/resumes")).status, 401);

    const rawToken = decodeURIComponent(agents[0].cookie.split("=", 2)[1]);
    const hash = createHash("sha256").update(rawToken).digest("hex");
    const session = await pool.query(
      "SELECT token_hash FROM sessions WHERE token_hash = $1 OR token_hash = $2",
      [rawToken, hash],
    );
    assert.deepEqual(session.rows.map((row) => row.token_hash), [hash]);

    const requested = await jsonRequest(client(), "/api/auth/login/code/request", { email: emails[0] });
    assert.equal(requested.status, 200);
    let message;
    for (let attempt = 0; attempt < 20 && !message; attempt++) {
      const inbox = await (await fetch(`${mailpitUrl}/api/v1/messages`)).json();
      message = inbox.messages?.find((item) =>
        item.To?.some?.((recipient) => recipient.Address === emails[0]),
      );
      if (!message) await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.ok(message, "Mailpit should receive the login code email");
    mailId = message.ID;
    const detail = await (await fetch(`${mailpitUrl}/api/v1/message/${mailId}`)).json();
    const code = `${detail.Subject ?? ""}\n${detail.Text ?? ""}`.match(/\b\d{6}\b/)?.[0];
    assert.match(code ?? "", /^\d{6}$/);

    const codeAgent = client();
    const verified = await jsonRequest(codeAgent, "/api/auth/login/code/verify", { email: emails[0], code });
    assert.equal(verified.status, 200);
    assert.match(codeAgent.cookie, /^resumeok_session=/);
    const reused = await jsonRequest(client(), "/api/auth/login/code/verify", { email: emails[0], code });
    assert.equal(reused.status, 401);
  } finally {
    await pool.query("DELETE FROM users WHERE email = ANY($1::text[])", [emails]);
    await pool.end();
    if (mailId)
      await fetch(`${mailpitUrl}/api/v1/messages/${mailId}`, { method: "DELETE" }).catch(() => {});
  }
});
