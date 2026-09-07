export interface TextLine {
  top: number;
  bottom: number;
}
export function pdfPageSlices(
  height: number,
  width: number,
  lines: TextLine[] = [],
): Array<{ start: number; end: number }> {
  // 794 × 1123 CSS pixels round to 1588 × 2246 at 2×. Flooring creates a 1px extra page.
  const pagePixels = Math.round((width * 297) / 210);
  if (height <= 0 || pagePixels <= 0) return [];
  const slices = [];
  let start = 0;
  while (start < height) {
    let end = Math.min(start + pagePixels, height);
    if (height - end <= 2) end = height;
    const crossing = lines.filter(
      (line) =>
        line.top < end &&
        line.bottom > end &&
        line.top > start + pagePixels * 0.7,
    );
    if (crossing.length)
      end = Math.min(...crossing.map((line) => line.top)) - 2;
    slices.push({ start, end });
    start = end;
  }
  return slices;
}
