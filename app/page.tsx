"use client";

import { useState, useRef } from "react";
import { defaultResumeData, ResumeData } from "@/lib/resume-data";
import { EditorPanel } from "@/components/editor/EditorPanel";
import { ResumePreview } from "@/components/preview/ResumePreview";
import { Button } from "@/components/ui/button";
import { Download, FileText, Sparkles } from "lucide-react";

export default function Home() {
  const [resumeData, setResumeData] = useState<ResumeData>(defaultResumeData);
  const [isExporting, setIsExporting] = useState(false);
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
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      // If content is taller than a single page, add multiple pages
      const scaledHeight = imgHeight * ratio;
      if (scaledHeight > pdfHeight) {
        let yOffset = 0;
        while (yOffset < imgHeight) {
          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = imgWidth;
          pageCanvas.height = Math.min(pdfHeight / ratio, imgHeight - yOffset);
          const ctx = pageCanvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(canvas, 0, -yOffset);
          }
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
      {/* Top Bar */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#0f0f1a]/95 backdrop-blur-sm z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm leading-tight tracking-tight">
              简历编辑器
            </h1>
            <p className="text-white/40 text-[10px] leading-tight">
              Resume Editor Pro
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 text-xs font-medium">实时预览</span>
          </div>

          <Button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white border-0 shadow-lg shadow-blue-500/25 transition-all duration-200 hover:shadow-blue-500/40 hover:scale-105 px-4 py-2 h-9 text-sm font-medium rounded-lg"
          >
            {isExporting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>导出中...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>导出 PDF</span>
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 min-h-0">
        {/* Left Editor Panel */}
        <div className="w-[400px] flex-shrink-0 flex flex-col border-r border-white/10 bg-[#13131f] overflow-hidden">
          <EditorPanel data={resumeData} onChange={setResumeData} />
        </div>

        {/* Right Preview Panel */}
        <div className="flex-1 overflow-auto bg-[#0a0a14] flex flex-col">
          {/* Preview Header Bar */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-white/50 text-xs font-medium">PDF 预览</span>
            </div>
            <span className="text-white/30 text-xs">A4 · 297mm × 210mm</span>
          </div>

          {/* A4 Preview Area */}
          <div className="flex-1 flex items-start justify-center p-8 overflow-auto">
            <div
              className="shadow-2xl shadow-black/60 rounded-sm"
              style={{ width: "794px", flexShrink: 0 }}
            >
              <ResumePreview ref={previewRef} data={resumeData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
