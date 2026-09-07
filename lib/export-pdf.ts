import { pdfPageSlices } from "./pdf-pagination";
// Capture an isolated clone so preview zoom and application styles cannot affect export.
export async function exportResumePdf(source: HTMLElement, filename: string) {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);
  await document.fonts.ready;
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: "794px",
    height: `${source.scrollHeight}px`,
    border: "0",
  });
  document.body.appendChild(iframe);
  try {
    const doc = iframe.contentDocument!;
    doc.open();
    doc.write(
      '<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#fff"></body></html>',
    );
    doc.close();
    const clone = source.cloneNode(true) as HTMLElement;
    const original = [source, ...source.querySelectorAll<HTMLElement>("*")];
    const copied = [clone, ...clone.querySelectorAll<HTMLElement>("*")];
    original.forEach((element, index) => {
      const computed = getComputedStyle(element);
      const dest = copied[index];
      for (const property of Array.from(computed)) {
        const value = computed.getPropertyValue(property);
        if (
          !property.startsWith("--") &&
          !/(oklch|oklab|color-mix|\blab\(|\blch\()/i.test(value)
        )
          dest.style.setProperty(property, value);
      }
      dest.style.setProperty("animation", "none");
      dest.style.setProperty("transition", "none");
      dest.style.setProperty("box-shadow", "none");
    });
    clone.style.transform = "none";
    clone.style.margin = "0";
    clone.style.borderRadius = "0";
    doc.body.appendChild(clone);
    await Promise.all(
      Array.from(clone.querySelectorAll("img")).map((img) => img.decode()),
    );
    const height = Math.ceil(clone.scrollHeight);
    if (height > 20000)
      throw new Error(
        "简历超过导出长度限制，请精简至约 17 页以内，或使用浏览器打印。",
      );
    const canvas = await html2canvas(clone, {
      scale: 2,
      backgroundColor: "#ffffff",
      logging: false,
      windowWidth: 794,
      windowHeight: height,
      width: 794,
      height,
    });
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });
    const rootTop = clone.getBoundingClientRect().top;
    const lines = Array.from(
      clone.querySelectorAll("p,h1,h2,h3,time,.skill-tags span"),
    ).flatMap((el) => {
      const range = doc.createRange();
      range.selectNodeContents(el);
      return Array.from(range.getClientRects()).map((r) => ({
        top: Math.floor((r.top - rootTop) * 2),
        bottom: Math.ceil((r.bottom - rootTop) * 2),
      }));
    });
    let page = 0;
    for (const { start: offset, end } of pdfPageSlices(
      canvas.height,
      canvas.width,
      lines,
    )) {
      const slice = document.createElement("canvas");
      slice.width = canvas.width;
      slice.height = end - offset;
      const ctx = slice.getContext("2d");
      if (!ctx) throw new Error("无法创建 PDF 页面。");
      ctx.drawImage(
        canvas,
        0,
        offset,
        canvas.width,
        slice.height,
        0,
        0,
        canvas.width,
        slice.height,
      );
      if (page++) pdf.addPage();
      pdf.addImage(
        slice.toDataURL("image/jpeg", 0.96),
        "JPEG",
        0,
        0,
        210,
        Math.min(297, (slice.height * 210) / canvas.width),
      );
    }
    pdf.save(`${filename.replace(/[\\/:*?"<>|]/g, "-") || "简历"}.pdf`);
  } finally {
    iframe.remove();
  }
}
