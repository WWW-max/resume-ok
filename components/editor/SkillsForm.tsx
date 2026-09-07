"use client";

import { ResumeData, Skill } from "@/lib/resume-data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Zap } from "lucide-react";
import { nanoid } from "@/lib/utils";

interface SkillsFormProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

const inputCls =
  "bg-white border-slate-200 text-slate-800 placeholder:text-slate-500 focus:border-blue-500/50 transition-colors text-sm h-11 md:h-9 rounded-lg touch-manipulation";

const PRESET_CATEGORIES = [
  "编程语言",
  "框架与库",
  "工具与平台",
  "数据库",
  "外语能力",
];

export function SkillsForm({ data, onChange }: SkillsFormProps) {
  const updateItem = (id: string, key: keyof Skill, value: string) => {
    onChange({
      ...data,
      skills: data.skills.map((item) =>
        item.id === id ? { ...item, [key]: value } : item
      ),
    });
  };

  const addItem = (category = "") => {
    const newItem: Skill = {
      id: nanoid(),
      category,
      items: "",
    };
    onChange({ ...data, skills: [...data.skills, newItem] });
  };

  const removeItem = (id: string) => {
    onChange({ ...data, skills: data.skills.filter((item) => item.id !== id) });
  };

  return (
    <div className="px-4 pb-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-slate-500 text-xs">共 {data.skills.length} 项技能</p>
        <Button
          onClick={() => addItem()}
          size="sm"
          className="h-9 md:h-7 text-xs bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-600/30 hover:border-amber-500/50 rounded-lg gap-1.5 transition-all touch-manipulation"
        >
          <Plus className="w-3 h-3" />
          添加技能
        </Button>
      </div>

      {/* Quick Add Presets */}
      <div className="space-y-1.5">
        <p className="text-slate-500 text-xs">快捷添加分类</p>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_CATEGORIES.filter(
            (cat) => !data.skills.find((s) => s.category === cat)
          ).map((cat) => (
            <button
              key={cat}
              onClick={() => addItem(cat)}
              className="px-2 py-1 rounded-md text-xs bg-white border border-slate-200 text-slate-500 hover:text-slate-500 hover:border-slate-200 hover:bg-white transition-all"
            >
              + {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Skill Items */}
      <div className="space-y-2.5">
        {data.skills.map((item) => (
          <div
            key={item.id}
            className="border border-slate-200 rounded-xl p-3 bg-white hover:border-slate-200 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-md bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Zap className="w-2.5 h-2.5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <Input
                  className={`${inputCls} h-7 text-xs`}
                  placeholder="技能分类（如：编程语言）"
                  value={item.category}
                  onChange={(e) => updateItem(item.id, "category", e.target.value)}
                />
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="w-6 h-6 rounded-md flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            <Input
              className={inputCls}
              placeholder="JavaScript / TypeScript / Python"
              value={item.items}
              onChange={(e) => updateItem(item.id, "items", e.target.value)}
            />
          </div>
        ))}
      </div>

      {data.skills.length === 0 && (
        <div className="text-center py-10 text-slate-500 text-sm">
          <Zap className="w-8 h-8 mx-auto mb-2 opacity-30" />
          添加技能或使用快捷分类
        </div>
      )}
    </div>
  );
}
