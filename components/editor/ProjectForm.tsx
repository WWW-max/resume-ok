"use client";

import { ResumeData, Project } from "@/lib/resume-data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ChevronDown, ChevronUp, FolderOpen, Link } from "lucide-react";
import { useState } from "react";
import { nanoid } from "@/lib/utils";

interface ProjectFormProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

const inputCls =
  "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-blue-500/50 transition-colors text-sm h-11 md:h-9 rounded-lg touch-manipulation";
const textareaCls =
  "bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-blue-500/50 transition-colors text-sm rounded-lg resize-none";

export function ProjectForm({ data, onChange }: ProjectFormProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    data.projects[0]?.id ?? null
  );

  const updateItem = (id: string, key: keyof Project, value: string) => {
    onChange({
      ...data,
      projects: data.projects.map((item) =>
        item.id === id ? { ...item, [key]: value } : item
      ),
    });
  };

  const addItem = () => {
    const newItem: Project = {
      id: nanoid(),
      name: "",
      role: "",
      startDate: "",
      endDate: "",
      link: "",
      description: "",
    };
    onChange({ ...data, projects: [...data.projects, newItem] });
    setExpandedId(newItem.id);
  };

  const removeItem = (id: string) => {
    onChange({ ...data, projects: data.projects.filter((item) => item.id !== id) });
  };

  return (
    <div className="px-4 pb-6 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-white/40 text-xs">共 {data.projects.length} 个项目经历</p>
        <Button
          onClick={addItem}
          size="sm"
          className="h-9 md:h-7 text-xs bg-violet-600/20 hover:bg-violet-600/30 text-violet-400 border border-violet-600/30 hover:border-violet-500/50 rounded-lg gap-1.5 transition-all touch-manipulation"
        >
          <Plus className="w-3 h-3" />
          添加项目
        </Button>
      </div>

      {data.projects.map((item) => (
        <div
          key={item.id}
          className="border border-white/10 rounded-xl overflow-hidden bg-white/3 hover:border-white/15 transition-colors"
        >
          <div
            className="flex items-center justify-between px-3 py-3 md:py-2.5 cursor-pointer hover:bg-white/5 transition-colors touch-manipulation"
            onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-md bg-violet-500/20 flex items-center justify-center flex-shrink-0">
                <FolderOpen className="w-3 h-3 text-violet-400" />
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-medium truncate">
                  {item.name || "未填写项目名"}
                </p>
                <p className="text-white/40 text-[10px] truncate">
                  {item.role || "角色"}{" "}
                  {item.startDate && `· ${item.startDate} — ${item.endDate || "?"}`}
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
                  <Label className="text-white/50 text-[10px]">项目名称</Label>
                  <Input
                    className={inputCls}
                    placeholder="企业低代码平台"
                    value={item.name}
                    onChange={(e) => updateItem(item.id, "name", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/50 text-[10px]">担任角色</Label>
                  <Input
                    className={inputCls}
                    placeholder="技术负责人"
                    value={item.role}
                    onChange={(e) => updateItem(item.id, "role", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-white/50 text-[10px]">开始时间</Label>
                  <Input
                    className={inputCls}
                    placeholder="2023-01"
                    value={item.startDate}
                    onChange={(e) => updateItem(item.id, "startDate", e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-white/50 text-[10px]">结束时间</Label>
                  <Input
                    className={inputCls}
                    placeholder="2023-12"
                    value={item.endDate}
                    onChange={(e) => updateItem(item.id, "endDate", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-white/50 text-[10px] flex items-center gap-1">
                  <Link className="w-2.5 h-2.5" />
                  项目链接（可选）
                </Label>
                <Input
                  className={inputCls}
                  placeholder="https://github.com/..."
                  value={item.link}
                  onChange={(e) => updateItem(item.id, "link", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-white/50 text-[10px]">项目描述（每行以 • 开头）</Label>
                <Textarea
                  className={textareaCls}
                  placeholder={"• 设计并实现可视化拖拽编辑器\n• 实现多人实时协作功能"}
                  value={item.description}
                  onChange={(e) => updateItem(item.id, "description", e.target.value)}
                  rows={5}
                />
              </div>
            </div>
          )}
        </div>
      ))}

      {data.projects.length === 0 && (
        <div className="text-center py-10 text-white/25 text-sm">
          <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
          点击"添加项目"开始填写
        </div>
      )}
    </div>
  );
}
