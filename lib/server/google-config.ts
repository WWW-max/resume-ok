import "server-only";

export function googleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const configuredOrigin = process.env.APP_URL?.trim();
  if (!clientId || !clientSecret || !configuredOrigin) return null;
  try {
    const url = new URL(configuredOrigin);
    const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/" ||
      (url.protocol !== "https:" && !(url.protocol === "http:" && loopback))
    )
      return null;
    return {
      clientId,
      clientSecret,
      origin: url.origin,
      redirectUri: `${url.origin}/api/auth/google/callback`,
    };
  } catch {
    return null;
  }
}
