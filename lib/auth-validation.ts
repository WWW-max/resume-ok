export const EMAIL_MAX_LENGTH = 254;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_BYTES = 72;

export function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isValidEmail(email: string): boolean {
  return (
    email.length > 3 &&
    email.length <= EMAIL_MAX_LENGTH &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

export function passwordError(password: unknown): string | null {
  if (typeof password !== "string") return "密码格式无效。";
  const bytes = new TextEncoder().encode(password).byteLength;
  if (password.length < PASSWORD_MIN_LENGTH)
    return `密码至少需要 ${PASSWORD_MIN_LENGTH} 个字符。`;
  if (bytes > PASSWORD_MAX_BYTES)
    return `密码不能超过 ${PASSWORD_MAX_BYTES} 个 UTF-8 字节。`;
  return null;
}

export function safeNextPath(value: unknown, fallback = "/editor"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  try {
    const url = new URL(value, "http://resume-ok.local");
    if (url.origin !== "http://resume-ok.local") return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
