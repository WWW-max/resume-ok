"use client";
import { ui } from "@/lib/ui-styles";
import { useEffect, useRef, useState, type RefObject } from "react";
import { ResumeData } from "@/lib/resume-data";
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
    const measure = () => {
      const styles = getComputedStyle(outer);
      const available = Math.max(1, outer.clientWidth - parseFloat(styles.paddingLeft) - parseFloat(styles.paddingRight));
      if (outer.clientWidth === 0) return;
      setSize({
        scale:
          zoom === "fit"
            ? Math.min(1, available / 794)
            : zoom / 100,
        height: paper.offsetHeight,
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(outer);
    observer.observe(paper);
    return () => observer.disconnect();
  }, [previewRef, zoom]);
  return (
    <div className={ui["preview-canvas"]} ref={container}>
      <div
        className={ui["paper-size"]}
        style={{ width: 794 * size.scale, height: size.height * size.scale }}
      >
        <div
          className="w-[794px] origin-top-left"
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
