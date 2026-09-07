"use client";
import { useId } from "react";
import { ResumeData, WorkExperience, Education, Project, Skill } from "@/lib/resume-data";
import { Plus, Trash2 } from "lucide-react";
type ListKey = "workExperiences" | "educations" | "projects" | "skills";
type Item = WorkExperience | Education | Project | Skill;
type Field = { key: string; label: string; type?: string; wide?: boolean };
const configs: Record<ListKey, { label: string; titleKey: string; empty: Item; fields: Field[] }> = {
  workExperiences: { label: "工作经历", titleKey: "company", empty: {id:"",company:"",position:"",startDate:"",endDate:"",current:false,description:""}, fields:[{key:"company",label:"公司名称"},{key:"position",label:"职位"},{key:"startDate",label:"开始时间",type:"month"},{key:"endDate",label:"结束时间",type:"month"},{key:"description",label:"工作描述",type:"textarea",wide:true}] },
  educations: { label: "教育经历", titleKey: "school", empty: {id:"",school:"",major:"",degree:"本科",startDate:"",endDate:"",gpa:"",description:""}, fields:[{key:"school",label:"学校名称"},{key:"major",label:"专业"},{key:"degree",label:"学历",type:"degree"},{key:"gpa",label:"GPA / 成绩"},{key:"startDate",label:"入学时间",type:"month"},{key:"endDate",label:"毕业时间",type:"month"},{key:"description",label:"荣誉与活动",type:"textarea",wide:true}] },
  projects: {label:"项目经历",titleKey:"name",empty:{id:"",name:"",role:"",startDate:"",endDate:"",link:"",description:""},fields:[{key:"name",label:"项目名称"},{key:"role",label:"担任角色"},{key:"startDate",label:"开始时间",type:"month"},{key:"endDate",label:"结束时间",type:"month"},{key:"link",label:"项目链接",wide:true},{key:"description",label:"项目描述",type:"textarea",wide:true}]},
  skills:{label:"技能",titleKey:"category",empty:{id:"",category:"",items:""},fields:[{key:"category",label:"技能分类",wide:true},{key:"items",label:"技能内容（用 / 分隔）",wide:true}]},
};
export function ExperienceForm({ data, onChange, section }: { data: ResumeData; onChange: (data: ResumeData) => void; section: ListKey }) {
  const id = useId(); const config = configs[section]; const items: Item[] = data[section];
  function update(itemId: string, key: string, value: string | boolean) { onChange({...data,[section]:items.map(item => item.id === itemId ? {...item,[key]:value} : item)}); }
  return <div className="resume-form"><div className="section-heading"><span className="subtle">共 {items.length} 项</span><button className="outline-green" onClick={() => onChange({...data,[section]:[...items,{...config.empty,id:crypto.randomUUID()}]})}><Plus size={15} />添加{config.label}</button></div>
    {!items.length && <div className="empty-state">还没有{config.label}<p>点击上方按钮开始填写。</p></div>}
    {items.map((item, index) => {
      const values = item as unknown as Record<string, string | boolean>;
      const invalidDates = !!values.startDate && !!values.endDate && !values.current && values.endDate < values.startDate;
      return <details key={item.id} className="entry-card" open><summary>{String(values[config.titleKey] || `${config.label} ${index + 1}`)}</summary><div className="entry-body"><div className="form-grid">{config.fields.map(field => {
        const fieldId = `${id}-${item.id}-${field.key}`; const disabled = field.key === "endDate" && values.current === true;
        return <div key={field.key} className={`field ${field.wide ? "wide" : ""}`}><label htmlFor={fieldId}>{field.label}</label>{field.type === "textarea" ? <textarea id={fieldId} rows={5} value={String(values[field.key])} placeholder="写清职责、行动和结果；每行一条更易阅读" onChange={e => update(item.id,field.key,e.target.value)} /> : field.type === "degree" ? <select id={fieldId} value={String(values[field.key])} onChange={e => update(item.id,field.key,e.target.value)}>{["高中","大专","本科","硕士","博士","其他"].map(d => <option key={d}>{d}</option>)}</select> : <input id={fieldId} type={field.type || "text"} disabled={disabled} value={String(values[field.key])} aria-invalid={field.key === "endDate" && invalidDates} aria-describedby={field.key === "endDate" && invalidDates ? `${id}-${item.id}-date-error` : undefined} onChange={e => update(item.id,field.key,e.target.value)} />}</div>;
      })}</div>{section === "workExperiences" && <label className="check-field"><input type="checkbox" checked={values.current === true} onChange={e => update(item.id,"current",e.target.checked)} />至今在职</label>}{invalidDates && <p className="field-error" id={`${id}-${item.id}-date-error`}>结束时间不能早于开始时间。</p>}<button className="text-button danger" onClick={() => onChange({...data,[section]:items.filter(i => i.id !== item.id)})}><Trash2 size={14} />删除此{config.label}</button></div></details>;
    })}
  </div>;
}
