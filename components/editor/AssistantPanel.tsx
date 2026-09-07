"use client";
import { ui } from "@/lib/ui-styles";
import { ResumeData } from "@/lib/resume-data";
import { checkResume } from "@/lib/resume-checks";
import type { EditorSection } from "./EditorPanel";
import { CheckCircle2, ArrowRight, Lightbulb, CircleAlert } from "lucide-react";
export function AssistantPanel({
  data,
  onEdit,
}: {
  data: ResumeData;
  onEdit: (section: EditorSection) => void;
}) {
  const checks = checkResume(data);
  const passed = checks.filter((c) => c.passed).length;
  const score = Math.round((passed / checks.length) * 100);
  return (
    <div className={ui["editor-panel"]}>
      <div className={ui["panel-heading"]}>
        <h1>简历助手</h1>
        <p>从完整度到表达，逐项打磨你的简历。</p>
      </div>
      <div className={`${ui["panel-scroll"]} ${ui["assistant-panel"]}`}>
        <div className={ui["score-card"]}>
          <Lightbulb size={28} />
          <strong>
            {score}
            <small>/ 100</small>
          </strong>
          <h2>简历完整度</h2>
          <p>
            {passed} / {checks.length} 项基础检查通过
          </p>
          <progress value={passed} max={checks.length} />
        </div>
        <p className={ui["assistant-note"]}>
          本地规则检查，不调用
          AI、不上传简历。分数仅反映基础信息完整度，不代表招聘评价。
        </p>
        {[...checks]
          .sort((a, b) => Number(a.passed) - Number(b.passed))
          .map((check) => (
            <div
              key={check.id}
              className={`${ui["check-card"]} ${check.passed ? "passed" : ""}`}
            >
              <div>
                {check.passed ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <CircleAlert size={18} />
                )}
                <h3>{check.title}</h3>
                <span>{check.passed ? "已完成" : "待完善"}</span>
              </div>
              {!check.passed && (
                <>
                  <p>{check.advice}</p>
                  <button
                    className={ui["text-button"]}
                    onClick={() => onEdit(check.section)}
                  >
                    去完善
                    <ArrowRight size={14} />
                  </button>
                </>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
