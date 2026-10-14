"use client";
import { ui } from "@/lib/ui-styles";
import { useEffect, useRef, useState, type RefObject } from "react";
import { ResumeData } from "@/lib/resume-data";
import { observePreviewSize } from "@/lib/observe-preview";
import { ResumePreview } from "./ResumePreview";
export function PreviewCanvas({
  data,
  previewRef,
  zoom,
  onZoomChange,
  onScaleChange,
}: {
  data: ResumeData;
  zoom: number | "fit";
  previewRef: RefObject<HTMLDivElement | null>;
  onZoomChange?: (nextZoom: number | "fit") => void;
  onScaleChange?: (scale: number) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ scale: 0.85, height: 1123 });

  useEffect(() => {
    const outer = container.current,
      paper = previewRef.current;
    if (!outer || !paper) return;
    return observePreviewSize(outer, paper, zoom, (next) => {
      setSize((previous) => {
        if (previous.scale === next.scale && previous.height === next.height) {
          return previous;
        }
        return next;
      });
      onScaleChange?.(next.scale);
    });
  }, [previewRef, zoom, onScaleChange]);

  useEffect(() => {
    const el = container.current;
    if (!el || !onZoomChange) return;

    // 支持在画布上通过触控板捏合 (pinch-to-zoom) 或按住 Ctrl/Cmd 滚轮自由缩放
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const currentPercent = Math.round(size.scale * 100);
        const delta = e.deltaY < 0 ? 5 : -5;
        const next = Math.min(200, Math.max(30, currentPercent + delta));
        onZoomChange(next);
      }
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", handleWheel);
    };
  }, [onZoomChange, size.scale]);

  return (
    <div className={ui["preview-canvas"]} ref={container}>
      <div
        className={`${ui["paper-size"]} relative overflow-hidden`}
        style={{ width: 794 * size.scale, height: size.height * size.scale }}
      >
        <div
          className="absolute left-0 top-0 w-[794px] origin-top-left print:static"
          style={{
            transform: `scale(${size.scale})`,
          }}
        >
          <ResumePreview ref={previewRef} data={data} />
        </div>
      </div>
    </div>
  );
}
