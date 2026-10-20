import { requireUser } from "@/lib/server/auth";
import {
  ApiError,
  readJsonObject,
  requireSameOrigin,
  withApiErrors,
} from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 512 * 1024;
const CONCURRENCY = 8;

function cleanMarkdownFormatting(text: string): string {
  return text
    .replace(/\*\*\s*([^*]+?)\s*\*\*/g, "**$1**")
    .replace(/^\s*([•·-])\s*/gm, "• ");
}

async function translateSingleText(
  text: string,
  targetLang: string,
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return text;
  // Skip pure URLs, emails, phone numbers, or numeric dates
  if (/^(https?:\/\/\S+|[\d\s+\-./()]+|[^\s@]+@[^\s@]+\.[^\s@]+)$/i.test(trimmed)) {
    return text;
  }

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(
    targetLang,
  )}&dt=t&q=${encodeURIComponent(text)}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    throw new Error(`Translation upstream error (${response.status})`);
  }

  const data = (await response.json()) as unknown;
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    return text;
  }

  const translated = (data[0] as unknown[])
    .map((segment) =>
      Array.isArray(segment) && typeof segment[0] === "string" ? segment[0] : "",
    )
    .join("");

  return cleanMarkdownFormatting(translated || text);
}

export const POST = withApiErrors(async (request) => {
  requireSameOrigin(request);
  await requireUser();

  const body = await readJsonObject(request, MAX_BODY_BYTES);
  if (!Array.isArray(body.texts) || body.texts.length > 500) {
    throw new ApiError(400, "invalid_texts", "待翻译文本列表无效。");
  }

  const texts = body.texts.map((item) => (typeof item === "string" ? item : ""));
  const targetLang = typeof body.target === "string" ? body.target : "en";
  const results = new Array<string>(texts.length);

  try {
    for (let i = 0; i < texts.length; i += CONCURRENCY) {
      const batch = texts.slice(i, i + CONCURRENCY);
      const translatedBatch = await Promise.all(
        batch.map((t) => translateSingleText(t, targetLang)),
      );
      for (let j = 0; j < translatedBatch.length; j++) {
        results[i + j] = translatedBatch[j];
      }
    }
  } catch {
    throw new ApiError(
      502,
      "translate_failed",
      "翻译服务暂时不可用，请检查网络或稍后重试。",
    );
  }

  return Response.json({ translations: results });
});
