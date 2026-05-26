"use client";

import { ResumeData, WorkExperience } from "@/lib/resume-data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ChevronDown, ChevronUp, Building2 } from "lucide-react";
import { useState } from "react";
import { nanoid } from "@/lib/utils";

interface WorkExperienceFormProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

const inputCls =
  "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-blue-500/50 transition-colors text-sm h-11 md:h-9 rounded-lg touch-manipulation";
const textareaCls =
  "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-blue-500/50 transition-colors text-sm rounded-lg resize-none";

export function WorkExperienceForm({ data, onChange }: WorkExperienceFormProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    data.workExperiences[0]?.id ?? null
  );

  const updateItem = (id: string, key: keyof WorkExperience, value: string | boolean) => {
    onChange({
      ...data,
      workExperiences: data.workExperiences.map((item) =>
        item.id === id ? { ...item, [key]: value } : item
      ),
    });
  };

  const addItem = () => {
    const newItem: WorkExperience = {
      id: nanoid(),
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
    };
    onChange({ ...data, workExperiences: [...data.workExperiences, newItem] });
    setExpandedId(newItem.id);
  };

  const removeItem = (id: string) => {
    onChange({
      ...data,
      workExperiences: data.workExperiences.filter((item) => item.id !== id),
    });
  };

  return (
    <div className="px-4 pb-6 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-white/40 text-xs">共 {data.workExperiences.length} 段工作经历</p>
        <Button
          onClick={addItem}
          size="sm"
          className="h-9 md:h-7 text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/30 hover:border-blue-500/50 rounded-lg gap-1.5 transition-all touch-manipulation"
        >
          <Plus className="w-3 h-3" />
          添加经历
        </Button>
      </div>

      {data.workExperiences.map((item) => (
        <div
          key={item.id}
          className="border border-white/10 rounded-xl overflow-hidden bg-white/3 hover:border-white/15 transition-colors"
        >
          {/* Item Header */}
          <div
            className="flex items-center justify-between px-3 py-3 md:py-2.5 cursor-pointer hover:bg-white/5 transition-colors touch-manipulation"
            onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-md bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-3 h-3 text-blue-400" />
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-medium truncate">
                  {item.company || "未填写公司"}
                </p>
                <p className="text-white/40 text-[10px] truncate">
                  {item.position || "职位"}{" "}
                  {item.startDate && `· ${item.startDate} — ${item.current ? "至今" : item.endDate || "?"}`}
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

          {/* Item Form */}
          {expandedId === item.id && (
            <div className="px-3 pb-3 space-y-2.5 border-t border-white/5 pt-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-white/50 text-[10px]">公司名称</Label>
                  <Input
                    className={inputCls}
                    placeholder="某科技公司"
                    value={item.company}
                    onChange={(e) => updateItem(item.id, "company", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/50 text-[10px]">职位</Label>
                  <Input
                    className={inputCls}
                    placeholder="前端工程师"
                    value={item.position}
                    onChange={(e) => updateItem(item.id, "position", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-white/50 text-[10px]">开始时间</Label>
                  <Input
                    className={inputCls}
                    placeholder="2022-03"
                    value={item.startDate}
                    onChange={(e) => updateItem(item.id, "startDate", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/50 text-[10px]">结束时间</Label>
                  <Input
                    className={inputCls}
                    placeholder="至今"
                    value={item.current ? "至今" : item.endDate}
                    disabled={item.current}
                    onChange={(e) => updateItem(item.id, "endDate", e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`current-${item.id}`}
                  checked={item.current}
                  onChange={(e) => updateItem(item.id, "current", e.target.checked)}
                  className="w-3.5 h-3.5 accent-blue-500"
                />
                <Label htmlFor={`current-${item.id}`} className="text-white/50 text-xs cursor-pointer">
                  至今在职
                </Label>
              </div>
              <div className="space-y-1">
                <Label className="text-white/50 text-[10px]">工作描述（每行以 • 开头）</Label>
                <Textarea
                  className={textareaCls}
                  placeholder={"• 负责核心业务系统开发\n• 优化页面性能提升 40%"}
                  value={item.description}
                  onChange={(e) => updateItem(item.id, "description", e.target.value)}
                  rows={5}
                />
              </div>
            </div>
          )}
        </div>
      ))}

      {data.workExperiences.length === 0 && (
        <div className="text-center py-10 text-white/25 text-sm">
          <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
          点击"添加经历"开始填写
        </div>
      )}
    </div>
  );
}
