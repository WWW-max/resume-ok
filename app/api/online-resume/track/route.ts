import {
  readJsonObject,
  requireSameOrigin,
  withApiErrors,
} from "@/lib/server/http";
import {
  markOnlineResumeDownloaded,
  recordOnlineResumeVisit,
} from "@/lib/server/online-resumes";
import { decodeSourceTag } from "@/lib/online-resume-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isPrivateOrLocalIp(ip: string): boolean {
  if (!ip) return true;
  if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost") return true;
  if (
    ip.startsWith("10.") ||
    ip.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
  ) {
    return true;
  }
  return false;
}

function formatRegion(pro: string, city: string): string {
  const cleanPro = pro
    .replace(/(?:省|市|壮族自治区|回族自治区|维吾尔自治区|自治区|特别行政区)$/, "")
    .trim();
  const cleanCity = city.replace(/(?:市|地区|自治州|盟)$/, "").trim();
  if (cleanPro && cleanCity && cleanPro !== cleanCity) {
    return `${cleanPro}${cleanCity}`;
  }
  return cleanCity || cleanPro;
}

async function resolveVisitorIpAndLocation(request: Request): Promise<string> {
  const forwarded = request.headers.get("x-forwarded-for");
  const rawIp =
    (forwarded ? forwarded.split(",")[0]?.trim() : "") ||
    request.headers.get("x-real-ip")?.trim() ||
    "";
  const clientIp = rawIp.replace(/^::ffff:/, "");
  const isLocal = isPrivateOrLocalIp(clientIp);

  try {
    const queryUrl = isLocal
      ? "https://whois.pconline.com.cn/ipJson.jsp?json=true"
      : `https://whois.pconline.com.cn/ipJson.jsp?ip=${encodeURIComponent(clientIp)}&json=true`;
    const res = await fetch(queryUrl, {
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) {
      const buf = await res.arrayBuffer();
      const text = new TextDecoder("gbk").decode(buf);
      const data = JSON.parse(text) as {
        ip?: string;
        pro?: string;
        city?: string;
        addr?: string;
      };
      const resolvedIp = (isLocal ? data.ip : clientIp) || data.ip || clientIp;
      const region =
        formatRegion(data.pro || "", data.city || "") ||
        (data.addr ? data.addr.split(/\s+/)[0] : "");
      if (region && resolvedIp) {
        return `${region} (${resolvedIp})`;
      }
      if (resolvedIp) {
        return resolvedIp;
      }
    }
  } catch {
    // Fallback if offline or lookup times out
  }

  return isLocal ? "本地网络 (127.0.0.1)" : clientIp;
}

export const POST = withApiErrors(async (request) => {
  requireSameOrigin(request);
  const body = await readJsonObject(request, 16 * 1024);

  const slug = typeof body.slug === "string" ? body.slug.trim() : "";
  const action = body.action === "download" ? "download" : "view";

  if (!slug) {
    return Response.json({ ok: false });
  }

  if (action === "download") {
    const viewId = typeof body.viewId === "string" ? body.viewId.trim() : "";
    await markOnlineResumeDownloaded({
      slug,
      viewId: viewId || undefined,
    });
    return Response.json({ ok: true });
  }

  const rawToken = typeof body.token === "string" ? body.token.trim() : "";
  const decodedFromToken = rawToken ? decodeSourceTag(rawToken) : "";
  const sourceTag =
    decodedFromToken ||
    (typeof body.sourceTag === "string" ? body.sourceTag.trim() : "");
  const userAgent = request.headers.get("user-agent") || "";
  const ipAddress = await resolveVisitorIpAndLocation(request);

  const viewId = await recordOnlineResumeVisit({
    slug,
    sourceTag,
    userAgent,
    ipAddress,
  });

  return Response.json({ ok: true, viewId });
});
