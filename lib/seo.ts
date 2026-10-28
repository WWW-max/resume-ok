export const DEFAULT_SITE_URL = "https://resume-ok.com";
export const SITE_NAME = "ResumeOK";
export const SITE_TITLE =
  "ResumeOK — 免费在线简历制作工具 | 专业简历模板与一键导出 PDF";
export const SITE_DESCRIPTION =
  "ResumeOK 是专业的在线简历制作与排版工具，提供清新、极简、商务等多种精选简历模板，支持可视化实时预览、智能内容完整度检查、现有 PDF 简历导入解析、中英文一键转换、高清 A4 PDF 导出及在线简历分享追踪，助你更快斩获心仪 Offer。";

export const SITE_KEYWORDS = [
  "ResumeOK",
  "在线简历制作",
  "免费简历模板",
  "简历编辑器",
  "PDF简历导出",
  "个人简历模板",
  "求职简历排版",
  "校招简历",
  "社招简历",
  "程序员简历模板",
  "英文简历转换",
  "在线简历分享",
];

export function getSiteUrl(): string {
  const raw = (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    ""
  ).trim();
  if (!raw) return DEFAULT_SITE_URL;
  try {
    const url = new URL(raw);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return url.origin;
    }
  } catch {
    // Fallback to default site URL when APP_URL is not a valid URL
  }
  return DEFAULT_SITE_URL;
}
