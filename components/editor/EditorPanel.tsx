"use client";

import { ResumeData } from "@/lib/resume-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BasicInfoForm } from "./BasicInfoForm";
import { WorkExperienceForm } from "./WorkExperienceForm";
import { EducationForm } from "./EducationForm";
import { ProjectForm } from "./ProjectForm";
import { SkillsForm } from "./SkillsForm";
import { SummaryForm } from "./SummaryForm";
import { SectionOrderForm } from "./SectionOrderForm";
import {
  User,
  Briefcase,
  GraduationCap,
  FolderOpen,
  Zap,
  FileText,
  LayoutList,
} from "lucide-react";

interface EditorPanelProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

const tabs = [
  { id: "basic",     label: "基本", icon: User },
  { id: "work",      label: "工作", icon: Briefcase },
  { id: "education", label: "教育", icon: GraduationCap },
  { id: "project",   label: "项目", icon: FolderOpen },
  { id: "skills",    label: "技能", icon: Zap },
  { id: "summary",   label: "评价", icon: FileText },
  { id: "order",     label: "排序", icon: LayoutList },
];

export function EditorPanel({ data, onChange }: EditorPanelProps) {
  return (
    <Tabs defaultValue="basic" className="flex flex-col h-full gap-0">
      {/* Tab Navigation */}
      <div className="flex-shrink-0 px-3 pt-3">
        <TabsList
          className="w-full grid grid-cols-7 h-auto p-1 gap-0.5 rounded-xl"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          {tabs.map(({ id, label, icon: Icon }) => (
            <TabsTrigger
              key={id}
              value={id}
              className="group relative flex flex-col items-center justify-center gap-0.5
                         py-2.5 px-1 min-h-[52px] rounded-lg touch-manipulation
                         text-[10px] sm:text-[11px] font-medium
                         transition-all duration-200 whitespace-nowrap
                         text-white/30 hover:text-white/60
                         data-[state=active]:text-white/90
                         data-[state=active]:bg-transparent
                         data-[state=active]:shadow-none
                         focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/50
                         [&>svg]:size-4"
            >
              {/* Active glow overlay — not part of Radix, purely visual */}
              <span
                aria-hidden
                className="absolute inset-0 rounded-lg opacity-0 transition-opacity duration-200
                           group-data-[state=active]:opacity-100 pointer-events-none"
                style={{
                  background: "linear-gradient(135deg, rgba(59,130,246,0.18), rgba(139,92,246,0.18))",
                  border: "1px solid rgba(99,163,246,0.22)",
                  boxShadow: "0 2px 10px rgba(59,130,246,0.12)",
                }}
              />

              <Icon
                className="relative flex-shrink-0 transition-colors duration-200
                           text-white/30 group-hover:text-white/60
                           group-data-[state=active]:text-blue-400"
              />

              <span className="relative leading-none">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* Tab Content — scrollable */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain min-h-0 mt-3
                   scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
      >
        <TabsContent value="basic" className="m-0 mt-0">
          <BasicInfoForm data={data} onChange={onChange} />
        </TabsContent>
        <TabsContent value="work" className="m-0 mt-0">
          <WorkExperienceForm data={data} onChange={onChange} />
        </TabsContent>
        <TabsContent value="education" className="m-0 mt-0">
          <EducationForm data={data} onChange={onChange} />
        </TabsContent>
        <TabsContent value="project" className="m-0 mt-0">
          <ProjectForm data={data} onChange={onChange} />
        </TabsContent>
        <TabsContent value="skills" className="m-0 mt-0">
          <SkillsForm data={data} onChange={onChange} />
        </TabsContent>
        <TabsContent value="summary" className="m-0 mt-0">
          <SummaryForm data={data} onChange={onChange} />
        </TabsContent>
        <TabsContent value="order" className="m-0 mt-0">
          <SectionOrderForm data={data} onChange={onChange} />
        </TabsContent>
      </div>
    </Tabs>
  );
}
