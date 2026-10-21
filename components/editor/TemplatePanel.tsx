"use client";
import { ui } from "@/lib/ui-styles";
import { ResumeData } from "@/lib/resume-data";
import { defaultAppearance } from "@/lib/resume-appearance";
import { Check, Crown } from "lucide-react";
import { canUseTemplate, type MembershipPlan } from "@/lib/membership";
export function TemplatePanel({
  data,
  plan = "free",
  onRequirePro,
  onChange,
}: {
  data: ResumeData;
  plan?: MembershipPlan;
  onRequirePro?: (reason: string) => void;
  onChange: (data: ResumeData) => void;
}) {
  const appearance = { ...defaultAppearance, ...data.appearance };
  return (
    <div className={ui["editor-panel"]}>
      <div className={ui["panel-heading"]}>
        <h1>模板库</h1>
        <p>切换风格，不改变你已填写的内容。</p>
      </div>
      <div className={`${ui["panel-scroll"]} ${ui["template-list"]}`}>
        {[
          {
            id: "classic",
            name: "清新专业",
            subtitle: "设计稿同款 · 轻盈、清晰",
            defaultTag: "推荐",
          },
          {
            id: "minimal",
            name: "极简留白",
            subtitle: "单栏排版 · 专注内容",
            defaultTag: "经典",
          },
          {
            id: "modern",
            name: "现代商务",
            subtitle: "品牌色页眉 · 鲜明层次",
            defaultTag: "商务",
          },
        ].map((t) => {
          const allowed = canUseTemplate(plan, t.id);
          return (
            <button
              className={`${ui["template-card"]} ${appearance.template === t.id ? "active" : ""}`}
              key={t.id}
              onClick={() => {
                if (!allowed) {
                  onRequirePro?.(
                    `「${t.name}」专业模板为会员专享功能，升级后即可自由切换全部精选模板。`,
                  );
                  return;
                }
                onChange({
                  ...data,
                  appearance: {
                    ...appearance,
                    template: t.id as typeof appearance.template,
                  },
                });
              }}
              aria-pressed={appearance.template === t.id}
            >
              <div
                className={`${ui["template-mini"]} mini-${t.id}`}
                aria-hidden="true"
              >
                <div className={ui["mini-head"]}>
                  <span />
                  <i />
                  <i />
                </div>
                {[0, 1, 2].map((i) => (
                  <div className={ui["mini-section"]} key={i}>
                    <b />
                    <i />
                    <i />
                    <i />
                  </div>
                ))}
              </div>
              <div className={ui["template-caption"]}>
                <strong>
                  {t.name}
                  <small className="inline-flex items-center gap-0.5">
                    {!allowed && <Crown size={11} />}
                    {allowed ? t.defaultTag : "PRO"}
                  </small>
                </strong>
                <p>{t.subtitle}</p>
              </div>
              {appearance.template === t.id && <Check size={18} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
