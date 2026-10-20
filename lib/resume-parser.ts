import {
  type BuiltinSectionKey,
  type CustomSection,
  type CustomSectionKey,
  type Education,
  type Project,
  type ResumeData,
  type SectionKey,
  type Skill,
  type WorkExperience,
  DEFAULT_SECTION_ORDER,
} from "./resume-data";
import { defaultAppearance } from "./resume-appearance";

const SECTION_HEADER_PATTERNS: Array<{
  key: BuiltinSectionKey | "custom";
  pattern: RegExp;
  defaultTitle: string;
}> = [
  {
    key: "skills",
    pattern:
      /^(?:#+\s*)?(?:专业技能|个人技能|技能特长|技能清单|技术栈|核心技能|technical\s+skills|skills)$/i,
    defaultTitle: "专业技能",
  },
  {
    key: "workExperiences",
    pattern:
      /^(?:#+\s*)?(?:工作经历|工作经验|实习经历|职业经历|work\s+experiences?|professional\s+experience|employment\s+history)$/i,
    defaultTitle: "工作经历",
  },
  {
    key: "projects",
    pattern:
      /^(?:#+\s*)?(?:项目经历|项目经验|核心项目|个人项目|project\s+experiences?|projects)$/i,
    defaultTitle: "项目经历",
  },
  {
    key: "openSource",
    pattern: /^(?:#+\s*)?(?:开源项目|开源贡献|个人作品|open\s+source)$/i,
    defaultTitle: "开源项目",
  },
  {
    key: "educations",
    pattern:
      /^(?:#+\s*)?(?:教育经历|教育背景|学习经历|学历背景|educations?)$/i,
    defaultTitle: "教育经历",
  },
  {
    key: "summary",
    pattern:
      /^(?:#+\s*)?(?:自我评价|个人总结|个人简介|个人优势|关于我|summary|profile|about\s+me)$/i,
    defaultTitle: "自我评价",
  },
  {
    key: "custom",
    pattern:
      /^(?:#+\s*)?(?:获奖荣誉|荣誉奖项|资格证书|证书|语言能力|校园经历|社团经历|科研经历|发表论文|个人社交|其他信息|awards?|honors?|certifications?|publications?|languages?|extracurricular)$/i,
    defaultTitle: "自定义模块",
  },
];

const DATE_TOKEN =
  "(?:(?:19|20)\\d{2}[年./\\-]\\s*\\d{1,2}月?(?:[日./\\-]\\d{1,2}日?)?|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\\s+(?:19|20)\\d{2}|(?:19|20)\\d{2}年)";
const END_DATE_TOKEN = `(?:${DATE_TOKEN}|至今|现在|目前|present|current|now)`;
const DATE_RANGE_REGEX = new RegExp(
  `(${DATE_TOKEN})\\s*(?:[-–—~至到]|to)\\s*(${END_DATE_TOKEN})`,
  "i",
);

const MONTHS_MAP: Record<string, string> = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

function normalizeDateToken(raw: string): { value: string; current: boolean } {
  const trimmed = raw.trim();
  if (/^(?:至今|现在|目前|present|current|now)$/i.test(trimmed)) {
    return { value: "至今", current: true };
  }
  const ymMatch = /^((?:19|20)\d{2})[年./\-]\s*(\d{1,2})/.exec(trimmed);
  if (ymMatch) {
    return {
      value: `${ymMatch[1]}-${ymMatch[2].padStart(2, "0")}`,
      current: false,
    };
  }
  const enMatch = /^([A-Za-z]{3})[a-z]*\s+((?:19|20)\d{2})$/.exec(trimmed);
  if (enMatch) {
    const m = MONTHS_MAP[enMatch[1].toLowerCase()] ?? "01";
    return { value: `${enMatch[2]}-${m}`, current: false };
  }
  const yMatch = /^((?:19|20)\d{2})年?$/.exec(trimmed);
  if (yMatch) {
    return { value: `${yMatch[1]}-09`, current: false };
  }
  return { value: trimmed, current: false };
}

function cleanLine(line: string): string {
  return line
    .replace(/^---+\s*$/, "")
    .replace(/\u00a0/g, " ")
    .trim();
}

function detectSectionHeader(line: string): {
  key: BuiltinSectionKey | "custom";
  title: string;
} | null {
  const cleaned = line
    .replace(/^#+\s*/, "")
    .replace(/[：:]\s*$/, "")
    .trim();
  if (!cleaned || cleaned.length > 24) return null;

  for (const item of SECTION_HEADER_PATTERNS) {
    if (item.pattern.test(cleaned)) {
      return { key: item.key, title: cleaned };
    }
  }
  if (/^##\s+(.+)$/.test(line.trim())) {
    const mdHeading = line.trim().replace(/^##\s+/, "").trim();
    if (mdHeading.length <= 24) {
      return { key: "custom", title: mdHeading };
    }
  }
  return null;
}

interface ParsedEntry {
  headerLeft: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bodyLines: string[];
}

function parseEntriesByDate(lines: string[]): ParsedEntry[] {
  const entries: ParsedEntry[] = [];
  let currentEntry: ParsedEntry | null = null;
  let pendingTitleLine = "";

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.replace(/^###\s+/, "").trim();
    if (!line) continue;

    const nextLine = (lines[i + 1] ?? "").replace(/^###\s+/, "").trim();
    const isFollowedByProjectMeta =
      /^(?:项目简介|项目描述|项目介绍)[：:]/.test(nextLine);
    const dateMatch = DATE_RANGE_REGEX.exec(line);
    const isBullet = /^[•·\-*]\s+/.test(line) || /^\d+[.、]\s+/.test(line);

    if (dateMatch && !isBullet) {
      const startInfo = normalizeDateToken(dateMatch[1]);
      const endInfo = normalizeDateToken(dateMatch[2]);
      let headerLeft = line
        .slice(0, dateMatch.index)
        .replace(/[|｜·•\-–—]+\s*$/, "")
        .trim();
      const headerRight = line
        .slice(dateMatch.index + dateMatch[0].length)
        .replace(/^\s*[|｜·•\-–—]+/, "")
        .trim();

      if (!headerLeft && pendingTitleLine) {
        headerLeft = pendingTitleLine;
        pendingTitleLine = "";
      } else if (pendingTitleLine && currentEntry) {
        currentEntry.bodyLines.push(pendingTitleLine);
        pendingTitleLine = "";
      }

      if (headerRight && !headerLeft) {
        headerLeft = headerRight;
      } else if (headerRight) {
        headerLeft = `${headerLeft} ${headerRight}`.trim();
      }

      currentEntry = {
        headerLeft,
        startDate: startInfo.value,
        endDate: endInfo.current ? "至今" : endInfo.value,
        current: endInfo.current,
        bodyLines: [],
      };
      entries.push(currentEntry);
    } else if (isFollowedByProjectMeta && !isBullet && line.length <= 65) {
      if (pendingTitleLine && currentEntry) {
        currentEntry.bodyLines.push(pendingTitleLine);
      }
      pendingTitleLine = "";
      currentEntry = {
        headerLeft: line,
        startDate: "",
        endDate: "",
        current: false,
        bodyLines: [],
      };
      entries.push(currentEntry);
    } else if (!currentEntry) {
      if (pendingTitleLine) {
        currentEntry = {
          headerLeft: pendingTitleLine,
          startDate: "",
          endDate: "",
          current: false,
          bodyLines: [line],
        };
        entries.push(currentEntry);
        pendingTitleLine = "";
      } else {
        pendingTitleLine = line;
      }
    } else {
      currentEntry.bodyLines.push(line);
    }
  }

  if (pendingTitleLine) {
    if (currentEntry) {
      currentEntry.bodyLines.push(pendingTitleLine);
    } else {
      entries.push({
        headerLeft: pendingTitleLine,
        startDate: "",
        endDate: "",
        current: false,
        bodyLines: [],
      });
    }
  }

  return entries;
}

function formatBodyDescription(lines: string[]): string {
  return lines
    .map((line) => {
      const trimmed = line.trim();
      if (/^[•·\-*]\s+/.test(trimmed)) {
        return `• ${trimmed.replace(/^[•·\-*]\s+/, "")}`;
      }
      return trimmed;
    })
    .join("\n");
}

function parseWorkExperiences(lines: string[]): WorkExperience[] {
  return parseEntriesByDate(lines).map((entry) => {
    let company = entry.headerLeft;
    let position = "";
    const parts = entry.headerLeft
      .split(/\s*[|｜·•]\s*|\s{2,}/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      company = parts[0];
      position = parts.slice(1).join(" · ");
    }
    return {
      id: crypto.randomUUID(),
      company: company || "公司名称",
      position,
      startDate: entry.startDate,
      endDate: entry.endDate,
      current: entry.current,
      description: formatBodyDescription(entry.bodyLines),
    };
  });
}

function parseProjects(lines: string[]): Project[] {
  return parseEntriesByDate(lines).map((entry) => {
    let name = entry.headerLeft;
    let link = "";
    const urlMatch = /(https?:\/\/[^\s)]+)/i.exec(name);
    if (urlMatch) {
      link = urlMatch[1];
      name = name
        .replace(urlMatch[0], "")
        .replace(/[()（）.\s]+$/, "")
        .trim();
    }

    const bodyLines = [...entry.bodyLines];
    let role = "";
    if (
      bodyLines.length > 0 &&
      !/^[•·\-*]/.test(bodyLines[0]) &&
      bodyLines[0].length <= 40 &&
      !/^(?:项目简介|项目描述|项目介绍|技术栈|主要工作|主要成果|核心职责)[：:]/.test(
        bodyLines[0],
      )
    ) {
      role = bodyLines.shift()!.replace(/^\*(.+)\*$/, "$1");
    }

    return {
      id: crypto.randomUUID(),
      name: name || "项目名称",
      role,
      startDate: entry.startDate,
      endDate: entry.endDate,
      link,
      description: formatBodyDescription(bodyLines),
    };
  });
}

function parseEducations(lines: string[]): Education[] {
  return parseEntriesByDate(lines).map((entry) => {
    let school = entry.headerLeft || "学校名称";
    let major = "";
    let degree = "";
    let gpa = "";
    const headerParts = school
      .split(/\s*[|｜·•]\s*|\s{2,}/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (headerParts.length >= 2) {
      school = headerParts[0];
      major = headerParts[1] ?? "";
      degree = headerParts.slice(2).join(" ");
    }
    const bodyLines = [...entry.bodyLines];

    if (bodyLines.length > 0 && !major && !degree) {
      const firstLine = bodyLines[0];
      const degreeMatch =
        /(博士|硕士|研究生|本科|大专|学士|Master|Bachelor|Ph\.?D|B\.S\.|M\.S\.)/i.exec(
          firstLine,
        );
      const gpaMatch = /GPA[:：\s]*([\d.]+\s*(?:\/\s*[\d.]+)?)/i.exec(
        firstLine,
      );
      if (degreeMatch || gpaMatch || firstLine.length <= 45) {
        bodyLines.shift();
        if (gpaMatch) gpa = gpaMatch[1].trim();
        const cleaned = firstLine
          .replace(/GPA[:：\s]*[\d.]+\s*(?:\/\s*[\d.]+)?/i, "")
          .trim();
        const tokens = cleaned
          .split(/\s*[·|｜/]\s*|\s+/)
          .map((t) => t.trim())
          .filter(Boolean);
        if (tokens.length >= 2) {
          major = tokens[0];
          degree = tokens.slice(1).join(" ");
        } else if (tokens.length === 1) {
          major = tokens[0];
        }
      }
    }

    return {
      id: crypto.randomUUID(),
      school,
      major,
      degree,
      startDate: entry.startDate,
      endDate: entry.endDate,
      gpa,
      description: formatBodyDescription(bodyLines),
    };
  });
}

function parseSkills(lines: string[]): Skill[] {
  const skills: Skill[] = [];
  for (const raw of lines) {
    const cleaned = raw.replace(/^[•·\-*]\s*/, "").trim();
    if (!cleaned) continue;
    const colonMatch = /^([^：:]{1,20})[：:]\s*(.+)$/.exec(cleaned);
    if (colonMatch) {
      skills.push({
        id: crypto.randomUUID(),
        category: colonMatch[1].replace(/\*\*/g, "").trim(),
        items: colonMatch[2].trim(),
      });
    } else if (skills.length > 0 && !/^[•·\-*]/.test(raw.trim())) {
      skills[skills.length - 1].items += ` ${cleaned}`;
    } else {
      skills.push({
        id: crypto.randomUUID(),
        category: "技能",
        items: cleaned,
      });
    }
  }
  return skills;
}

export function parseResumeText(
  rawText: string,
  fallbackName = "",
): ResumeData {
  const rawLines = rawText
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean);

  const headerLines: string[] = [];
  const sections: Array<{
    key: BuiltinSectionKey | "custom";
    title: string;
    lines: string[];
  }> = [];

  let currentSection: {
    key: BuiltinSectionKey | "custom";
    title: string;
    lines: string[];
  } | null = null;

  for (const line of rawLines) {
    const header = detectSectionHeader(line);
    if (header) {
      currentSection = {
        key: header.key,
        title: header.title,
        lines: [],
      };
      sections.push(currentSection);
    } else if (currentSection) {
      currentSection.lines.push(line);
    } else {
      headerLines.push(line);
    }
  }

  const headerText = headerLines.join(" | ");
  const emailMatch = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/.exec(
    headerText,
  );
  const phoneMatch =
    /(?:(?:\+?86)?[-\s]?)?(1[3-9]\d[-\s]?\d{3,4}[-\s]?\d{3,4})/.exec(
      headerText,
    );
  const urls = Array.from(
    headerText.matchAll(/https?:\/\/[^\s|｜,，)]+/gi),
    (m) => m[0],
  );
  const githubUrl =
    urls.find((u) => /github\.com|gitee\.com/i.test(u)) ?? "";
  const websiteUrl =
    urls.find((u) => u !== githubUrl) ?? "";

  let name = "";
  let title = "";
  let location = "";

  for (const hLine of headerLines) {
    const stripped = hLine
      .replace(/^#+\s*/, "")
      .replace(/[^\s|｜]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, "")
      .replace(
        /(?:[A-Za-z◎⊕☎📞]\s*)?(?:(?:\+?86)?[-\s]?)?(1[3-9]\d[-\s]?\d{3,4}[-\s]?\d{3,4})/g,
        "",
      )
      .replace(/https?:\/\/[^\s|｜,，)]+/gi, "")
      .replace(/[|｜/◎⊕✉☎📞📍🌐🔗]/g, " ")
      .trim();
    if (!stripped) continue;

    const nameLabelMatch = /(?:姓名|Name)[：:]\s*([^\s|]+)/i.exec(stripped);
    if (nameLabelMatch && !name) {
      name = nameLabelMatch[1];
      continue;
    }
    const titleLabelMatch =
      /(?:求职意向|应聘岗位|期望职位|职位)[：:]\s*([^\s|]+)/i.exec(stripped);
    if (titleLabelMatch && !title) {
      title = titleLabelMatch[1];
      continue;
    }
    const locLabelMatch =
      /(?:所在地|城市|现居|地址)[：:]\s*([^\s|]+)/i.exec(stripped);
    if (locLabelMatch && !location) {
      location = locLabelMatch[1];
      continue;
    }

    if (!name && stripped.length <= 20) {
      name = stripped.replace(/\*\*/g, "").trim();
    } else if (!title && stripped.length <= 35 && !/(?:市|省|区)$/.test(stripped)) {
      title = stripped.replace(/\*\*/g, "").trim();
    } else if (!location && stripped.length <= 20) {
      location = stripped.replace(/\*\*/g, "").trim();
    }
  }

  if (!name && fallbackName) {
    name = fallbackName
      .replace(/\(\d{4}-\d{2}-\d{2}\)/g, "")
      .replace(/[_-\s]*简历$/i, "")
      .trim()
      .slice(0, 24);
  }

  let summary = "";
  const workExperiences: WorkExperience[] = [];
  const projects: Project[] = [];
  const openSource: Project[] = [];
  const educations: Education[] = [];
  const skills: Skill[] = [];
  const customSections: CustomSection[] = [];
  const sectionTitles: Partial<Record<SectionKey, string>> = {};
  const dynamicOrder: SectionKey[] = [];

  for (const sec of sections) {
    if (!sec.lines.length) continue;
    if (sec.key === "summary") {
      summary = formatBodyDescription(sec.lines);
      sectionTitles.summary = sec.title;
      if (!dynamicOrder.includes("summary")) dynamicOrder.push("summary");
    } else if (sec.key === "skills") {
      skills.push(...parseSkills(sec.lines));
      sectionTitles.skills = sec.title;
      if (!dynamicOrder.includes("skills")) dynamicOrder.push("skills");
    } else if (sec.key === "workExperiences") {
      workExperiences.push(...parseWorkExperiences(sec.lines));
      sectionTitles.workExperiences = sec.title;
      if (!dynamicOrder.includes("workExperiences"))
        dynamicOrder.push("workExperiences");
    } else if (sec.key === "projects") {
      projects.push(...parseProjects(sec.lines));
      sectionTitles.projects = sec.title;
      if (!dynamicOrder.includes("projects")) dynamicOrder.push("projects");
    } else if (sec.key === "openSource") {
      openSource.push(...parseProjects(sec.lines));
      sectionTitles.openSource = sec.title;
      if (!dynamicOrder.includes("openSource")) dynamicOrder.push("openSource");
    } else if (sec.key === "educations") {
      educations.push(...parseEducations(sec.lines));
      sectionTitles.educations = sec.title;
      if (!dynamicOrder.includes("educations")) dynamicOrder.push("educations");
    } else {
      const id: CustomSectionKey = `custom:${crypto.randomUUID()}`;
      customSections.push({
        id,
        title: sec.title,
        content: formatBodyDescription(sec.lines),
        items: [],
      });
      sectionTitles[id] = sec.title;
      dynamicOrder.push(id);
    }
  }

  for (const builtinKey of DEFAULT_SECTION_ORDER) {
    if (!dynamicOrder.includes(builtinKey)) {
      dynamicOrder.push(builtinKey);
    }
  }

  const hiddenSections: SectionKey[] = [];
  if (!summary.trim()) hiddenSections.push("summary");
  if (!openSource.length) hiddenSections.push("openSource");

  return {
    name: name || "未命名",
    title,
    phone: phoneMatch ? phoneMatch[1] : "",
    email: emailMatch ? emailMatch[1] : "",
    location,
    github: githubUrl,
    website: websiteUrl,
    avatar: "",
    schoolLogo: "",
    summary,
    workExperiences,
    educations,
    projects,
    openSource,
    skills,
    customSections,
    sectionOrder: dynamicOrder,
    hiddenSections,
    sectionTitles,
    appearance: { ...defaultAppearance },
  };
}
