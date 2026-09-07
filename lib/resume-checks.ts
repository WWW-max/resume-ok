import type { ResumeData, SectionKey } from "./resume-data";
export interface ResumeCheck {
  id: string;
  title: string;
  advice: string;
  section: "basic" | SectionKey;
  passed: boolean;
}
export function checkResume(data: ResumeData): ResumeCheck[] {
  const visible = (key: SectionKey) => !data.hiddenSections?.includes(key);
  const checks: ResumeCheck[] = [
    {
      id: "name",
      title: "姓名与求职意向",
      advice: "填写真实姓名和明确的目标职位，让招聘方快速了解你的方向。",
      section: "basic",
      passed: !!data.name.trim() && !!data.title.trim(),
    },
    {
      id: "contact",
      title: "有效联系方式",
      advice: "填写有效邮箱和联系电话，确保招聘方能联系到你。",
      section: "basic",
      passed:
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) &&
        data.phone.replace(/\D/g, "").length >= 7,
    },
  ];
  if (visible("workExperiences"))
    checks.push(
      {
        id: "work",
        title: "工作经历完整度",
        advice:
          "补齐公司、职位、起止日期与职责描述。没有工作经历时，可隐藏此模块。",
        section: "workExperiences",
        passed:
          data.workExperiences.length > 0 &&
          data.workExperiences.every(
            (w) =>
              !!w.company.trim() &&
              !!w.position.trim() &&
              !!w.startDate &&
              (w.current || !!w.endDate) &&
              !!w.description.trim(),
          ),
      },
      {
        id: "impact",
        title: "成果表达",
        advice:
          "用可核实的数据描述成果，如效率、规模、数量或比例。不要虚构数字。",
        section: "workExperiences",
        passed: data.workExperiences.some((w) => /\d/.test(w.description)),
      },
    );
  if (visible("projects"))
    checks.push({
      id: "projects",
      title: "项目经验",
      advice: "补齐项目名、角色和描述，突出你的实际贡献。",
      section: "projects",
      passed:
        data.projects.length > 0 &&
        data.projects.every(
          (p) => !!p.name.trim() && !!p.role.trim() && !!p.description.trim(),
        ),
    });
  if (visible("educations"))
    checks.push({
      id: "education",
      title: "教育背景",
      advice: "补齐学校、专业、学历和起止日期。",
      section: "educations",
      passed:
        data.educations.length > 0 &&
        data.educations.every(
          (e) =>
            !!e.school.trim() &&
            !!e.major.trim() &&
            !!e.degree &&
            !!e.startDate &&
            !!e.endDate,
        ),
    });
  if (visible("skills"))
    checks.push({
      id: "skills",
      title: "技能信息",
      advice: "填写与目标岗位相关的技能，使用 / 分隔。",
      section: "skills",
      passed:
        data.skills.length > 0 &&
        data.skills.every((s) => !!s.category.trim() && !!s.items.trim()),
    });
  if (visible("summary"))
    checks.push({
      id: "summary",
      title: "自我评价篇幅",
      advice: "建议控制在 80–150 字，突出专业优势，避免空泛套话。",
      section: "summary",
      passed:
        data.summary.trim().length >= 80 && data.summary.trim().length <= 150,
    });
  for (const section of [
    "workExperiences",
    "educations",
    "projects",
  ] as const) {
    if (visible(section))
      checks.push({
        id: `dates-${section}`,
        title:
          { workExperiences: "工作", educations: "教育", projects: "项目" }[
            section
          ] + "时间顺序",
        advice: "检查起止日期，结束时间不应早于开始时间。",
        section,
        passed: data[section].every((item) =>
          !("current" in item && item.current)
            ? !item.startDate || !item.endDate || item.endDate >= item.startDate
            : true,
        ),
      });
  }
  return checks;
}
