"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Download, ZoomIn, ZoomOut } from "lucide-react";
import { Brand } from "@/components/Brand";
import { PreviewCanvas } from "@/components/preview/PreviewCanvas";
import type { ResumeData } from "@/lib/resume-data";
import { ui } from "@/lib/ui-styles";

export function OnlineResumeViewer({
  title,
  slug,
  data,
}: {
  title: string;
  slug: string;
  data: ResumeData;
}) {
  const previewRef = useRef<HTMLDivElement>(null);
  const viewIdRef = useRef<string>("");
  const [zoom, setZoom] = useState<number | "fit">("fit");
  const [actualScale, setActualScale] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("t") || "";
    const sourceTag =
      params.get("from") ||
      params.get("source") ||
      params.get("company") ||
      params.get("hr") ||
      "";
    fetch("/api/online-resume/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        token,
        sourceTag,
        action: "view",
      }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload: { viewId?: string } | null) => {
        if (payload?.viewId) {
          viewIdRef.current = payload.viewId;
        }
      })
      .catch(() => {});
  }, [slug]);

  function handleZoomIn() {
    const currentPercent = Math.round(actualScale * 100);
    const next = Math.min(200, Math.floor(currentPercent / 10) * 10 + 10);
    setZoom(next);
  }

  function handleZoomOut() {
    const currentPercent = Math.round(actualScale * 100);
    const next = Math.max(30, Math.ceil(currentPercent / 10) * 10 - 10);
    setZoom(next);
  }

  async function handleDownloadPdf() {
    if (exporting || !previewRef.current) return;
    setExporting(true);
    setExportError("");
    void fetch("/api/online-resume/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug,
        viewId: viewIdRef.current,
        action: "download",
      }),
    }).catch(() => {});
    try {
      const { exportResumePdf } = await import("@/lib/export-pdf");
      const filename =
        data.name.trim()
          ? `${data.name.trim()}${data.title.trim() ? `_${data.title.trim()}` : ""}_简历`
          : title.trim() || slug || "个人简历";
      await exportResumePdf(previewRef.current, filename, data);
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : "PDF 导出失败，请使用浏览器打印。",
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#f1f6f3] text-ink print:h-auto print:overflow-visible print:bg-white">
      <header className="z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[#d8efe1] bg-white/95 px-3 sm:px-6 backdrop-blur-xs print:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/"
            aria-label="ResumeOK 首页"
            className="shrink-0 rounded-lg max-[420px]:[&_.brand]:text-[17px] max-[420px]:[&_.brand-clover]:size-6"
          >
            <Brand />
          </Link>
          <span className="hidden h-4 w-px bg-[#d8efe1] sm:inline-block" />
          <div className="min-w-0 truncate">
            <span className="truncate text-sm font-semibold text-[#1a4026]">
              {data.name.trim() || title || slug}
            </span>
            {data.title.trim() && (
              <span className="ml-2 hidden text-xs text-muted-ink sm:inline">
                · {data.title.trim()}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center rounded-[8px] border border-[#ebf6ee] bg-white p-0.5 shadow-2xs sm:inline-flex">
            <button
              type="button"
              className="inline-grid size-8 place-items-center rounded-[6px] text-[#4a805c] hover:bg-[#dff8e7] disabled:opacity-35"
              aria-label="缩小"
              disabled={typeof zoom === "number" && zoom <= 30}
              onClick={handleZoomOut}
            >
              <ZoomOut size={15} />
            </button>
            <select
              className="cursor-pointer bg-transparent px-1.5 py-1 text-[12px] text-[#1a4026] focus:outline-none"
              aria-label="预览缩放比例"
              value={zoom}
              onChange={(e) =>
                setZoom(
                  e.target.value === "fit" ? "fit" : Number(e.target.value),
                )
              }
            >
              <option value="fit">
                自适应 ({Math.round(actualScale * 100)}%)
              </option>
              {[50, 75, 100, 125, 150, 200].map((z) => (
                <option key={z} value={z}>
                  {z}%
                </option>
              ))}
              {typeof zoom === "number" &&
                ![50, 75, 100, 125, 150, 200].includes(zoom) && (
                  <option value={zoom}>{zoom}%</option>
                )}
            </select>
            <button
              type="button"
              className="inline-grid size-8 place-items-center rounded-[6px] text-[#4a805c] hover:bg-[#dff8e7] disabled:opacity-35"
              aria-label="放大"
              disabled={typeof zoom === "number" && zoom >= 200}
              onClick={handleZoomIn}
            >
              <ZoomIn size={15} />
            </button>
          </div>

          <button
            type="button"
            disabled={exporting}
            onClick={() => void handleDownloadPdf()}
            className={ui["primary-button"]}
          >
            <Download size={16} />
            <span>{exporting ? "正在生成 PDF…" : "下载简历 PDF"}</span>
          </button>
        </div>
      </header>

      {exportError && (
        <div className={ui["export-error"]} role="alert">
          {exportError}
          <button type="button" onClick={() => window.print()}>
            使用浏览器打印
          </button>
          <button type="button" onClick={() => setExportError("")}>
            关闭
          </button>
        </div>
      )}

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden print:block print:overflow-visible">
        <PreviewCanvas
          data={data}
          previewRef={previewRef}
          zoom={zoom}
          onZoomChange={setZoom}
          onScaleChange={setActualScale}
        />
      </main>
    </div>
  );
}
