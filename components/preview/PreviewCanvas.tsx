"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import { ResumeData } from "@/lib/resume-data";
import { ResumePreview } from "./ResumePreview";
export function PreviewCanvas({ data, previewRef, zoom }: { data: ResumeData; zoom: number | "fit"; previewRef: RefObject<HTMLDivElement | null> }) {
  const container = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ scale: 0.85, height: 1123 });
  useEffect(() => {
    const outer = container.current, paper = previewRef.current;
    if (!outer || !paper) return;
    const observer = new ResizeObserver(() => setSize({ scale: zoom === "fit" ? Math.min(1, Math.max(0.2, (outer.clientWidth - 64) / 794)) : zoom / 100, height: paper.offsetHeight }));
    observer.observe(outer); observer.observe(paper);
    return () => observer.disconnect();
  }, [previewRef,zoom]);
  return <div className="preview-canvas" ref={container}><div className="paper-size" style={{ width: 794 * size.scale, height: size.height * size.scale }}><div style={{ width: 794, transform: `scale(${size.scale})`, transformOrigin: "top left" }}><ResumePreview ref={previewRef} data={data} /></div></div></div>;
}
