"use client";
import { ui } from "@/lib/ui-styles";
import { useEffect, useRef, useState, type RefObject } from "react";
import { ResumeData } from "@/lib/resume-data";
import { defaultAppearance } from "@/lib/resume-appearance";
import { observePreviewSize } from "@/lib/observe-preview";
import { ResumePreview } from "./ResumePreview";

const A4_WIDTH = 794;
const A4_HEIGHT = 1123;
const PAGE_GAP = 28;

interface PageSlice {
  start: number;
  end: number;
  padTop: number;
}

function computePreviewPages(
  paper: HTMLElement,
  paddingTop: number,
  paddingBottom: number,
): PageSlice[] {
  const totalHeight = Math.ceil(paper.scrollHeight);
  if (totalHeight <= A4_HEIGHT + 2) {
    return [{ start: 0, end: A4_HEIGHT, padTop: 0 }];
  }

  const rootRect = paper.getBoundingClientRect();
  const currentScale = rootRect.width / A4_WIDTH || 1;
  const doc = paper.ownerDocument;
  const lines: Array<{ top: number; bottom: number }> = [];

  paper
    .querySelectorAll("p,h1,h2,h3,time,.skill-tags span,img")
    .forEach((el) => {
      if (el.tagName === "IMG" || el.tagName === "H2") {
        const r = el.getBoundingClientRect();
        if (r.height > 0) {
          lines.push({
            top: Math.floor((r.top - rootRect.top) / currentScale),
            bottom: Math.ceil((r.bottom - rootRect.top) / currentScale),
          });
        }
        return;
      }
      const range = doc.createRange();
      range.selectNodeContents(el);
      for (const r of Array.from(range.getClientRects())) {
        if (r.height > 0) {
          lines.push({
            top: Math.floor((r.top - rootRect.top) / currentScale),
            bottom: Math.ceil((r.bottom - rootRect.top) / currentScale),
          });
        }
      }
    });

  // Prevent section heading (h2) from being orphaned at the bottom of a page
  paper.querySelectorAll("section").forEach((sec) => {
    const h2 = sec.querySelector("h2");
    if (!h2) return;
    const h2Rect = h2.getBoundingClientRect();
    const h2Top = Math.floor((h2Rect.top - rootRect.top) / currentScale);
    const h2Bottom = Math.ceil((h2Rect.bottom - rootRect.top) / currentScale);
    const firstLineAfter = lines.find(
      (l) => l.top >= h2Bottom - 2 && l.top <= h2Bottom + 60,
    );
    if (firstLineAfter) {
      lines.push({ top: h2Top, bottom: firstLineAfter.bottom });
    }
  });

  const maxContentBottom = lines.length
    ? Math.max(...lines.map((l) => l.bottom))
    : totalHeight - paddingBottom;

  if (maxContentBottom <= A4_HEIGHT - paddingBottom + 2) {
    return [{ start: 0, end: A4_HEIGHT, padTop: 0 }];
  }

  const slices: PageSlice[] = [];
  let start = 0;

  while (start < maxContentBottom - 2 && slices.length < 20) {
    const isFirstPage = slices.length === 0;
    const padTop = isFirstPage ? 0 : paddingTop;
    const usableHeight = Math.max(
      200,
      A4_HEIGHT - padTop - paddingBottom,
    );
    let end = Math.min(start + usableHeight, totalHeight);

    if (maxContentBottom - end <= 4) {
      end = Math.min(totalHeight, Math.max(end, maxContentBottom + 2));
    } else {
      const crossing = lines.filter(
        (line) =>
          line.top < end &&
          line.bottom > end &&
          line.top > start + usableHeight * 0.45,
      );
      if (crossing.length) {
        end = Math.min(...crossing.map((line) => line.top)) - 2;
      }
    }

    if (end <= start) {
      end = Math.min(start + usableHeight, totalHeight);
    }

    slices.push({ start, end, padTop });
    start = end;
  }

  return slices.length ? slices : [{ start: 0, end: A4_HEIGHT, padTop: 0 }];
}

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
  const [size, setSize] = useState({ scale: 0.85, height: A4_HEIGHT });
  const [pages, setPages] = useState<PageSlice[]>([
    { start: 0, end: A4_HEIGHT, padTop: 0 },
  ]);

  const appearance = { ...defaultAppearance, ...data.appearance };

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
    const paper = previewRef.current;
    if (!paper) return;
    const frame = requestAnimationFrame(() => {
      const nextPages = computePreviewPages(
        paper,
        appearance.paddingTop,
        appearance.paddingBottom,
      );
      setPages((prev) => {
        if (
          prev.length === nextPages.length &&
          prev.every(
            (p, i) =>
              p.start === nextPages[i].start &&
              p.end === nextPages[i].end &&
              p.padTop === nextPages[i].padTop,
          )
        ) {
          return prev;
        }
        return nextPages;
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [
    data,
    size.height,
    previewRef,
    appearance.paddingTop,
    appearance.paddingBottom,
  ]);

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

  const totalPaginatedHeight =
    pages.length * A4_HEIGHT + Math.max(0, pages.length - 1) * PAGE_GAP;

  return (
    <div className={ui["preview-canvas"]} ref={container}>
      <div
        className={`${ui["paper-size"]} relative overflow-hidden`}
        style={{
          width: A4_WIDTH * size.scale,
          height: totalPaginatedHeight * size.scale,
        }}
      >
        <div
          className="absolute left-0 top-0 w-[794px] origin-top-left print:static"
          style={{
            transform: `scale(${size.scale})`,
          }}
        >
          {/* Offscreen full-height DOM for measurement, PDF export, and browser print */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 -z-10 w-[794px] opacity-0 print:static print:z-auto print:opacity-100"
          >
            <ResumePreview ref={previewRef} data={data} />
          </div>

          {/* Discrete A4 pages with vertical gap */}
          <div className="flex flex-col gap-7 print:hidden">
            {pages.map((slice, index) => (
              <div
                key={index}
                className="relative h-[1123px] w-[794px] overflow-hidden rounded-[5px] bg-white shadow-[0_6px_32px_#1b562e12]"
              >
                <div
                  className="w-[794px] overflow-hidden"
                  style={{
                    marginTop: slice.padTop,
                    height: slice.end - slice.start,
                  }}
                >
                  <div
                    className="[&_.resume-paper]:min-h-0 [&_.resume-paper]:rounded-none [&_.resume-paper]:shadow-none"
                    style={{
                      transform: `translateY(-${slice.start}px)`,
                    }}
                  >
                    <ResumePreview data={data} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
