import { pdfPageSlices } from "./pdf-pagination";
import {
  type Project,
  type ResumeData,
  getSectionLabel,
  isCustomSectionKey,
} from "./resume-data";
import { accentColors, defaultAppearance } from "./resume-appearance";

export type ExportFormat = "pdf" | "word" | "image" | "markdown";

function sanitizeFilename(filename: string): string {
  return filename.trim().replace(/[\\/:*?"<>|]/g, "-") || "简历";
}

// Capture an isolated clone so preview zoom and application styles cannot affect export.
async function renderResumeCanvas(source: HTMLElement) {
  const { default: html2canvas } = await import("html2canvas");
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
    return { canvas, lines };
  } finally {
    iframe.remove();
  }
}

export async function exportResumePdf(source: HTMLElement, filename: string) {
  const [{ jsPDF }, { canvas, lines }] = await Promise.all([
    import("jspdf"),
    renderResumeCanvas(source),
  ]);
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
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
  pdf.save(`${sanitizeFilename(filename)}.pdf`);
}

export async function exportResumeImage(source: HTMLElement, filename: string) {
  const { canvas } = await renderResumeCanvas(source);
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `${sanitizeFilename(filename)}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatInlineHtml(text: string): string {
  const escaped = escapeHtml(text);
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" style="color:inherit;text-decoration:underline">$1</a>',
    );
}

function formatWordDate(value: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
  return match ? `${match[1]}年${match[2]}月` : escapeHtml(value.trim());
}

function formatWordDateRange(
  startDate: string,
  endDate: string,
  current?: boolean,
): string {
  const start = formatWordDate(startDate);
  const end =
    current || endDate === "至今" ? "至今" : formatWordDate(endDate);
  if (!start && !end) return "";
  return [start, end].filter(Boolean).join(" - ");
}

function renderWordDescription(text: string, fontSize: number): string {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return "";
  return lines
    .map(
      (line) =>
        `<p style="margin:2pt 0;font-size:${fontSize - 0.5}pt;line-height:1.65;color:#222">${formatInlineHtml(line)}</p>`,
    )
    .join("");
}

function renderWordProjects(items: Project[], fontSize: number): string {
  return items
    .map((item) => {
      const dateRange = formatWordDateRange(item.startDate, item.endDate);
      const title = item.link
        ? `${escapeHtml(item.name)}${item.name.endsWith(".") ? " " : ". "}${escapeHtml(item.link)}`
        : escapeHtml(item.name);
      return `<div style="margin-bottom:8pt">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:2pt">
          <tr>
            <td style="font-size:${fontSize}pt;font-weight:bold;color:#111">${title}</td>
            <td align="right" style="font-size:${fontSize - 0.5}pt;color:#444;white-space:nowrap">${dateRange}</td>
          </tr>
        </table>
        ${item.role ? `<p style="margin:1pt 0 2pt;font-size:${fontSize - 0.5}pt;color:#333">${escapeHtml(item.role)}</p>` : ""}
        ${renderWordDescription(item.description, fontSize)}
      </div>`;
    })
    .join("");
}

export function exportResumeWord(data: ResumeData, filename: string) {
  const appearance = { ...defaultAppearance, ...data.appearance };
  const accent =
    appearance.accent === "none" ? "#171717" : accentColors[appearance.accent];
  const fontSize = Math.max(9, Math.round(appearance.fontSize * 0.75 * 2) / 2);
  const contacts = [
    data.phone,
    data.email,
    data.location,
    data.github,
    data.website,
  ]
    .filter(Boolean)
    .map(escapeHtml);

  const sectionsHtml = data.sectionOrder
    .filter((key) => !data.hiddenSections?.includes(key))
    .map((key) => {
      let body = "";
      if (isCustomSectionKey(key)) {
        const custom = data.customSections?.find((s) => s.id === key);
        if (!custom) return "";
        body =
          (custom.content.trim()
            ? renderWordDescription(custom.content, fontSize)
            : "") +
          (custom.items?.length
            ? renderWordProjects(custom.items, fontSize)
            : "");
      } else if (key === "summary") {
        body = renderWordDescription(data.summary, fontSize);
      } else if (key === "skills") {
        body = data.skills
          .map(
            (s) =>
              `<p style="margin:2pt 0;font-size:${fontSize - 0.5}pt;line-height:1.65;color:#222">${
                s.category && s.category !== "技能"
                  ? `<strong>${escapeHtml(s.category)}：</strong>`
                  : ""
              }${formatInlineHtml(s.items)}</p>`,
          )
          .join("");
      } else if (key === "workExperiences") {
        body = data.workExperiences
          .map((item) => {
            const dateRange = formatWordDateRange(
              item.startDate,
              item.endDate,
              item.current,
            );
            return `<div style="margin-bottom:8pt">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:2pt">
                <tr>
                  <td style="font-size:${fontSize}pt;font-weight:bold;color:#111">${escapeHtml(item.company)}${
                    item.position
                      ? ` <span style="font-weight:normal;color:#444;font-size:${fontSize - 0.5}pt">${escapeHtml(item.position)}</span>`
                      : ""
                  }</td>
                  <td align="right" style="font-size:${fontSize - 0.5}pt;color:#444;white-space:nowrap">${dateRange}</td>
                </tr>
              </table>
              ${renderWordDescription(item.description, fontSize)}
            </div>`;
          })
          .join("");
      } else if (key === "projects") {
        body = renderWordProjects(data.projects, fontSize);
      } else if (key === "openSource") {
        body = renderWordProjects(data.openSource ?? [], fontSize);
      } else if (key === "educations") {
        body = data.educations
          .map((item) => {
            const dateRange = formatWordDateRange(item.startDate, item.endDate);
            const meta = [
              item.major,
              item.degree,
              item.gpa && `GPA ${item.gpa}`,
            ]
              .filter(Boolean)
              .map(escapeHtml)
              .join(" · ");
            return `<div style="margin-bottom:6pt">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:2pt">
                <tr>
                  <td style="font-size:${fontSize}pt;font-weight:bold;color:#111">${escapeHtml(item.school)}</td>
                  <td align="right" style="font-size:${fontSize - 0.5}pt;color:#444;white-space:nowrap">${dateRange}</td>
                </tr>
              </table>
              ${meta ? `<p style="margin:1pt 0 2pt;font-size:${fontSize - 0.5}pt;color:#333">${meta}</p>` : ""}
              ${renderWordDescription(item.description, fontSize)}
            </div>`;
          })
          .join("");
      }

      if (!body.trim()) return "";
      const label = escapeHtml(getSectionLabel(data, key));
      return `<div style="margin-top:12pt">
        <h2 style="margin:0 0 6pt;padding-bottom:3pt;font-size:${fontSize + 1.5}pt;font-weight:bold;color:${accent};border-bottom:1pt solid #444">${label}</h2>
        ${body}
      </div>`;
    })
    .filter(Boolean)
    .join("");

  const align =
    appearance.personalInfoLayout === "center" ? "center" : "left";
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${escapeHtml(filename)}</title>
<style>
  @page WordSection1 {
    size: 595.3pt 841.9pt;
    margin: 28pt 32pt;
  }
  div.WordSection1 { page: WordSection1; }
  body { font-family: "PingFang SC", "Microsoft YaHei", sans-serif; color: #171717; }
</style>
</head>
<body>
<div class="WordSection1">
  <div style="text-align:${align};margin-bottom:12pt">
    <h1 style="margin:0 0 4pt;font-size:18pt;font-weight:bold;color:#111">${escapeHtml(data.name || "您的姓名")}</h1>
    ${data.title ? `<p style="margin:0 0 4pt;font-size:${fontSize + 0.5}pt;color:#333">${escapeHtml(data.title)}</p>` : ""}
    ${contacts.length ? `<p style="margin:0;font-size:${fontSize - 0.5}pt;color:#333">${contacts.join(" | ")}</p>` : ""}
  </div>
  ${sectionsHtml}
</div>
</body>
</html>`;

  const blob = new Blob(["\ufeff", html], {
    type: "application/msword;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${sanitizeFilename(filename)}.doc`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatMdDate(value: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
  return match ? `${match[1]}年${match[2]}月` : value.trim();
}

function formatMdDateRange(
  startDate: string,
  endDate: string,
  current?: boolean,
): string {
  const start = formatMdDate(startDate);
  const end = current || endDate === "至今" ? "至今" : formatMdDate(endDate);
  if (!start && !end) return "";
  return [start, end].filter(Boolean).join(" - ");
}

function renderMdDescription(text: string): string {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) =>
      /^[•·]\s*/.test(line) ? `- ${line.replace(/^[•·]\s*/, "")}` : line,
    )
    .join("\n");
}

function renderMdProjects(items: Project[]): string {
  return items
    .map((item) => {
      const dateRange = formatMdDateRange(item.startDate, item.endDate);
      const title = item.link ? `${item.name} (${item.link})` : item.name;
      const header = dateRange
        ? `### ${title} | ${dateRange}`
        : `### ${title}`;
      const desc = renderMdDescription(item.description);
      return [header, item.role ? `*${item.role}*` : "", desc]
        .filter(Boolean)
        .join("\n\n");
    })
    .join("\n\n");
}

export function exportResumeMarkdown(data: ResumeData, filename: string) {
  const contacts = [
    data.phone,
    data.email,
    data.location,
    data.github,
    data.website,
  ].filter(Boolean);

  const headerLines = [
    `# ${data.name || "您的姓名"}`,
    data.title ? `**${data.title}**` : "",
    contacts.length ? contacts.join(" | ") : "",
  ].filter(Boolean);

  const sectionsMd = data.sectionOrder
    .filter((key) => !data.hiddenSections?.includes(key))
    .map((key) => {
      let body = "";
      if (isCustomSectionKey(key)) {
        const custom = data.customSections?.find((s) => s.id === key);
        if (!custom) return "";
        body = [
          custom.content.trim() ? renderMdDescription(custom.content) : "",
          custom.items?.length ? renderMdProjects(custom.items) : "",
        ]
          .filter(Boolean)
          .join("\n\n");
      } else if (key === "summary") {
        body = renderMdDescription(data.summary);
      } else if (key === "skills") {
        body = data.skills
          .map((s) =>
            s.category && s.category !== "技能"
              ? `- **${s.category}**：${s.items}`
              : `- ${s.items}`,
          )
          .join("\n");
      } else if (key === "workExperiences") {
        body = data.workExperiences
          .map((item) => {
            const dateRange = formatMdDateRange(
              item.startDate,
              item.endDate,
              item.current,
            );
            const heading = [
              item.company,
              item.position,
              dateRange,
            ]
              .filter(Boolean)
              .join(" | ");
            const desc = renderMdDescription(item.description);
            return [`### ${heading}`, desc].filter(Boolean).join("\n\n");
          })
          .join("\n\n");
      } else if (key === "projects") {
        body = renderMdProjects(data.projects);
      } else if (key === "openSource") {
        body = renderMdProjects(data.openSource ?? []);
      } else if (key === "educations") {
        body = data.educations
          .map((item) => {
            const dateRange = formatMdDateRange(item.startDate, item.endDate);
            const meta = [
              item.major,
              item.degree,
              item.gpa && `GPA ${item.gpa}`,
            ]
              .filter(Boolean)
              .join(" · ");
            const heading = [item.school, dateRange]
              .filter(Boolean)
              .join(" | ");
            const desc = renderMdDescription(item.description);
            return [`### ${heading}`, meta, desc].filter(Boolean).join("\n\n");
          })
          .join("\n\n");
      }

      if (!body.trim()) return "";
      return `## ${getSectionLabel(data, key)}\n\n${body}`;
    })
    .filter(Boolean);

  const markdown = `${[headerLines.join("\n\n"), ...sectionsMd].join("\n\n---\n\n")}\n`;
  const blob = new Blob([markdown], {
    type: "text/markdown;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${sanitizeFilename(filename)}.md`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

