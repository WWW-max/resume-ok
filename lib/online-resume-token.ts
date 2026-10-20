const CIPHER_KEY = [0x5a, 0x3c, 0x91, 0x6e, 0xa7, 0x42, 0xd3, 0x19];

export function encodeSourceTag(rawTag: string): string {
  const trimmed = rawTag.trim();
  if (!trimmed) return "";
  const bytes = new TextEncoder().encode(trimmed);
  const xored = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    xored[i] = bytes[i] ^ CIPHER_KEY[i % CIPHER_KEY.length];
  }
  let binary = "";
  for (let i = 0; i < xored.length; i++) {
    binary += String.fromCharCode(xored[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function decodeSourceTag(token: string): string {
  const cleaned = token.trim();
  if (!cleaned) return "";
  try {
    const base64 = cleaned.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i) ^ CIPHER_KEY[i % CIPHER_KEY.length];
    }
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    // Reject control characters
    if (/[\u0000-\u001f\u007f]/.test(decoded)) return "";
    return decoded.trim().slice(0, 48);
  } catch {
    return "";
  }
}
