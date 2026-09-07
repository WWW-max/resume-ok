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
}: {
  data: ResumeData;
  zoom: number | "fit";
  previewRef: RefObject<HTMLDivElement | null>;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ scale: 0.85, height: 1123 });
  useEffect(() => {
    const outer = container.current,
      paper = previewRef.current;
    if (!outer || !paper) return;
    return observePreviewSize(outer, paper, zoom, (next) => {
      setSize((previous) =>
        previous.scale === next.scale && previous.height === next.height
          ? previous
          : next,
      );
    });
  }, [previewRef, zoom]);
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
