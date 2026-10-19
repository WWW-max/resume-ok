"use client";
import { ui } from "@/lib/ui-styles";
import { useRef, useState } from "react";
import {
  ResumeData,
  SectionKey,
  SECTION_LABELS,
  getSectionLabel,
} from "@/lib/resume-data";
import { BasicInfoForm } from "./BasicInfoForm";
import { WorkExperienceForm } from "./WorkExperienceForm";
import { EducationForm } from "./EducationForm";
import { ProjectForm } from "./ProjectForm";
import { SkillsForm } from "./SkillsForm";
import { SummaryForm } from "./SummaryForm";
import {
  UserRound,
  BriefcaseBusiness,
  GraduationCap,
  Folders,
  CodeXml,
  Star,
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Plus,
  MoreVertical,
  ArrowUp,
  ArrowDown,
  EyeOff,
  Pencil,
} from "lucide-react";
import { ExperienceForm } from "./ExperienceForm";
function OpenSourceForm(props: {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}) {
  return <ExperienceForm {...props} section="openSource" />;
}
export type EditorSection = "basic" | SectionKey;
export const sectionIcons = {
  basic: UserRound,
  workExperiences: BriefcaseBusiness,
  educations: GraduationCap,
  projects: Folders,
  openSource: CodeXml,
  skills: Star,
  summary: UserRound,
};
const hints = {
  basic: "姓名、电话、邮箱、地址、求职意向等",
  workExperiences: "工作经历、职责与成就",
  projects: "项目经验、角色与成果",
  openSource: "开源项目、个人作品与技术贡献",
  educations: "学历、学校、专业等",
  skills: "专业技能、工具、语言等",
  summary: "个人优势、职业倾向等",
};
export const sectionForms = {
  basic: BasicInfoForm,
  workExperiences: WorkExperienceForm,
  educations: EducationForm,
  projects: ProjectForm,
  openSource: OpenSourceForm,
  skills: SkillsForm,
  summary: SummaryForm,
};
export function EditorPanel({
  data,
  onChange,
  onAssistant,
  initialSection = null,
}: {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
  onAssistant: () => void;
  initialSection?: EditorSection | null;
}) {
  const [active, setActive] = useState<EditorSection | null>(initialSection);
  const [editingTitle, setEditingTitle] = useState(false);
  const dragKey = useRef<SectionKey | null>(null);
  const [adding, setAdding] = useState(false);
  function move(key: SectionKey, target: number) {
    const order = [...data.sectionOrder];
    const from = order.indexOf(key);
    if (target < 0 || target >= order.length || from === target) return;
    order.splice(from, 1);
    order.splice(target, 0, key);
    onChange({ ...data, sectionOrder: order });
  }
  const hidden = data.hiddenSections ?? [];
  const Form = active ? sectionForms[active] : null;
  return (
    <div className={ui["editor-panel"]}>
      <div className={ui["panel-heading"]}>
        <h1>编辑简历</h1>
        <p>拖拽模块排序，点击模块进行编辑，右侧实时更新</p>
      </div>
      <div className={`${ui["panel-scroll"]} pt-[18px] max-[900px]:pb-6`}>
        {active && Form ? (
          <>
            <button
              className={ui["back-button"]}
              onClick={() => {
                setEditingTitle(false);
                setActive(null);
              }}
            >
              <ChevronLeft size={16} />
              返回简历模块
            </button>
            {active === "basic" ? (
              <h2 className={ui["form-heading"]}>个人信息</h2>
            ) : (
              <div className="px-[17px] pb-[18px]">
                {editingTitle ? (
                  <input
                    type="text"
                    aria-label="模块名称"
                    autoFocus
                    maxLength={50}
                    value={
                      data.sectionTitles?.[active] ?? SECTION_LABELS[active]
                    }
                    placeholder={SECTION_LABELS[active]}
                    onChange={(e) =>
                      onChange({
                        ...data,
                        sectionTitles: {
                          ...data.sectionTitles,
                          [active]: e.target.value,
                        },
                      })
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === "Escape") {
                        e.currentTarget.blur();
                      }
                    }}
                    onBlur={(e) => {
                      if (!e.target.value.trim()) {
                        const nextTitles = { ...data.sectionTitles };
                        delete nextTitles[active];
                        onChange({ ...data, sectionTitles: nextTitles });
                      }
                      setEditingTitle(false);
                    }}
                    className="w-48 rounded-[7px] border border-[#19af60] bg-white px-2.5 py-1 -ml-2.5 text-[18px] font-[650] text-ink ring-2 ring-[#19af60]/20 focus:outline-none"
                  />
                ) : (
                  <button
                    type="button"
                    title="点击修改模块名称"
                    onClick={() => setEditingTitle(true)}
                    className="group inline-flex items-center gap-1.5 rounded-[7px] px-2 py-1 -ml-2 text-[18px] font-[650] text-ink transition-colors hover:bg-[#eef9f3] hover:text-[#08a644]"
                  >
                    <span>{getSectionLabel(data, active)}</span>
                    <Pencil
                      size={15}
                      aria-hidden="true"
                      className="shrink-0 text-[#599b6f] transition-colors group-hover:text-[#08a644]"
                    />
                  </button>
                )}
              </div>
            )}
            <Form data={data} onChange={onChange} />
          </>
        ) : (
          <div className={ui["module-list"]}>
            <div className={ui["section-heading"]}>
              <h2>简历模块</h2>
              <button
                className={ui["outline-green"]}
                onClick={() => setAdding(!adding)}
                aria-expanded={adding}
              >
                <Plus size={15} />
                添加模块
              </button>
            </div>
            {adding && (
              <div className={ui["restore-modules"]}>
                <p>
                  {hidden.length
                    ? "选择要恢复的模块，原有内容会保留。"
                    : "所有模块均已添加。进入模块可添加多条经历。"}
                </p>
                {hidden.map((key) => (
                  <button
                    className={ui["soft-button"]}
                    key={key}
                    onClick={() => {
                      onChange({
                        ...data,
                        hiddenSections: hidden.filter((k) => k !== key),
                      });
                      setAdding(false);
                    }}
                  >
                    <Plus size={14} />
                    {getSectionLabel(data, key)}
                  </button>
                ))}
              </div>
            )}
            {(
              [
                "basic",
                ...data.sectionOrder.filter((key) => !hidden.includes(key)),
              ] as EditorSection[]
            ).map((key, index) => {
              const Icon = sectionIcons[key];
              const label =
                key === "basic" ? "个人信息" : getSectionLabel(data, key);
              return (
                <div
                  key={key}
                  draggable={key !== "basic"}
                  onDragStart={(e) => {
                    if (key !== "basic") {
                      dragKey.current = key;
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", key);
                    }
                  }}
                  onDragOver={(e) => {
                    if (key !== "basic") e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragKey.current && key !== "basic")
                      move(dragKey.current, data.sectionOrder.indexOf(key));
                    dragKey.current = null;
                  }}
                  onDragEnd={() => {
                    dragKey.current = null;
                  }}
                  className={`${ui["module-card"]} ${index === 0 ? "selected" : ""}`}
                >
                  <button
                    className={ui["module-main"]}
                    onClick={() => setActive(key)}
                  >
                    <GripVertical size={16} className={ui["grip"]} />
                    <Icon size={20} />
                    <span>
                      <strong>{label}</strong>
                      <small>{hints[key]}</small>
                    </span>
                  </button>
                  {key === "basic" ? (
                    <ChevronRight size={17} className={ui["grip"]} />
                  ) : (
                    <details className={ui["module-menu"]}>
                      <summary aria-label={`${label}操作`}>
                        <MoreVertical size={18} />
                      </summary>
                      <div>
                        <button
                          disabled={data.sectionOrder.indexOf(key) === 0}
                          onClick={() =>
                            move(key, data.sectionOrder.indexOf(key) - 1)
                          }
                        >
                          <ArrowUp size={14} />
                          上移
                        </button>
                        <button
                          disabled={
                            data.sectionOrder.indexOf(key) ===
                            data.sectionOrder.length - 1
                          }
                          onClick={() =>
                            move(key, data.sectionOrder.indexOf(key) + 1)
                          }
                        >
                          <ArrowDown size={14} />
                          下移
                        </button>
                        <button
                          onClick={() =>
                            onChange({
                              ...data,
                              hiddenSections: [...hidden, key],
                            })
                          }
                        >
                          <EyeOff size={14} />
                          隐藏模块
                        </button>
                      </div>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className={ui["assistant-banner"]}>
        <Lightbulb size={23} />
        <div>
          <strong>简历助手 · LuckyMe</strong>
          <p>完善简历内容，让优势更出众</p>
        </div>
        <button onClick={onAssistant}>立即使用 →</button>
      </div>
    </div>
  );
}
