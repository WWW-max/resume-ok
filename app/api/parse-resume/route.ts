import { execFile } from "node:child_process";
import { writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { getDocumentProxy } from "unpdf";
import { requireUser } from "@/lib/server/auth";
import { ApiError, requireSameOrigin, withApiErrors } from "@/lib/server/http";
import { isResumeData } from "@/lib/resume-library";
import { parseResumeText } from "@/lib/resume-parser";

const execFileAsync = promisify(execFile);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

interface PdfTextItem {
  str?: string;
  transform?: number[];
}

async function extractPdfLines(buffer: Uint8Array): Promise<{
  text: string;
  embeddedData: unknown;
}> {
  const pdf = await getDocumentProxy(buffer);

  try {
    const meta = await pdf.getMetadata();
    const info = meta?.info as Record<string, unknown> | undefined;
    const rawKeywords =
      typeof info?.Keywords === "string"
        ? info.Keywords
        : typeof info?.Subject === "string"
          ? info.Subject
          : "";
    if (rawKeywords.startsWith("RESUMEOK_JSON:")) {
      const parsed = JSON.parse(rawKeywords.slice("RESUMEOK_JSON:".length));
      if (isResumeData(parsed)) {
        return { text: "", embeddedData: parsed };
      }
    }
  } catch {
    // Ignore metadata parsing errors and fall back to text extraction
  }

  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const rows: Array<{
      y: number;
      items: Array<{ x: number; str: string }>;
    }> = [];

    for (const rawItem of content.items as PdfTextItem[]) {
      const str = typeof rawItem.str === "string" ? rawItem.str : "";
      if (!str.trim()) continue;
      const x = Array.isArray(rawItem.transform) ? rawItem.transform[4] ?? 0 : 0;
      const y = Array.isArray(rawItem.transform) ? rawItem.transform[5] ?? 0 : 0;

      let row = rows.find((r) => Math.abs(r.y - y) <= 3.5);
      if (!row) {
        row = { y, items: [] };
        rows.push(row);
      }
      row.items.push({ x, str });
    }

    rows.sort((a, b) => b.y - a.y);

    const lines = rows.map((row) => {
      row.items.sort((a, b) => a.x - b.x);
      let line = "";
      let lastX = -Infinity;
      for (const item of row.items) {
        if (line && item.x - lastX > 18) {
          line += "  ";
        }
        line += item.str;
        lastX = item.x + item.str.length * 4;
      }
      return line.trim();
    });

    pageTexts.push(lines.filter(Boolean).join("\n"));
  }

  return { text: pageTexts.join("\n"), embeddedData: null };
}

async function ocrPdfOnMac(buffer: Uint8Array): Promise<string> {
  if (process.platform !== "darwin") return "";
  const tempPath = join(
    tmpdir(),
    `resumeok-ocr-${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`,
  );
  try {
    await writeFile(tempPath, buffer);
    const jxaScript = `
ObjC.import("Foundation");
ObjC.import("PDFKit");
ObjC.import("Vision");
ObjC.import("AppKit");
const args = $.NSProcessInfo.processInfo.arguments;
const filePath = ObjC.unwrap(args.objectAtIndex(args.count - 1));
const url = $.NSURL.fileURLWithPath(filePath);
const doc = $.PDFDocument.alloc.initWithURL(url);
if (!doc) { ""; } else {
  const count = Math.min(doc.pageCount, 10);
  const out = [];
  for (let i = 0; i < count; i++) {
    const page = doc.pageAtIndex(i);
    const rect = page.boundsForBox($.kPDFDisplayBoxMediaBox);
    const img = page.thumbnailOfSizeForBox({ width: rect.size.width * 2, height: rect.size.height * 2 }, $.kPDFDisplayBoxMediaBox);
    const tiff = img.TIFFRepresentation;
    const handler = $.VNImageRequestHandler.alloc.initWithDataOptions(tiff, $({}));
    const req = $.VNRecognizeTextRequest.alloc.init;
    req.recognitionLevel = $.VNRequestTextRecognitionLevelAccurate;
    req.recognitionLanguages = $(["zh-Hans", "en-US"]);
    req.usesLanguageCorrection = true;
    handler.performRequestsError($([req]), null);
    const res = req.results;
    const n = res ? res.count : 0;
    const rows = [];
    for (let j = 0; j < n; j++) {
      const obs = res.objectAtIndex(j);
      const top = obs.topCandidates(1).objectAtIndex(0);
      if (!top) continue;
      const str = ObjC.unwrap(top.string);
      const bb = obs.boundingBox;
      const x = bb.origin.x;
      const y = bb.origin.y + bb.size.height / 2;
      let row = rows.find(r => Math.abs(r.y - y) < 0.008);
      if (!row) { row = { y, items: [] }; rows.push(row); }
      row.items.push({ x, str });
    }
    rows.sort((a, b) => b.y - a.y);
    for (const r of rows) {
      r.items.sort((a, b) => a.x - b.x);
      out.push(r.items.map(it => it.str).join("  "));
    }
  }
  out.join("\\n");
}
`;
    const { stdout } = await execFileAsync(
      "osascript",
      ["-l", "JavaScript", "-e", jxaScript, tempPath],
      { timeout: 25000, maxBuffer: 8 * 1024 * 1024 },
    );
    return stdout.trim();
  } catch {
    return "";
  } finally {
    await unlink(tempPath).catch(() => {});
  }
}

export const POST = withApiErrors(async (request) => {
  requireSameOrigin(request);
  await requireUser();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    throw new ApiError(400, "invalid_form", "请上传有效的简历文件。");
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new ApiError(400, "missing_file", "请选择要导入的简历文件。");
  }
  if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
    throw new ApiError(400, "file_too_large", "文件大小不能超过 10 MB。");
  }

  const baseName =
    file.name.replace(/\.[^.]+$/, "").trim() || "导入简历";
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".pdf") || file.type === "application/pdf") {
    let extracted;
    let bytes: Uint8Array;
    try {
      bytes = new Uint8Array(await file.arrayBuffer());
      extracted = await extractPdfLines(bytes);
    } catch {
      throw new ApiError(
        400,
        "pdf_parse_failed",
        "无法读取该 PDF 文件，请确认文件未加密或损坏。",
      );
    }

    if (extracted.embeddedData && isResumeData(extracted.embeddedData)) {
      return Response.json({
        name: baseName.slice(0, 80),
        data: extracted.embeddedData,
      });
    }

    let textContent = extracted.text.trim();
    if (!textContent) {
      textContent = await ocrPdfOnMac(bytes);
    }

    if (!textContent) {
      throw new ApiError(
        400,
        "empty_pdf_text",
        "该 PDF 为纯图片扫描件，未检测到可提取的文字图层，请上传含文字图层的 PDF 或 Markdown 文件。",
      );
    }

    const data = parseResumeText(textContent, baseName);
    return Response.json({
      name: baseName.slice(0, 80),
      data,
    });
  }

  if (
    lowerName.endsWith(".md") ||
    lowerName.endsWith(".txt") ||
    file.type.startsWith("text/")
  ) {
    const text = await file.text();
    if (!text.trim()) {
      throw new ApiError(400, "empty_file", "文件内容为空。");
    }
    const data = parseResumeText(text, baseName);
    return Response.json({
      name: baseName.slice(0, 80),
      data,
    });
  }

  throw new ApiError(
    400,
    "unsupported_type",
    "目前支持导入解析 PDF (.pdf)、Markdown (.md) 或纯文本 (.txt) 简历文件。",
  );
});
