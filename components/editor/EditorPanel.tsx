"use client";
import { ui } from "@/lib/ui-styles";
import { useId, useRef, useState } from "react";
import {
  BuiltinSectionKey,
  CustomSection,
  CustomSectionKey,
  Project,
  ResumeData,
  SectionKey,
  SECTION_LABELS,
  getSectionLabel,
  isCustomSectionKey,
} from "@/lib/resume-data";
import { BasicInfoForm } from "./BasicInfoForm";
import { WorkExperienceForm } from "./WorkExperienceForm";
import { EducationForm } from "./EducationForm";
import { ProjectForm } from "./ProjectForm";
import { SkillsForm } from "./SkillsForm";
import { SummaryForm } from "./SummaryForm";
import { ClearableInput, ClearableTextarea } from "./ClearableField";
import { Input } from "@/components/ui/input";
import {
  UserRound,
  BriefcaseBusiness,
  GraduationCap,
  Folders,
  CodeXml,
  Star,
  LayoutList,
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
  Trash2,
} from "lucide-react";
import { ExperienceForm } from "./ExperienceForm";
function OpenSourceForm(props: {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}) {
  return <ExperienceForm {...props} section="openSource" />;
}
function CustomSectionForm({
  data,
  sectionKey,
  onChange,
  onDelete,
}: {
  data: ResumeData;
  sectionKey: CustomSectionKey;
  onChange: (data: ResumeData) => void;
  onDelete: () => void;
}) {
  const id = useId();
  const section = (data.customSections ?? []).find((s) => s.id === sectionKey);
  if (!section) return null;
  const items = section.items ?? [];
  function updateSection(patch: Partial<CustomSection>) {
    onChange({
      ...data,
      customSections: (data.customSections ?? []).map((s) =>
        s.id === sectionKey ? { ...s, ...patch } : s,
      ),
    });
  }
  function updateItem(
    itemId: string,
    key: keyof Project,
    value: string,
  ) {
    updateSection({
      items: items.map((item) =>
        item.id === itemId ? { ...item, [key]: value } : item,
      ),
    });
  }
  return (
    <div className={ui["resume-form"]}>
      <div className={`${ui["field"]} wide mb-5`}>
        <label htmlFor={`${id}-content`}>
          {section.title}内容（支持富文本加粗、列表与链接）
        </label>
        <ClearableTextarea
          id={`${id}-content`}
          rows={8}
          value={section.content}
          clearLabel={`清空${section.title}内容`}
          onClear={() => updateSection({ content: "" })}
          placeholder={`填写${section.title}详细内容，可使用工具栏加粗或添加列表...`}
          onChange={(e) => updateSection({ content: e.target.value })}
        />
      </div>
      <div className={ui["section-heading"]}>
        <span className={ui["subtle"]}>
          经历条目（可选，共 {items.length} 项）
        </span>
        <button
          type="button"
          className={ui["outline-green"]}
          disabled={items.length >= 100}
          onClick={() => {
            if (items.length >= 100) return;
            updateSection({
              items: [
                ...items,
                {
                  id: crypto.randomUUID(),
                  name: "",
                  role: "",
                  startDate: "",
                  endDate: "",
                  link: "",
                  description: "",
                },
              ],
            });
          }}
        >
          <Plus size={15} />
          添加条目
        </button>
      </div>
      {items.map((item, index) => (
        <details key={item.id} className={ui["entry-card"]} open>
          <summary>{item.name || `${section.title}条目 ${index + 1}`}</summary>
          <div className={ui["entry-body"]}>
            <div className={ui["form-grid"]}>
              <div className={ui["field"]}>
                <label htmlFor={`${id}-${item.id}-name`}>标题 / 名称</label>
                <ClearableInput
                  id={`${id}-${item.id}-name`}
                  value={item.name}
                  clearLabel="清空标题"
                  onClear={() => updateItem(item.id, "name", "")}
                  onChange={(e) => updateItem(item.id, "name", e.target.value)}
                />
              </div>
              <div className={ui["field"]}>
                <label htmlFor={`${id}-${item.id}-role`}>副标题 / 角色</label>
                <ClearableInput
                  id={`${id}-${item.id}-role`}
                  value={item.role}
                  clearLabel="清空角色"
                  onClear={() => updateItem(item.id, "role", "")}
                  onChange={(e) => updateItem(item.id, "role", e.target.value)}
                />
              </div>
              <div className={ui["field"]}>
                <label htmlFor={`${id}-${item.id}-start`}>开始时间</label>
                <ClearableInput
                  id={`${id}-${item.id}-start`}
                  type="month"
                  value={item.startDate}
                  clearLabel="清空开始时间"
                  onClear={() => updateItem(item.id, "startDate", "")}
                  onChange={(e) =>
                    updateItem(item.id, "startDate", e.target.value)
                  }
                />
              </div>
              <div className={ui["field"]}>
                <label htmlFor={`${id}-${item.id}-end`}>结束时间</label>
                <ClearableInput
                  id={`${id}-${item.id}-end`}
                  type={item.endDate === "至今" ? "text" : "month"}
                  disabled={item.endDate === "至今"}
                  value={item.endDate}
                  clearLabel="清空结束时间"
                  onClear={() => updateItem(item.id, "endDate", "")}
                  onChange={(e) =>
                    updateItem(item.id, "endDate", e.target.value)
                  }
                />
              </div>
              <div className={`${ui["field"]} wide`}>
                <label htmlFor={`${id}-${item.id}-desc`}>条目描述</label>
                <ClearableTextarea
                  id={`${id}-${item.id}-desc`}
                  rows={4}
                  value={item.description}
                  clearLabel="清空条目描述"
                  onClear={() => updateItem(item.id, "description", "")}
                  onChange={(e) =>
                    updateItem(item.id, "description", e.target.value)
                  }
                />
              </div>
            </div>
            <label className={ui["check-field"]}>
              <input
                type="checkbox"
                checked={item.endDate === "至今"}
                onChange={(e) =>
                  updateItem(item.id, "endDate", e.target.checked ? "至今" : "")
                }
              />
              至今进行中
            </label>
            <button
              type="button"
              className={`${ui["text-button"]} ${ui["danger"]}`}
              onClick={() =>
                updateSection({
                  items: items.filter((i) => i.id !== item.id),
                })
              }
            >
              <Trash2 size={14} />
              删除此条目
            </button>
          </div>
        </details>
      ))}
      <div className="mt-6 border-t border-[#e5f4ea] pt-4">
        <button
          type="button"
          className={`${ui["text-button"]} ${ui["danger"]}`}
          onClick={onDelete}
        >
          <Trash2 size={14} />
          删除「{section.title}」模块
        </button>
      </div>
    </div>
  );
}
export type EditorSection = "basic" | SectionKey;
export const sectionIcons: Record<"basic" | BuiltinSectionKey, typeof UserRound> = {
  basic: UserRound,
  workExperiences: BriefcaseBusiness,
  educations: GraduationCap,
  projects: Folders,
  openSource: CodeXml,
  skills: Star,
  summary: UserRound,
};
const hints: Record<"basic" | BuiltinSectionKey, string> = {
  basic: "姓名、电话、邮箱、地址、求职意向等",
  workExperiences: "工作经历、职责与成就",
  projects: "项目经验、角色与成果",
  openSource: "开源项目、个人作品与技术贡献",
  educations: "学历、学校、专业等",
  skills: "专业技能、工具、语言等",
  summary: "个人优势、职业倾向等",
};
export const sectionForms: Record<
  "basic" | BuiltinSectionKey,
  React.ComponentType<{ data: ResumeData; onChange: (data: ResumeData) => void }>
> = {
  basic: BasicInfoForm,
  workExperiences: WorkExperienceForm,
  educations: EducationForm,
  projects: ProjectForm,
  openSource: OpenSourceForm,
  skills: SkillsForm,
  summary: SummaryForm,
};
const QUICK_CUSTOM_MODULES = [
  "获奖荣誉",
  "资格证书",
  "语言能力",
  "校园经历",
  "发表论文",
  "科研经历",
];
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
  const [customTitleInput, setCustomTitleInput] = useState("");
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
  function addCustomSection(rawTitle: string) {
    const title = rawTitle.trim() || "自定义模块";
    const existing = data.customSections ?? [];
    if (existing.length >= 50) return;
    const id: CustomSectionKey = `custom:${crypto.randomUUID()}`;
    const newSection: CustomSection = {
      id,
      title: title.slice(0, 50),
      content: "",
      items: [],
    };
    onChange({
      ...data,
      customSections: [...existing, newSection],
      sectionOrder: [...data.sectionOrder, id],
    });
    setCustomTitleInput("");
    setAdding(false);
    setActive(id);
  }
  function removeCustomSection(id: CustomSectionKey) {
    const nextTitles = { ...data.sectionTitles };
    delete nextTitles[id];
    onChange({
      ...data,
      customSections: (data.customSections ?? []).filter((s) => s.id !== id),
      sectionOrder: data.sectionOrder.filter((k) => k !== id),
      hiddenSections: (data.hiddenSections ?? []).filter((k) => k !== id),
      sectionTitles: nextTitles,
    });
    if (active === id) setActive(null);
  }
  function updateSectionTitle(key: SectionKey, nextTitle: string) {
    if (isCustomSectionKey(key)) {
      onChange({
        ...data,
        customSections: (data.customSections ?? []).map((s) =>
          s.id === key ? { ...s, title: nextTitle } : s,
        ),
      });
    } else {
      onChange({
        ...data,
        sectionTitles: {
          ...data.sectionTitles,
          [key]: nextTitle,
        },
      });
    }
  }
  const hidden = data.hiddenSections ?? [];
  const isCustomActive = active !== null && isCustomSectionKey(active);
  const BuiltinForm =
    active && !isCustomActive
      ? sectionForms[active as "basic" | BuiltinSectionKey]
      : null;
  return (
    <div className={ui["editor-panel"]}>
      <div className={ui["panel-heading"]}>
        <h1>编辑简历</h1>
        <p>拖拽模块排序，点击模块进行编辑，右侧实时更新</p>
      </div>
      <div className={`${ui["panel-scroll"]} pt-[18px] max-[900px]:pb-6`}>
        {active && (BuiltinForm || isCustomActive) ? (
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
                  <Input
                    type="text"
                    aria-label="模块名称"
                    autoFocus
                    maxLength={50}
                    value={
                      isCustomSectionKey(active)
                        ? ((data.customSections ?? []).find(
                            (s) => s.id === active,
                          )?.title ?? "")
                        : (data.sectionTitles?.[active] ??
                          SECTION_LABELS[active])
                    }
                    placeholder={
                      isCustomSectionKey(active)
                        ? "自定义模块"
                        : SECTION_LABELS[active]
                    }
                    onChange={(e) => updateSectionTitle(active, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === "Escape") {
                        e.currentTarget.blur();
                      }
                    }}
                    onBlur={(e) => {
                      if (!e.target.value.trim()) {
                        if (isCustomSectionKey(active)) {
                          updateSectionTitle(active, "自定义模块");
                        } else {
                          const nextTitles = { ...data.sectionTitles };
                          delete nextTitles[active];
                          onChange({ ...data, sectionTitles: nextTitles });
                        }
                      }
                      setEditingTitle(false);
                    }}
                    wrapperClassName="w-52 -ml-2.5"
                    className="h-9 rounded-[7px] border-[#19af60] bg-white px-2.5 py-1 text-[18px] font-[650] text-ink"
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
            {isCustomActive ? (
              <CustomSectionForm
                data={data}
                sectionKey={active as CustomSectionKey}
                onChange={onChange}
                onDelete={() => removeCustomSection(active as CustomSectionKey)}
              />
            ) : (
              BuiltinForm && <BuiltinForm data={data} onChange={onChange} />
            )}
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
                <p className="font-medium text-ink">点击直接添加常用模块</p>
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_CUSTOM_MODULES.map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      className="inline-flex items-center justify-center gap-1 rounded-[7px] border border-[#d8efe1] bg-[#f4fbf6] px-2.5 py-2 text-[12px] font-medium text-[#1a6b35] transition-colors hover:border-[#65d995] hover:bg-[#dff8e7]"
                      onClick={() => addCustomSection(preset)}
                    >
                      <Plus size={13} />
                      {preset}
                    </button>
                  ))}
                </div>
                {hidden.length > 0 && (
                  <div className="mt-3 border-t border-[#e5f4ea] pt-2.5">
                    <p className="font-medium text-ink">
                      恢复已隐藏的模块（原有内容会保留）
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {hidden.map((key) => (
                        <button
                          type="button"
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
                  </div>
                )}
                <div className="mt-3 border-t border-[#e5f4ea] pt-2.5">
                  <p className="font-medium text-ink">或自定义其他模块名称</p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      maxLength={50}
                      value={customTitleInput}
                      placeholder="请输入自定义模块标题..."
                      onChange={(e) => setCustomTitleInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomSection(customTitleInput);
                        }
                      }}
                      wrapperClassName="min-w-0 flex-1"
                      className="h-9 rounded-[7px] border-[#d2ebda] bg-white px-2.5 py-2 text-[13px] text-[#1a4026] placeholder:text-[#93b39e] focus:border-[#19af60]"
                    />
                    <button
                      type="button"
                      className="inline-flex shrink-0 items-center justify-center rounded-[7px] bg-brand px-3 py-2 text-[12px] font-medium text-white transition-colors hover:bg-brand-dark"
                      onClick={() => addCustomSection(customTitleInput)}
                    >
                      创建模块
                    </button>
                  </div>
                </div>
              </div>
            )}
            {(
              [
                "basic",
                ...data.sectionOrder.filter((key) => !hidden.includes(key)),
              ] as EditorSection[]
            ).map((key, index) => {
              const isCustom = key !== "basic" && isCustomSectionKey(key);
              const Icon = isCustom
                ? LayoutList
                : sectionIcons[key as "basic" | BuiltinSectionKey];
              const label =
                key === "basic" ? "个人信息" : getSectionLabel(data, key);
              const hint = isCustom
                ? "自定义模块内容与经历条目"
                : hints[key as "basic" | BuiltinSectionKey];
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
                      <small>{hint}</small>
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
                        {isCustom && (
                          <button
                            className={ui["danger"]}
                            onClick={() =>
                              removeCustomSection(key as CustomSectionKey)
                            }
                          >
                            <Trash2 size={14} />
                            删除模块
                          </button>
                        )}
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
