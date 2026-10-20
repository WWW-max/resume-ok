import {
  type BuiltinSectionKey,
  type Project,
  type ResumeData,
  DEFAULT_SECTION_ORDER,
  SECTION_LABELS,
} from "./resume-data";

const ENGLISH_SECTION_LABELS: Record<BuiltinSectionKey, string> = {
  summary: "Summary",
  skills: "Technical Skills",
  workExperiences: "Work Experience",
  projects: "Projects",
  openSource: "Open Source",
  educations: "Education",
};

export async function translateResumeToEnglish(
  data: ResumeData,
): Promise<ResumeData> {
  const queue: string[] = [];
  const register = (text: string): number => {
    const index = queue.length;
    queue.push(text);
    return index;
  };

  const nameIdx = register(data.name);
  const titleIdx = register(data.title);
  const locationIdx = register(data.location);
  const summaryIdx = register(data.summary);

  const workIndices = data.workExperiences.map((item) => ({
    company: register(item.company),
    position: register(item.position),
    endDate: item.endDate === "至今" ? -1 : register(item.endDate),
    description: register(item.description),
  }));

  const eduIndices = data.educations.map((item) => ({
    school: register(item.school),
    major: register(item.major),
    degree: register(item.degree),
    description: register(item.description),
  }));

  const registerProjects = (items: Project[]) =>
    items.map((item) => ({
      name: register(item.name),
      role: register(item.role),
      endDate: item.endDate === "至今" ? -1 : register(item.endDate),
      description: register(item.description),
    }));

  const projectIndices = registerProjects(data.projects);
  const openSourceIndices = registerProjects(data.openSource ?? []);

  const skillIndices = data.skills.map((s) => ({
    category: register(s.category),
    items: register(s.items),
  }));

  const customIndices = (data.customSections ?? []).map((sec) => ({
    title: register(sec.title),
    content: register(sec.content),
    items: registerProjects(sec.items ?? []),
  }));

  const customBuiltinTitles: Partial<Record<BuiltinSectionKey, number>> = {};
  for (const key of DEFAULT_SECTION_ORDER) {
    const customTitle = data.sectionTitles?.[key]?.trim();
    if (customTitle && customTitle !== SECTION_LABELS[key]) {
      customBuiltinTitles[key] = register(customTitle);
    }
  }

  const response = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texts: queue, target: "en" }),
  });

  if (!response.ok) {
    let message = "简历翻译失败，请稍后重试。";
    try {
      const err = await response.json();
      if (err?.error?.message) message = err.error.message;
    } catch {
      // ignore JSON parse error
    }
    throw new Error(message);
  }

  const { translations } = (await response.json()) as {
    translations: string[];
  };
  const pick = (idx: number) => translations[idx] ?? queue[idx] ?? "";

  const rebuildProjects = (
    items: Project[],
    indices: ReturnType<typeof registerProjects>,
  ): Project[] =>
    items.map((item, i) => ({
      ...item,
      name: pick(indices[i].name),
      role: pick(indices[i].role),
      endDate:
        indices[i].endDate === -1 ? "Present" : pick(indices[i].endDate),
      description: pick(indices[i].description),
    }));

  const nextSectionTitles: Partial<Record<string, string>> = {
    ...data.sectionTitles,
  };
  for (const key of DEFAULT_SECTION_ORDER) {
    const customIdx = customBuiltinTitles[key];
    nextSectionTitles[key] =
      customIdx !== undefined ? pick(customIdx) : ENGLISH_SECTION_LABELS[key];
  }

  const nextCustomSections = (data.customSections ?? []).map((sec, i) => {
    const translatedTitle = pick(customIndices[i].title);
    nextSectionTitles[sec.id] = translatedTitle;
    return {
      ...sec,
      title: translatedTitle,
      content: pick(customIndices[i].content),
      items: rebuildProjects(sec.items ?? [], customIndices[i].items),
    };
  });

  return {
    ...data,
    name: pick(nameIdx),
    title: pick(titleIdx),
    location: pick(locationIdx),
    summary: pick(summaryIdx),
    workExperiences: data.workExperiences.map((item, i) => ({
      ...item,
      company: pick(workIndices[i].company),
      position: pick(workIndices[i].position),
      endDate:
        workIndices[i].endDate === -1
          ? "Present"
          : pick(workIndices[i].endDate),
      description: pick(workIndices[i].description),
    })),
    educations: data.educations.map((item, i) => ({
      ...item,
      school: pick(eduIndices[i].school),
      major: pick(eduIndices[i].major),
      degree: pick(eduIndices[i].degree),
      description: pick(eduIndices[i].description),
    })),
    projects: rebuildProjects(data.projects, projectIndices),
    openSource: rebuildProjects(data.openSource ?? [], openSourceIndices),
    skills: data.skills.map((s, i) => ({
      ...s,
      category: pick(skillIndices[i].category),
      items: pick(skillIndices[i].items),
    })),
    customSections: nextCustomSections,
    sectionTitles: nextSectionTitles,
  };
}
