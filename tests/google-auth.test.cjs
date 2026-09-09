/* eslint-disable @typescript-eslint/no-require-imports -- Node test runner. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { generateKeyPairSync, sign, randomBytes } = require("node:crypto");
const { OAuth2Client } = require("google-auth-library");
const loadTs = require("./helpers/load-ts.cjs");
const { googleIdentityFromClaims } = loadTs("lib/google-identity.ts");

const claims = {
  sub: "test-subject",
  email: " Person@Gmail.com ",
  email_verified: true,
  nonce: "test-nonce",
};
test("Google identity policy requires verified email, nonce and matching authorized party", () => {
  assert.deepEqual(
    googleIdentityFromClaims(claims, "test-nonce", "test-client"),
    {
      subject: "test-subject",
      email: "person@gmail.com",
      authoritativeEmail: true,
    }
  );
  for (const invalid of [
    undefined,
    { ...claims, sub: "" },
    { ...claims, email: "bad" },
    { ...claims, email_verified: false },
    { ...claims, nonce: "other" },
    { ...claims, azp: "other-client" },
  ]) {
    assert.throws(
      () => googleIdentityFromClaims(invalid, "test-nonce", "test-client"),
      /invalid_google_identity/
    );
  }
  assert.equal(
    googleIdentityFromClaims(
      { ...claims, email: "person@company.test", hd: "company.test" },
      "test-nonce",
      "test-client"
    ).authoritativeEmail,
    true
  );
  assert.equal(
    googleIdentityFromClaims(
      { ...claims, email: "person@thirdparty.test" },
      "test-nonce",
      "test-client"
    ).authoritativeEmail,
    false
  );
  assert.equal(
    googleIdentityFromClaims(
      { ...claims, email: "person@fakegmail.com" },
      "test-nonce",
      "test-client"
    ).authoritativeEmail,
    false
  );
});

test("Google authorization request uses PKCE, browser binding, state hash and minimal scope", async () => {
  const queries = [],
    cookies = [];
  const oauth = loadTs("lib/server/google-oauth.ts", {
    "./google-config": {
      googleConfig: () => ({
        clientId: "test-client",
        clientSecret: "test-only",
        redirectUri: "https://app.example/api/auth/google/callback",
      }),
    },
    "./db": {
      db: () => ({
        query: async (sql, values) => {
          queries.push({ sql, values });
          return { rows: [] };
        },
      }),
    },
    "next/headers": {
      cookies: async () => ({ set: (...args) => cookies.push(args) }),
    },
  });
  const response = await oauth.beginGoogleLogin("//evil.example");
  const url = new URL(response.headers.get("location"));
  assert.equal(url.origin, "https://accounts.google.com");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(url.searchParams.get("scope"), "openid email");
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.ok(url.searchParams.get("nonce"));
  assert.ok(url.searchParams.get("code_challenge"));
  const stored = queries.find((q) => q.sql.includes("INSERT")).values;
  assert.notEqual(stored[0], url.searchParams.get("state"));
  assert.notEqual(stored[1], cookies[0][1]);
  assert.equal(stored[4], "/editor");
  assert.equal(cookies[0][2].httpOnly, true);
  assert.equal(cookies[0][2].sameSite, "lax");
  assert.equal(cookies[0][2].maxAge, 600);
  assert.equal(response.headers.get("cache-control"), "no-store");
});

test("Actual Google library rejects invalid signature, audience, issuer, expiry and nonce", async (t) => {
  const keys = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const otherKeys = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const now = Math.floor(Date.now() / 1000);
  const base = {
    ...claims,
    email: "person@gmail.com",
    aud: "test-client",
    iss: "https://accounts.google.com",
    iat: now,
    exp: now + 3600,
  };
  function jwt(payload, key = keys.privateKey) {
    const head = Buffer.from(
      JSON.stringify({ alg: "RS256", kid: "test-key" })
    ).toString("base64url");
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const content = `${head}.${body}`;
    return `${content}.${sign("RSA-SHA256", Buffer.from(content), key).toString(
      "base64url"
    )}`;
  }
  let idToken = jwt(base);
  t.mock.method(OAuth2Client.prototype, "getToken", async (options) => {
    assert.equal(options.codeVerifier, "test-verifier");
    assert.equal(
      options.redirect_uri,
      "https://app.example/api/auth/google/callback"
    );
    return { tokens: { id_token: idToken } };
  });
  t.mock.method(
    OAuth2Client.prototype,
    "getFederatedSignonCertsAsync",
    async () => ({
      certs: {
        "test-key": keys.publicKey.export({ type: "spki", format: "pem" }),
      },
      format: "PEM",
    })
  );
  const oauth = loadTs("lib/server/google-oauth.ts", {
    "./google-config": {
      googleConfig: () => ({
        clientId: "test-client",
        clientSecret: "test-only",
        redirectUri: "https://app.example/api/auth/google/callback",
      }),
    },
    "next/headers": {},
    "./db": {},
  });
  const flow = { code_verifier: "test-verifier", nonce: "test-nonce" };
  assert.equal(
    (await oauth.verifyGoogleCode("test-code", flow)).subject,
    "test-subject"
  );
  for (const token of [
    jwt(base, otherKeys.privateKey),
    jwt({ ...base, aud: "other-client" }),
    jwt({ ...base, iss: "https://evil.example" }),
    jwt({ ...base, iat: now - 7200, exp: now - 3600 }),
    jwt({ ...base, nonce: "wrong" }),
    jwt({ ...base, email_verified: false }),
  ]) {
    idToken = token;
    await assert.rejects(oauth.verifyGoogleCode("test-code", flow));
  }
});

test("Google callback rejects invalid flow, preserves next on cancel, and starts only verified sessions", async () => {
  const sessions = [];
  let flow = null,
    verificationCount = 0;
  const next = "/editor?view=templates";
  const redirect = (path) =>
    new Response(null, { status: 303, headers: { Location: path } });
  const callback = loadTs("app/api/auth/google/callback/route.ts", {
    "@/lib/server/google-config": {
      googleConfig: () => ({ clientId: "test-client" }),
    },
    "@/lib/server/google-oauth": {
      consumeGoogleLogin: async () => flow,
      verifyGoogleCode: async () => {
        verificationCount++;
        return { subject: "sub" };
      },
      googleLoginError: (error, next = "/editor") =>
        redirect(`/login?${new URLSearchParams({ error, next })}`),
      googleRedirect: redirect,
      GOOGLE_LINK_COOKIE: "pending",
      googleCookieOptions: () => ({}),
    },
    "@/lib/server/google-accounts": {
      resolveGoogleUser: async () => ({ id: "user-id" }),
    },
    "@/lib/server/auth": { startSession: async (id) => sessions.push(id) },
    "@/lib/server/db": { transaction: (fn) => fn({}) },
    "next/headers": { cookies: async () => ({ set: () => {} }) },
  });
  const request = (query) =>
    new Request(`https://app.example/api/auth/google/callback?${query}`);
  assert.match(
    (await callback.GET(request("code=anything"))).headers.get("location"),
    /google_expired/
  );
  assert.equal(verificationCount, 0);
  flow = { nonce: "nonce", code_verifier: "verifier", next_path: next };
  const cancelled = new URL(
    (await callback.GET(request("error=access_denied"))).headers.get(
      "location"
    ),
    "https://app.example"
  );
  assert.equal(cancelled.searchParams.get("next"), next);
  assert.equal(verificationCount, 0);
  assert.equal(
    (await callback.GET(request("code=test-code"))).headers.get("location"),
    next
  );
  assert.deepEqual(sessions, ["user-id"]);
});

test("Google state rejects missing/malformed cookies before touching database", async () => {
  const oauth = loadTs("lib/server/google-oauth.ts", {
    "next/headers": {
      cookies: async () => ({ get: () => ({ value: "not-a-valid-cookie" }) }),
    },
    "./db": {
      db: () => {
        throw new Error("Database should not be queried");
      },
    },
  });
  assert.equal(await oauth.consumeGoogleLogin(null), null);
  assert.equal(
    await oauth.consumeGoogleLogin(randomBytes(32).toString("base64url")),
    null
  );
});
