"use client";
import { useState } from "react";
import { ResumeData, SectionKey, SECTION_LABELS } from "@/lib/resume-data";
import { BasicInfoForm } from "./BasicInfoForm";
import { WorkExperienceForm } from "./WorkExperienceForm";
import { EducationForm } from "./EducationForm";
import { ProjectForm } from "./ProjectForm";
import { SkillsForm } from "./SkillsForm";
import { SummaryForm } from "./SummaryForm";
import { UserRound, BriefcaseBusiness, GraduationCap, Folders, Star, GripVertical, ChevronLeft, ChevronRight, Lightbulb } from "lucide-react";
export type EditorSection = "basic" | SectionKey;
export const sectionIcons = { basic: UserRound, workExperiences: BriefcaseBusiness, educations: GraduationCap, projects: Folders, skills: Star, summary: UserRound };
const hints = { basic: "姓名、电话、邮箱、地址、求职意向等", workExperiences: "工作经历、职责与成就", projects: "项目经验、角色与成果", educations: "学历、学校、专业等", skills: "专业技能、工具、语言等", summary: "个人优势、职业倾向等" };
export const sectionForms = { basic: BasicInfoForm, workExperiences: WorkExperienceForm, educations: EducationForm, projects: ProjectForm, skills: SkillsForm, summary: SummaryForm };
export function EditorPanel({ data, onChange, onAssistant }: { data: ResumeData; onChange: (data: ResumeData) => void; onAssistant: () => void }) {
  const [active, setActive] = useState<EditorSection | null>(null);
  const Form = active ? sectionForms[active] : null;
  return <div className="editor-panel">
    <div className="panel-heading"><h1>编辑简历</h1><p>点击模块进行编辑，右侧预览会实时更新</p></div>
    <div className="panel-scroll">{active && Form ? <>
      <button className="back-button" onClick={() => setActive(null)}><ChevronLeft size={16} />返回简历模块</button>
      <h2 className="form-heading">{active === "basic" ? "个人信息" : SECTION_LABELS[active]}</h2>
      <Form data={data} onChange={onChange} />
    </> : <div className="module-list"><div className="section-heading"><h2>简历模块</h2><span className="subtle">共 6 个模块</span></div>
      {(["basic", ...data.sectionOrder] as EditorSection[]).map((key, index) => {
        const Icon = sectionIcons[key];
        return <button key={key} className={`module-card ${index === 0 ? "selected" : ""}`} onClick={() => setActive(key)}><GripVertical size={16} className="grip" /><Icon size={20} /><span><strong>{key === "basic" ? "个人信息" : SECTION_LABELS[key]}</strong><small>{hints[key]}</small></span><ChevronRight size={17} className="grip" /></button>;
      })}</div>}</div>
    <div className="assistant-banner"><Lightbulb size={23} /><div><strong>简历助手 · LuckyMe</strong><p>完善简历内容，让优势更出众</p></div><button onClick={onAssistant}>立即使用 →</button></div>
  </div>;
}
