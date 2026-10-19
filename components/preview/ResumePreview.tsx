"use client";
import { ui } from "@/lib/ui-styles";
import { forwardRef, type CSSProperties, type ReactNode } from "react";
import {
  Project,
  ResumeData,
  SectionKey,
  SECTION_LABELS,
} from "@/lib/resume-data";
import { defaultAppearance, accentColors } from "@/lib/resume-appearance";
import {
  Phone,
  Mail,
  MapPin,
  Link as LinkIcon,
  UserRound,
  BriefcaseBusiness,
  GraduationCap,
  Folders,
  CodeXml,
  Star,
} from "lucide-react";
const icons = {
  workExperiences: BriefcaseBusiness,
  educations: GraduationCap,
  projects: Folders,
  openSource: CodeXml,
  skills: Star,
  summary: UserRound,
};
function renderInlineBold(text: string): ReactNode {
  if (!/(\*\*|\*|\[.+?\]\(https?:\/\/)/.test(text)) return text;
  const tokens = text.split(
    /(\*\*.*?\*\*|(?<!\*)\*[^*]+\*(?!\*)|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g,
  );
  return tokens.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return (
        <strong key={i} className="font-semibold text-inherit">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <em key={i} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    const linkMatch = /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/.exec(part);
    if (linkMatch) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return part;
  });
}
function formatDate(value: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
  return match ? `${match[1]}年${match[2]}月` : value.trim();
}
function formatDateRange(
  startDate: string,
  endDate: string,
  current?: boolean,
): string {
  const start = formatDate(startDate);
  const end = current || endDate === "至今" ? "至今" : formatDate(endDate);
  if (!start && !end) return "";
  return [start, end].filter(Boolean).join(" - ");
}
function Description({ text }: { text: string }) {
  const lines = text.split("\n").filter((line) => line.trim());
  if (!lines.length) return null;
  return (
    <div className={ui["resume-description"]}>
      {lines.map((line, index) => {
        const trimmed = line.trim();
        const isBullet = /^[•·]\s*/.test(trimmed);
        return isBullet ? (
          <p
            key={index}
            className="relative pl-4 before:absolute before:left-1 before:content-['•']"
          >
            {renderInlineBold(trimmed.replace(/^[•·]\s*/, ""))}
          </p>
        ) : (
          <p key={index}>{renderInlineBold(trimmed)}</p>
        );
      })}
    </div>
  );
}
function renderProjects(items: Project[]) {
  return items.length
    ? items.map((item) => {
        const dateRange = formatDateRange(item.startDate, item.endDate);
        const titleWithLink = item.link
          ? `${item.name}${item.name.endsWith(".") ? " " : ". "}${item.link}`
          : item.name;
        return (
          <article key={item.id}>
            <div className={ui["resume-row"]}>
              <h3>{titleWithLink}</h3>
              {dateRange && <time>{dateRange}</time>}
            </div>
            {item.role && <p className={ui["resume-role"]}>{item.role}</p>}
            <Description text={item.description} />
          </article>
        );
      })
    : null;
}
export const ResumePreview = forwardRef<HTMLDivElement, { data: ResumeData }>(
  ({ data }, ref) => {
    const appearance = { ...defaultAppearance, ...data.appearance };
    const descriptiveSkills = data.skills.some((s) =>
      /[。；：，]|\*\*/.test(s.items),
    );
    function content(key: SectionKey) {
      switch (key) {
        case "summary":
          return data.summary ? <Description text={data.summary} /> : null;
        case "skills":
          if (!data.skills.length) return null;
          if (descriptiveSkills) {
            return (
              <div className={ui["resume-description"]}>
                {data.skills.map((s) => (
                  <p key={s.id}>
                    {s.category && s.category !== "技能" && (
                      <strong className="font-semibold text-inherit">
                        {s.category}：
                      </strong>
                    )}
                    {renderInlineBold(s.items)}
                  </p>
                ))}
              </div>
            );
          }
          return (
            <div className={ui["skill-tags"]}>
              {data.skills
                .flatMap((s) => s.items.split(/\s*[/、,，]\s*/).filter(Boolean))
                .map((s, i) => (
                  <span key={i}>{s}</span>
                ))}
            </div>
          );
        case "workExperiences":
          return data.workExperiences.length
            ? data.workExperiences.map((item) => {
                const dateRange = formatDateRange(
                  item.startDate,
                  item.endDate,
                  item.current,
                );
                return (
                  <article key={item.id}>
                    <div className={ui["resume-row"]}>
                      <h3>
                        {item.company}
                        {item.position && <span>{item.position}</span>}
                      </h3>
                      {dateRange && <time>{dateRange}</time>}
                    </div>
                    <Description text={item.description} />
                  </article>
                );
              })
            : null;
        case "projects":
          return renderProjects(data.projects);
        case "openSource":
          return renderProjects(data.openSource ?? []);
        case "educations":
          return data.educations.length
            ? data.educations.map((item) => {
                const dateRange = formatDateRange(item.startDate, item.endDate);
                const shortSingleLineDesc =
                  !!item.description.trim() &&
                  !item.description.includes("\n") &&
                  item.description.trim().length <= 20;
                const roleParts = [
                  item.major,
                  item.degree,
                  item.gpa && `GPA ${item.gpa}`,
                  shortSingleLineDesc ? item.description.trim() : "",
                ].filter(Boolean);
                return (
                  <article key={item.id}>
                    <div className={ui["resume-row"]}>
                      <h3>{item.school}</h3>
                      {dateRange && <time>{dateRange}</time>}
                    </div>
                    {roleParts.length > 0 && (
                      <p className={ui["resume-role"]}>
                        {roleParts.join(shortSingleLineDesc ? " " : " · ")}
                      </p>
                    )}
                    {!shortSingleLineDesc && (
                      <Description text={item.description} />
                    )}
                  </article>
                );
              })
            : null;
      }
    }
    const centerCompactContact =
      appearance.personalInfoLayout === "center" && !appearance.showIcons;
    const primaryContacts = [data.phone, data.email, data.location].filter(
      Boolean,
    );
    const linkContacts = [data.github, data.website].filter(Boolean);
    return (
      <div
        ref={ref}
        className={`${ui["resume-paper"]} template-${appearance.template} spacing-${appearance.spacing} ${appearance.accent === "none" ? "accent-none" : ""}`}
        style={
          {
            "--resume-accent": accentColors[appearance.accent],
            "--resume-font-size": `${appearance.fontSize}px`,
            "--resume-divider":
              appearance.accent === "none"
                ? appearance.dividerColor === defaultAppearance.dividerColor
                  ? "#262626"
                  : appearance.dividerColor
                : appearance.dividerColor,
            paddingTop: appearance.paddingTop,
            paddingRight: appearance.paddingRight,
            paddingBottom: appearance.paddingBottom,
            paddingLeft: appearance.paddingLeft,
          } as CSSProperties
        }
      >
        {data.schoolLogo && (
          // eslint-disable-next-line @next/next/no-img-element -- user-uploaded data URL
          <img
            src={data.schoolLogo}
            alt="学校校徽"
            className={ui["resume-school-logo"]}
          />
        )}
        <header
          className={`${ui["resume-header"]} personal-layout-${appearance.personalInfoLayout}`}
        >
          <div>
            <h1>{data.name || "您的姓名"}</h1>
            {data.title && <p className={ui["resume-job"]}>{data.title}</p>}
            {centerCompactContact ? (
              <div className="mt-1.5 flex flex-col items-center gap-0.5 text-[12px] leading-[1.6] text-[#171717]">
                {primaryContacts.length > 0 && (
                  <p>{primaryContacts.join(" | ")}</p>
                )}
                {linkContacts.length > 0 && <p>{linkContacts.join(" | ")}</p>}
              </div>
            ) : (
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
                      {appearance.showIcons && <ContactIcon size={14} />}
                      {text}
                    </span>
                  ) : null;
                })}
              </div>
            )}
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
              const isHalf =
                (key === "skills" && !descriptiveSkills) || key === "summary";
              return (
                <section
                  key={key}
                  data-section={key}
                  className={`${ui["resume-section"]} ${isHalf ? "half-section" : ""}`}
                >
                  <h2>
                    {appearance.showIcons && <Icon size={18} />}
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
