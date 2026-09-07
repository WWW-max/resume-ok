"use client";
import { useRef, useState } from "react";
import { ResumeData, SectionKey, SECTION_LABELS } from "@/lib/resume-data";
import { BasicInfoForm } from "./BasicInfoForm";
import { WorkExperienceForm } from "./WorkExperienceForm";
import { EducationForm } from "./EducationForm";
import { ProjectForm } from "./ProjectForm";
import { SkillsForm } from "./SkillsForm";
import { SummaryForm } from "./SummaryForm";
import { UserRound, BriefcaseBusiness, GraduationCap, Folders, Star, GripVertical, ChevronLeft, ChevronRight, Lightbulb, Plus, MoreVertical, ArrowUp, ArrowDown, EyeOff } from "lucide-react";
export type EditorSection = "basic" | SectionKey;
export const sectionIcons = { basic: UserRound, workExperiences: BriefcaseBusiness, educations: GraduationCap, projects: Folders, skills: Star, summary: UserRound };
const hints = { basic: "姓名、电话、邮箱、地址、求职意向等", workExperiences: "工作经历、职责与成就", projects: "项目经验、角色与成果", educations: "学历、学校、专业等", skills: "专业技能、工具、语言等", summary: "个人优势、职业倾向等" };
export const sectionForms = { basic: BasicInfoForm, workExperiences: WorkExperienceForm, educations: EducationForm, projects: ProjectForm, skills: SkillsForm, summary: SummaryForm };
export function EditorPanel({ data, onChange, onAssistant }: { data: ResumeData; onChange: (data: ResumeData) => void; onAssistant: () => void }) {
  const [active, setActive] = useState<EditorSection | null>(null);
  const dragKey = useRef<SectionKey | null>(null);
  const [adding, setAdding] = useState(false);
  function move(key: SectionKey, target: number) {
    const order = [...data.sectionOrder]; const from = order.indexOf(key);
    if (target < 0 || target >= order.length || from === target) return;
    order.splice(from, 1); order.splice(target, 0, key); onChange({...data,sectionOrder:order});
  }
  const hidden = data.hiddenSections ?? [];
  const Form = active ? sectionForms[active] : null;
  return <div className="editor-panel">
    <div className="panel-heading"><h1>编辑简历</h1><p>拖拽模块排序，点击模块进行编辑，右侧实时更新</p></div>
    <div className="panel-scroll">{active && Form ? <>
      <button className="back-button" onClick={() => setActive(null)}><ChevronLeft size={16} />返回简历模块</button>
      <h2 className="form-heading">{active === "basic" ? "个人信息" : SECTION_LABELS[active]}</h2>
      <Form data={data} onChange={onChange} />
    </> : <div className="module-list"><div className="section-heading"><h2>简历模块</h2><button className="outline-green" onClick={() => setAdding(!adding)} aria-expanded={adding}><Plus size={15} />添加模块</button></div>
      {adding && <div className="restore-modules"><p>{hidden.length ? "选择要恢复的模块，原有内容会保留。" : "所有模块均已添加。进入模块可添加多条经历。"}</p>{hidden.map(key => <button className="soft-button" key={key} onClick={() => {onChange({...data,hiddenSections:hidden.filter(k => k !== key)});setAdding(false);}}><Plus size={14} />{SECTION_LABELS[key]}</button>)}</div>}
      {(["basic", ...data.sectionOrder.filter(key => !hidden.includes(key))] as EditorSection[]).map((key, index) => {
        const Icon = sectionIcons[key];
        return <div key={key} draggable={key !== "basic"} onDragStart={e => { if(key !== "basic") {dragKey.current=key;e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",key);} }} onDragOver={e => {if(key !== "basic")e.preventDefault();}} onDrop={e => {e.preventDefault();if(dragKey.current && key !== "basic") move(dragKey.current,data.sectionOrder.indexOf(key));dragKey.current=null;}} onDragEnd={() => {dragKey.current=null;}} className={`module-card ${index === 0 ? "selected" : ""}`} ><button className="module-main" onClick={() => setActive(key)}><GripVertical size={16} className="grip" /><Icon size={20} /><span><strong>{key === "basic" ? "个人信息" : SECTION_LABELS[key]}</strong><small>{hints[key]}</small></span></button>{key === "basic" ? <ChevronRight size={17} className="grip" /> : <details className="module-menu"><summary aria-label={`${SECTION_LABELS[key]}操作`}><MoreVertical size={18} /></summary><div><button disabled={data.sectionOrder.indexOf(key) === 0} onClick={() => move(key,data.sectionOrder.indexOf(key)-1)}><ArrowUp size={14} />上移</button><button disabled={data.sectionOrder.indexOf(key) === data.sectionOrder.length-1} onClick={() => move(key,data.sectionOrder.indexOf(key)+1)}><ArrowDown size={14} />下移</button><button onClick={() => onChange({...data,hiddenSections:[...hidden,key]})}><EyeOff size={14} />隐藏模块</button></div></details>}</div>;
      })}</div>}</div>
    <div className="assistant-banner"><Lightbulb size={23} /><div><strong>简历助手 · LuckyMe</strong><p>完善简历内容，让优势更出众</p></div><button onClick={onAssistant}>立即使用 →</button></div>
  </div>;
}
