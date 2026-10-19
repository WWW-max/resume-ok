export interface PreviewSize {
  scale: number;
  height: number;
}

/** Observe layout dimensions only; never write React state in the observer delivery. */
export function observePreviewSize(
  outer: HTMLElement,
  paper: HTMLElement,
  zoom: number | "fit",
  onSize: (size: PreviewSize) => void,
): () => void {
  let frame: number | null = null;
  let disposed = false;
  let previous: PreviewSize | null = null;

  const measure = () => {
    frame = null;
    if (disposed || outer.clientWidth <= 0 || paper.offsetHeight <= 0) return;
    const style = getComputedStyle(outer);
    const availableWidth = Math.floor(
      outer.clientWidth -
        (parseFloat(style.paddingLeft) || 0) -
        (parseFloat(style.paddingRight) || 0),
    );
    if (availableWidth <= 0) return;

    const hasHeight =
      typeof outer.clientHeight === "number" && outer.clientHeight > 0;
    const availableHeight = hasHeight
      ? Math.floor(
          outer.clientHeight -
            (parseFloat(style.paddingTop) || 0) -
            (parseFloat(style.paddingBottom) || 0),
        )
      : 0;

    let scale: number;
    if (zoom === "fit") {
      const scaleWidth = availableWidth / 794;
      if (hasHeight && availableHeight > 0 && paper.offsetHeight > 0) {
        // 同时适配容器宽度与单页 A4 高度（预留 2px 安全边距），确保单页 A4 完整展现且多页简历不被缩成细长条
        const pageHeight = Math.min(paper.offsetHeight, 1123);
        const scaleHeight = (availableHeight - 2) / pageHeight;
        scale = Math.min(1, scaleWidth, scaleHeight);
      } else {
        scale = Math.min(1, scaleWidth);
      }
    } else {
      scale = zoom / 100;
    }

    const next = {
      scale,
      height: paper.offsetHeight,
    };
    if (previous?.scale === next.scale && previous.height === next.height)
      return;
    previous = next;
    onSize(next);
  };
  const schedule = () => {
    if (!disposed && frame === null) frame = requestAnimationFrame(measure);
  };
  const observer = new ResizeObserver(schedule);
  observer.observe(outer);
  observer.observe(paper);
  schedule();
  return () => {
    disposed = true;
    observer.disconnect();
    if (frame !== null) cancelAnimationFrame(frame);
  };
}
