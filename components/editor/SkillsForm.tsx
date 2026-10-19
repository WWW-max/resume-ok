"use client";
import { useId } from "react";
import { ui } from "@/lib/ui-styles";
import { ResumeData } from "@/lib/resume-data";
import { ClearableTextarea } from "./ClearableField";

export function SkillsForm({
  data,
  onChange,
}: {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}) {
  const id = useId();
  const value = data.skills
    .map((s) =>
      s.category && s.category !== "技能"
        ? `**${s.category}：**${s.items}`
        : s.items,
    )
    .join("\n");

  function handleChange(text: string) {
    if (!text.trim()) {
      onChange({ ...data, skills: [] });
      return;
    }
    const skills = text
      .split("\n")
      .filter((line) => line.trim())
      .map((line, i) => {
        const match = /^(?:\*\*)?([^：:\n*]+?)[：:](?:\*\*)?\s*(.*)$/.exec(
          line.trim(),
        );
        return {
          id: data.skills[i]?.id || `skill-${i + 1}`,
          category: match ? match[1].replace(/\*\*/g, "").trim() : "技能",
          items: match ? match[2].trim() : line.trim(),
        };
      });
    onChange({ ...data, skills });
  }

  return (
    <div className={ui["resume-form"]}>
      <div className={`${ui["field"]} wide`}>
        <label htmlFor={id}>专业技能（选中文字点击 B 即可加粗，每行一条）</label>
        <ClearableTextarea
          id={id}
          rows={14}
          value={value}
          clearLabel="清空专业技能"
          onClear={() => onChange({ ...data, skills: [] })}
          placeholder="例如：Web 前端：掌握 HTML5、CSS3、JavaScript、TypeScript..."
          onChange={(e) => handleChange(e.target.value)}
        />
      </div>
    </div>
  );
}
