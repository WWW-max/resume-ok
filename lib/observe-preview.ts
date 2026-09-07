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
    const available = Math.floor(
      outer.clientWidth -
        (parseFloat(style.paddingLeft) || 0) -
        (parseFloat(style.paddingRight) || 0),
    );
    if (available <= 0) return;
    const next = {
      scale: zoom === "fit" ? Math.min(1, available / 794) : zoom / 100,
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
