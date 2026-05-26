"use client";

import { ResumeData, Education } from "@/lib/resume-data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ChevronDown, ChevronUp, GraduationCap } from "lucide-react";
import { useState } from "react";
import { nanoid } from "@/lib/utils";

interface EducationFormProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

const inputCls =
  "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-blue-500/50 transition-colors text-sm h-11 md:h-9 rounded-lg touch-manipulation";
const textareaCls =
  "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-blue-500/50 transition-colors text-sm rounded-lg resize-none";

const DEGREES = ["专科", "本科", "硕士", "博士", "其他"];

export function EducationForm({ data, onChange }: EducationFormProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    data.educations[0]?.id ?? null
  );

  const updateItem = (id: string, key: keyof Education, value: string) => {
    onChange({
      ...data,
      educations: data.educations.map((item) =>
        item.id === id ? { ...item, [key]: value } : item
      ),
    });
  };

  const addItem = () => {
    const newItem: Education = {
      id: nanoid(),
      school: "",
      major: "",
      degree: "本科",
      startDate: "",
      endDate: "",
      gpa: "",
      description: "",
    };
    onChange({ ...data, educations: [...data.educations, newItem] });
    setExpandedId(newItem.id);
  };

  const removeItem = (id: string) => {
    onChange({ ...data, educations: data.educations.filter((item) => item.id !== id) });
  };

  return (
    <div className="px-4 pb-6 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-white/40 text-xs">共 {data.educations.length} 段教育经历</p>
        <Button
          onClick={addItem}
          size="sm"
          className="h-9 md:h-7 text-xs bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-600/30 hover:border-emerald-500/50 rounded-lg gap-1.5 transition-all touch-manipulation"
        >
          <Plus className="w-3 h-3" />
          添加教育
        </Button>
      </div>

      {data.educations.map((item) => (
        <div
          key={item.id}
          className="border border-white/10 rounded-xl overflow-hidden bg-white/3 hover:border-white/15 transition-colors"
        >
          <div
            className="flex items-center justify-between px-3 py-3 md:py-2.5 cursor-pointer hover:bg-white/5 transition-colors touch-manipulation"
            onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-3 h-3 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-medium truncate">
                  {item.school || "未填写学校"}
                </p>
                <p className="text-white/40 text-[10px] truncate">
                  {item.major || "专业"} · {item.degree}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                className="w-6 h-6 rounded-md flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              {expandedId === item.id ? (
                <ChevronUp className="w-3.5 h-3.5 text-white/30" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-white/30" />
              )}
            </div>
          </div>

          {expandedId === item.id && (
            <div className="px-3 pb-3 space-y-2.5 border-t border-white/5 pt-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-white/50 text-[10px]">学校名称</Label>
                  <Input
                    className={inputCls}
                    placeholder="某某大学"
                    value={item.school}
                    onChange={(e) => updateItem(item.id, "school", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/50 text-[10px]">专业</Label>
                  <Input
                    className={inputCls}
                    placeholder="计算机科学"
                    value={item.major}
                    onChange={(e) => updateItem(item.id, "major", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-white/50 text-[10px]">学历</Label>
                  <select
                    className="w-full h-9 rounded-lg bg-white/5 border border-white/10 text-white text-sm px-2 focus:border-blue-500/50 outline-none transition-colors"
                    value={item.degree}
                    onChange={(e) => updateItem(item.id, "degree", e.target.value)}
                  >
                    {DEGREES.map((d) => (
                      <option key={d} value={d} className="bg-[#1a1a2e]">
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-white/50 text-[10px]">入学时间</Label>
                  <Input
                    className={inputCls}
                    placeholder="2015-09"
                    value={item.startDate}
                    onChange={(e) => updateItem(item.id, "startDate", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/50 text-[10px]">毕业时间</Label>
                  <Input
                    className={inputCls}
                    placeholder="2019-06"
                    value={item.endDate}
                    onChange={(e) => updateItem(item.id, "endDate", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-white/50 text-[10px]">GPA / 成绩</Label>
                <Input
                  className={inputCls}
                  placeholder="3.8/4.0"
                  value={item.gpa}
                  onChange={(e) => updateItem(item.id, "gpa", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-white/50 text-[10px]">描述（荣誉、活动等）</Label>
                <Textarea
                  className={textareaCls}
                  placeholder="• 主修数据结构、算法等课程&#10;• 获国家奖学金"
                  value={item.description}
                  onChange={(e) => updateItem(item.id, "description", e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
        </div>
      ))}

      {data.educations.length === 0 && (
        <div className="text-center py-10 text-white/25 text-sm">
          <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-30" />
          点击"添加教育"开始填写
        </div>
      )}
    </div>
  );
}
