import {
  defaultResumeData,
  DEFAULT_SECTION_ORDER,
  type ResumeData,
} from "./resume-data";
export const STORAGE_KEY = "resumeok.library.v1";
export interface ResumeDocument {
  id: string;
  name: string;
  data: ResumeData;
  updatedAt: string;
  archived?: boolean;
}
export interface ResumeLibrary {
  version: 1;
  activeId: string;
  documents: ResumeDocument[];
}
export function createLibrary(): ResumeLibrary {
  return {
    version: 1,
    activeId: "first-resume",
    documents: [
      {
        id: "first-resume",
        name: "我的第一份简历",
        data: structuredClone(defaultResumeData),
        updatedAt: "",
      },
    ],
  };
}
export function blankResume(): ResumeData {
  return {
    name: "",
    title: "",
    phone: "",
    email: "",
    location: "",
    github: "",
    website: "",
    avatar: "",
    summary: "",
    workExperiences: [],
    educations: [],
    projects: [],
    skills: [],
    sectionOrder: [...DEFAULT_SECTION_ORDER],
  };
}
const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
export function isResumeData(value: unknown): value is ResumeData {
  if (!isRecord(value)) return false;
  if (
    ![
      "name",
      "title",
      "phone",
      "email",
      "location",
      "github",
      "website",
      "avatar",
      "summary",
    ].every((k) => typeof value[k] === "string")
  )
    return false;
  if (
    value.avatar &&
    !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(
      String(value.avatar),
    )
  )
    return false;
  const lists: Record<string, string[]> = {
    workExperiences: [
      "id",
      "company",
      "position",
      "startDate",
      "endDate",
      "description",
    ],
    educations: [
      "id",
      "school",
      "major",
      "degree",
      "startDate",
      "endDate",
      "gpa",
      "description",
    ],
    projects: [
      "id",
      "name",
      "role",
      "startDate",
      "endDate",
      "link",
      "description",
    ],
    skills: ["id", "category", "items"],
  };
  for (const [key, fields] of Object.entries(lists)) {
    const list = value[key];
    if (
      !Array.isArray(list) ||
      list.length > 100 ||
      new Set(list.map((item) => (isRecord(item) ? item.id : null))).size !==
        list.length
    )
      return false;
    if (
      !list.every(
        (item) =>
          isRecord(item) &&
          fields.every((k) => typeof item[k] === "string") &&
          (key !== "workExperiences" || typeof item.current === "boolean"),
      )
    )
      return false;
  }
  if (
    !Array.isArray(value.sectionOrder) ||
    value.sectionOrder.length !== DEFAULT_SECTION_ORDER.length ||
    new Set(value.sectionOrder).size !== DEFAULT_SECTION_ORDER.length ||
    !value.sectionOrder.every((k) => DEFAULT_SECTION_ORDER.includes(k))
  )
    return false;
  if (
    value.hiddenSections !== undefined &&
    (!Array.isArray(value.hiddenSections) ||
      !value.hiddenSections.every((k) => DEFAULT_SECTION_ORDER.includes(k)))
  )
    return false;
  if (value.appearance !== undefined) {
    const a = value.appearance;
    if (
      !isRecord(a) ||
      !["classic", "minimal", "modern"].includes(String(a.template)) ||
      !["green", "fresh", "forest"].includes(String(a.accent)) ||
      typeof a.fontSize !== "number" ||
      a.fontSize < 10 ||
      a.fontSize > 15 ||
      !["comfortable", "compact"].includes(String(a.spacing)) ||
      typeof a.showBrand !== "boolean"
    )
      return false;
  }
  return true;
}
export function parseLibrary(raw: string): ResumeLibrary {
  const value: unknown = JSON.parse(raw);
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    typeof value.activeId !== "string" ||
    !Array.isArray(value.documents) ||
    !value.documents.length ||
    value.documents.length > 100
  )
    throw new Error("简历备份格式无效或版本不兼容。");
  for (const document of value.documents) {
    if (
      !isRecord(document) ||
      !isRecord(document.data) ||
      !isRecord(document.data.appearance)
    )
      continue;
    const appearance = document.data.appearance;
    if (appearance.accent === "blue") appearance.accent = "fresh";
    if (appearance.accent === "slate") appearance.accent = "forest";
  }
  if (
    !value.documents.every(
      (doc) =>
        isRecord(doc) &&
        typeof doc.id === "string" &&
        typeof doc.name === "string" &&
        typeof doc.updatedAt === "string" &&
        (doc.archived === undefined || typeof doc.archived === "boolean") &&
        isResumeData(doc.data),
    )
  )
    throw new Error("简历内容不完整，未导入任何数据。");
  const docs = value.documents as unknown as ResumeDocument[];
  if (
    new Set(docs.map((d) => d.id)).size !== docs.length ||
    !docs.some((d) => d.id === value.activeId && !d.archived)
  )
    throw new Error("简历列表无效。");
  return value as unknown as ResumeLibrary;
}
export function downloadBackup(library: ResumeLibrary) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(library, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "ResumeOK-简历备份.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
