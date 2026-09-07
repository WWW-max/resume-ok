"use client";
import { ResumeData } from "@/lib/resume-data";
import { defaultAppearance } from "@/lib/resume-appearance";
import { Check } from "lucide-react";
export function TemplatePanel({ data,onChange }: {data:ResumeData;onChange:(data:ResumeData)=>void}) {
  const appearance = {...defaultAppearance,...data.appearance};
  return <div className="editor-panel"><div className="panel-heading"><h1>模板库</h1><p>切换风格，不改变你已填写的内容。</p></div><div className="panel-scroll template-list">{[
    {id:"classic",name:"清新专业",subtitle:"设计稿同款 · 轻盈、清晰",tag:"推荐"},
    {id:"minimal",name:"极简留白",subtitle:"单栏排版 · 专注内容",tag:"经典"},
    {id:"modern",name:"现代商务",subtitle:"品牌色页眉 · 鲜明层次",tag:"商务"},
  ].map(t=><button className={`template-card ${appearance.template===t.id ? "active" : ""}`} key={t.id} onClick={()=>onChange({...data,appearance:{...appearance,template:t.id as typeof appearance.template}})} aria-pressed={appearance.template===t.id}><div className={`template-mini mini-${t.id}`} aria-hidden="true"><div className="mini-head"><span/><i/><i/></div>{[0,1,2].map(i=><div className="mini-section" key={i}><b/><i/><i/><i/></div>)}</div><div className="template-caption"><strong>{t.name}<small>{t.tag}</small></strong><p>{t.subtitle}</p></div>{appearance.template===t.id && <Check size={18}/>}</button>)}</div></div>;
}
