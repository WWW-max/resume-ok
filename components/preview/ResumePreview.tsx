"use client";
import { ui } from "@/lib/ui-styles";
import { forwardRef, type CSSProperties } from "react";
import { ResumeData, SectionKey, SECTION_LABELS } from "@/lib/resume-data";
import { defaultAppearance, accentColors } from "@/lib/resume-appearance";
import { Brand } from "@/components/Brand";
import {
  Phone,
  Mail,
  MapPin,
  Link as LinkIcon,
  Clover,
  UserRound,
  BriefcaseBusiness,
  GraduationCap,
  Folders,
  Star,
} from "lucide-react";
const icons = {
  workExperiences: BriefcaseBusiness,
  educations: GraduationCap,
  projects: Folders,
  skills: Star,
  summary: UserRound,
};
function Description({ text }: { text: string }) {
  return (
    <div className={ui["resume-description"]}>
      {text
        .split("\n")
        .filter((line) => line.trim())
        .map((line, index) => (
          <p key={index}>{line}</p>
        ))}
    </div>
  );
}
export const ResumePreview = forwardRef<HTMLDivElement, { data: ResumeData }>(
  ({ data }, ref) => {
    const appearance = { ...defaultAppearance, ...data.appearance };
    function content(key: SectionKey) {
      switch (key) {
        case "summary":
          return data.summary ? <Description text={data.summary} /> : null;
        case "skills":
          return data.skills.length ? (
            <div className={ui["skill-tags"]}>
              {data.skills
                .flatMap((s) => s.items.split(/\s*[/、,，]\s*/).filter(Boolean))
                .map((s, i) => (
                  <span key={i}>{s}</span>
                ))}
            </div>
          ) : null;
        case "workExperiences":
          return data.workExperiences.length
            ? data.workExperiences.map((item) => (
                <article key={item.id}>
                  <div className={ui["resume-row"]}>
                    <h3>
                      {item.company} <span>{item.position}</span>
                    </h3>
                    <time>
                      {item.startDate} — {item.current ? "至今" : item.endDate}
                    </time>
                  </div>
                  <Description text={item.description} />
                </article>
              ))
            : null;
        case "projects":
          return data.projects.length
            ? data.projects.map((item) => (
                <article key={item.id}>
                  <div className={ui["resume-row"]}>
                    <h3>{item.name}</h3>
                    <time>
                      {item.startDate} — {item.endDate}
                    </time>
                  </div>
                  <p className={ui["resume-role"]}>{item.role}</p>
                  {item.link && (
                    <p className={ui["resume-link"]}>{item.link}</p>
                  )}
                  <Description text={item.description} />
                </article>
              ))
            : null;
        case "educations":
          return data.educations.length
            ? data.educations.map((item) => (
                <article key={item.id}>
                  <div className={ui["resume-row"]}>
                    <h3>{item.school}</h3>
                    <time>
                      {item.startDate} — {item.endDate}
                    </time>
                  </div>
                  <p className={ui["resume-role"]}>
                    {[item.major, item.degree, item.gpa && `GPA ${item.gpa}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  <Description text={item.description} />
                </article>
              ))
            : null;
      }
    }
    return (
      <div
        ref={ref}
        className={`${ui["resume-paper"]} template-${appearance.template} spacing-${appearance.spacing}`}
        style={
          {
            "--resume-accent": accentColors[appearance.accent],
            "--resume-font-size": `${appearance.fontSize}px`,
          } as CSSProperties
        }
      >
        <Clover className={ui["paper-watermark"]} aria-hidden="true" />
        {appearance.showBrand && <Brand small />}
        <header className={ui["resume-header"]}>
          <div>
            <h1>{data.name || "您的姓名"}</h1>
            <p className={ui["resume-job"]}>{data.title || "求职意向"}</p>
            <div className={ui["resume-contact"]}>
              {[
                [Phone, data.phone],
                [Mail, data.email],
                [MapPin, data.location],
                [LinkIcon, data.github],
                [LinkIcon, data.website],
              ].map(([Icon, text], i) => {
                const ContactIcon = Icon as typeof Phone;
                return typeof text === "string" && text ? (
                  <span key={i}>
                    <ContactIcon size={14} />
                    {text}
                  </span>
                ) : null;
              })}
            </div>
          </div>
          {data.avatar && (
            // eslint-disable-next-line @next/next/no-img-element -- user-uploaded data URL
            <img
              src={data.avatar}
              alt={`${data.name}的简历头像`}
              className={ui["resume-avatar"]}
            />
          )}
        </header>
        <div className={ui["resume-sections"]}>
          {data.sectionOrder
            .filter((key) => !data.hiddenSections?.includes(key))
            .map((key) => {
              const body = content(key);
              if (!body) return null;
              const Icon = icons[key];
              return (
                <section
                  key={key}
                  data-section={key}
                  className={`${ui["resume-section"]} ${key === "skills" || key === "summary" ? "half-section" : ""}`}
                >
                  <h2>
                    <Icon size={18} />
                    {SECTION_LABELS[key]}
                  </h2>
                  {body}
                </section>
              );
            })}
        </div>
      </div>
    );
  },
);
ResumePreview.displayName = "ResumePreview";
