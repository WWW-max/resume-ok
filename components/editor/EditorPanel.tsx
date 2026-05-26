"use client";

import { ResumeData } from "@/lib/resume-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BasicInfoForm } from "./BasicInfoForm";
import { WorkExperienceForm } from "./WorkExperienceForm";
import { EducationForm } from "./EducationForm";
import { ProjectForm } from "./ProjectForm";
import { SkillsForm } from "./SkillsForm";
import { SummaryForm } from "./SummaryForm";
import {
  User,
  Briefcase,
  GraduationCap,
  FolderOpen,
  Zap,
  FileText,
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
];

export function EditorPanel({ data, onChange }: EditorPanelProps) {
  return (
    <Tabs defaultValue="basic" className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="flex-shrink-0 px-3 pt-3 pb-0">
        <TabsList className="w-full grid grid-cols-6 bg-white/5 border border-white/10 rounded-xl p-1 h-auto gap-0.5">
          {tabs.map(({ id, label, icon: Icon }) => (
            <TabsTrigger
              key={id}
              value={id}
              className="flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg text-white/40
                         data-[state=active]:text-white data-[state=active]:bg-white/10
                         transition-all duration-200 hover:text-white/70
                         text-[10px] sm:text-[11px] font-medium
                         min-h-[48px] touch-manipulation"
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="leading-none">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* Tab Content — scrollable */}
      <div className="flex-1 overflow-y-auto overscroll-contain min-h-0 mt-3
                      scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <TabsContent value="basic" className="m-0">
          <BasicInfoForm data={data} onChange={onChange} />
        </TabsContent>
        <TabsContent value="work" className="m-0">
          <WorkExperienceForm data={data} onChange={onChange} />
        </TabsContent>
        <TabsContent value="education" className="m-0">
          <EducationForm data={data} onChange={onChange} />
        </TabsContent>
        <TabsContent value="project" className="m-0">
          <ProjectForm data={data} onChange={onChange} />
        </TabsContent>
        <TabsContent value="skills" className="m-0">
          <SkillsForm data={data} onChange={onChange} />
        </TabsContent>
        <TabsContent value="summary" className="m-0">
          <SummaryForm data={data} onChange={onChange} />
        </TabsContent>
      </div>
    </Tabs>
  );
}
