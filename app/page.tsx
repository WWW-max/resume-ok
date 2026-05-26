"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { defaultResumeData, ResumeData } from "@/lib/resume-data";
import { EditorPanel } from "@/components/editor/EditorPanel";
import { ResumePreview } from "@/components/preview/ResumePreview";
import { Button } from "@/components/ui/button";
import {
  Download,
  FileText,
  Sparkles,
  PenLine,
  Eye,
  ChevronLeft,
} from "lucide-react";

// A4 width in px at 96dpi
const A4_PX = 794;

/** Scales the A4 preview to fit its container width */
function ScaledPreviewWrapper({
  previewRef,
  data,
}: {
  previewRef: React.RefObject<HTMLDivElement | null>;
  data: ResumeData;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const recalc = useCallback(() => {
    if (!containerRef.current) return;
    const available = containerRef.current.clientWidth - 32; // 16px padding each side
    const next = Math.min(1, available / A4_PX);
    setScale(next);
  }, []);

  useEffect(() => {
    recalc();
    const ro = new ResizeObserver(recalc);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [recalc]);

  return (
    <div ref={containerRef} className="w-full flex justify-center py-4 px-4">
      <div
        style={{
          width: `${A4_PX}px`,
          transformOrigin: "top center",
          transform: `scale(${scale})`,
          // Collapse the extra vertical whitespace caused by scaling down
          marginBottom: `${(scale - 1) * 100}%`,
        }}
        className="shadow-2xl shadow-black/70 rounded-sm"
      >
        <ResumePreview ref={previewRef} data={data} />
      </div>
    </div>
  );
}

export default function Home() {
  const [resumeData, setResumeData] = useState<ResumeData>(defaultResumeData);
  const [isExporting, setIsExporting] = useState(false);
  const [mobileView, setMobileView] = useState<"editor" | "preview">("editor");
  const previewRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = async () => {
    if (!previewRef.current) return;
    setIsExporting(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      const scaledHeight = imgHeight * ratio;
      if (scaledHeight > pdfHeight) {
        let yOffset = 0;
        while (yOffset < imgHeight) {
          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = imgWidth;
          pageCanvas.height = Math.min(pdfHeight / ratio, imgHeight - yOffset);
          const ctx = pageCanvas.getContext("2d");
          if (ctx) ctx.drawImage(canvas, 0, -yOffset);
          const pageImg = pageCanvas.toDataURL("image/png");
          if (yOffset > 0) pdf.addPage();
          pdf.addImage(pageImg, "PNG", imgX, imgY, pdfWidth - imgX * 2, pdfHeight);
          yOffset += pdfHeight / ratio;
        }
      } else {
        pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      }

      pdf.save(`${resumeData.name || "resume"}_简历.pdf`);
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("PDF 导出失败，请重试");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0f0f1a]">
      {/* ── Top Bar ─────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 lg:px-6 py-3 border-b border-white/10 bg-[#0f0f1a]/95 backdrop-blur-sm z-50">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/25 flex-shrink-0">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-white font-semibold text-sm leading-tight tracking-tight">
              简历编辑器
            </h1>
            <p className="text-white/40 text-[10px] leading-tight">Resume Editor Pro</p>
          </div>
          <h1 className="sm:hidden text-white font-semibold text-sm">简历编辑器</h1>
        </div>

        {/* Mobile: view toggle pills */}
        <div className="flex lg:hidden items-center bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
          <button
            onClick={() => setMobileView("editor")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              mobileView === "editor"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            <PenLine className="w-3 h-3" />
            <span className="hidden xs:inline">编辑</span>
          </button>
          <button
            onClick={() => setMobileView("preview")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              mobileView === "preview"
                ? "bg-violet-600 text-white shadow-lg shadow-violet-500/30"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            <Eye className="w-3 h-3" />
            <span className="hidden xs:inline">预览</span>
          </button>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Live indicator — hidden on tiny screens */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-medium">实时预览</span>
          </div>

          <Button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-1.5 lg:gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white border-0 shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-blue-500/40 active:scale-95 hover:scale-105 px-3 lg:px-4 py-2 h-9 text-xs lg:text-sm font-medium rounded-lg"
          >
            {isExporting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="hidden sm:inline">导出中...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline">导出 PDF</span>
                <span className="sm:hidden">PDF</span>
              </>
            )}
          </Button>
        </div>
      </header>

      {/* ── Main Content ────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── DESKTOP: Left Editor Sidebar ─────────────────── */}
        <div className="hidden lg:flex w-[400px] xl:w-[440px] flex-shrink-0 flex-col border-r border-white/10 bg-[#13131f] overflow-hidden">
          <EditorPanel data={resumeData} onChange={setResumeData} />
        </div>

        {/* ── DESKTOP: Right Preview Panel ─────────────────── */}
        <div className="hidden lg:flex flex-1 flex-col bg-[#0a0a14] overflow-hidden">
          {/* Preview sub-header */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-2.5 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-white/50 text-xs font-medium">PDF 预览</span>
            </div>
            <span className="text-white/25 text-xs">A4 · 210 × 297 mm</span>
          </div>
          {/* Scrollable preview */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <ScaledPreviewWrapper previewRef={previewRef} data={resumeData} />
          </div>
        </div>

        {/* ── MOBILE / TABLET: Editor view ─────────────────── */}
        <div
          className={`lg:hidden flex-1 flex flex-col bg-[#13131f] overflow-hidden transition-all duration-300 ${
            mobileView === "editor" ? "flex" : "hidden"
          }`}
        >
          <EditorPanel data={resumeData} onChange={setResumeData} />
        </div>

        {/* ── MOBILE / TABLET: Preview view ────────────────── */}
        <div
          className={`lg:hidden flex-1 flex flex-col bg-[#0a0a14] overflow-hidden ${
            mobileView === "preview" ? "flex" : "hidden"
          }`}
        >
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-white/50 text-xs font-medium">PDF 预览</span>
            </div>
            <button
              onClick={() => setMobileView("editor")}
              className="flex items-center gap-1 text-white/30 hover:text-white/60 text-xs transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              返回编辑
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            <ScaledPreviewWrapper previewRef={previewRef} data={resumeData} />
          </div>
        </div>
      </div>

      {/* ── Mobile bottom safe-area spacer ───────────────────── */}
      <div className="lg:hidden h-safe-bottom bg-[#0f0f1a]" />
    </div>
  );
}
