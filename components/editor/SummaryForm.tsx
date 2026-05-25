"use client";

import { ResumeData } from "@/lib/resume-data";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Lightbulb } from "lucide-react";

interface SummaryFormProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

const TEMPLATES = [
  "X年{方向}开发经验，熟练掌握{技术栈}，具备{亮点}。热爱技术，持续学习，追求高质量代码与极致用户体验。",
  "拥有扎实的{专业}基础，擅长{领域}，曾在{公司规模}公司负责{职责}，有良好的团队协作和沟通能力。",
];

export function SummaryForm({ data, onChange }: SummaryFormProps) {
  return (
    <div className="px-4 pb-6 space-y-4">
      <div className="space-y-2">
        <Label className="text-white/60 text-xs font-medium flex items-center gap-1.5">
          <FileText className="w-3 h-3" />
          自我评价
        </Label>
        <Textarea
          className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-blue-500/50 transition-colors text-sm rounded-lg resize-none"
          placeholder="介绍你的核心竞争力、工作风格、职业目标等..."
          value={data.summary}
          onChange={(e) => onChange({ ...data, summary: e.target.value })}
          rows={8}
        />
        <div className="flex items-center justify-between">
          <p className="text-white/25 text-[10px]">建议 80-150 字</p>
          <p className="text-white/25 text-[10px]">{data.summary.length} 字</p>
        </div>
      </div>

      {/* Writing Tips */}
      <div className="border border-white/8 rounded-xl p-3 bg-blue-500/5">
        <div className="flex items-center gap-1.5 mb-2">
          <Lightbulb className="w-3 h-3 text-blue-400" />
          <p className="text-blue-400 text-[10px] font-medium">写作建议</p>
        </div>
        <ul className="space-y-1">
          {[
            "突出你的核心技术栈和专业领域",
            "量化成就，如\"5年经验\"、\"团队协作\"",
            "体现职业态度：学习能力、团队精神",
            "保持简洁，避免空洞的套话",
          ].map((tip, i) => (
            <li key={i} className="text-white/35 text-[10px] flex items-start gap-1.5">
              <span className="text-blue-400/60 mt-0.5">•</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Template Quick Fill */}
      <div className="space-y-1.5">
        <p className="text-white/30 text-[10px] flex items-center gap-1">
          <span>模板参考（点击填入）</span>
        </p>
        {TEMPLATES.map((tpl, i) => (
          <button
            key={i}
            onClick={() => onChange({ ...data, summary: tpl })}
            className="w-full text-left px-3 py-2 rounded-lg border border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/6 transition-all text-white/35 hover:text-white/55 text-[10px] leading-relaxed"
          >
            {tpl}
          </button>
        ))}
      </div>
    </div>
  );
}
