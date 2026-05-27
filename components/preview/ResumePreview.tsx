"use client";

import { forwardRef } from "react";
import { ResumeData, SectionKey, DEFAULT_SECTION_ORDER } from "@/lib/resume-data";

interface ResumePreviewProps {
  data: ResumeData;
}

// Renders lines that start with • as list items, else as paragraph
function DescriptionBlock({ text }: { text: string }) {
  if (!text) return null;
  const lines = text.split("\n").filter((l) => l.trim());
  return (
    <div className="space-y-0.5 mt-1">
      {lines.map((line, i) => {
        const isBullet = line.trim().startsWith("•") || line.trim().startsWith("-");
        return (
          <p
            key={i}
            className="text-[12px] leading-[1.65] text-gray-700"
            style={{ paddingLeft: isBullet ? "0" : "0" }}
          >
            {isBullet ? line.trim() : line.trim()}
          </p>
        );
      })}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div
        className="w-1 h-4 rounded-full flex-shrink-0"
        style={{ background: "linear-gradient(to bottom, #3b82f6, #8b5cf6)" }}
      />
      <h2
        className="text-[13px] font-bold tracking-widest uppercase"
        style={{ color: "#1e293b", letterSpacing: "0.08em" }}
      >
        {children}
      </h2>
      <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, #e2e8f0, transparent)" }} />
    </div>
  );
}

export const ResumePreview = forwardRef<HTMLDivElement, ResumePreviewProps>(
  ({ data }, ref) => {
    const sectionOrder: SectionKey[] = data.sectionOrder ?? DEFAULT_SECTION_ORDER;

    const renderSection = (key: SectionKey) => {
      switch (key) {
        case "summary":
          if (!data.summary) return null;
          return (
            <section key="summary" style={{ marginBottom: "22px" }}>
              <SectionTitle>自我评价</SectionTitle>
              <p
                style={{
                  fontSize: "12.5px",
                  lineHeight: "1.75",
                  color: "#475569",
                  paddingLeft: "12px",
                  borderLeft: "2px solid #e2e8f0",
                }}
              >
                {data.summary}
              </p>
            </section>
          );

        case "workExperiences":
          if (data.workExperiences.length === 0) return null;
          return (
            <section key="workExperiences" style={{ marginBottom: "22px" }}>
              <SectionTitle>工作经历</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {data.workExperiences.map((item) => (
                  <div key={item.id}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "4px",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: "13.5px",
                            fontWeight: "700",
                            color: "#1e293b",
                          }}
                        >
                          {item.company}
                        </span>
                        {item.position && (
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#3b82f6",
                              fontWeight: "600",
                              marginLeft: "10px",
                              background: "rgba(59,130,246,0.08)",
                              padding: "1px 8px",
                              borderRadius: "4px",
                            }}
                          >
                            {item.position}
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "#94a3b8",
                          whiteSpace: "nowrap",
                          fontStyle: "italic",
                        }}
                      >
                        {item.startDate} — {item.current ? "至今" : item.endDate}
                      </span>
                    </div>
                    <DescriptionBlock text={item.description} />
                  </div>
                ))}
              </div>
            </section>
          );

        case "projects":
          if (data.projects.length === 0) return null;
          return (
            <section key="projects" style={{ marginBottom: "22px" }}>
              <SectionTitle>项目经历</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {data.projects.map((item) => (
                  <div key={item.id}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "4px",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: "13.5px",
                            fontWeight: "700",
                            color: "#1e293b",
                          }}
                        >
                          {item.name}
                        </span>
                        {item.role && (
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#8b5cf6",
                              fontWeight: "600",
                              marginLeft: "10px",
                              background: "rgba(139,92,246,0.08)",
                              padding: "1px 8px",
                              borderRadius: "4px",
                            }}
                          >
                            {item.role}
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "#94a3b8",
                          whiteSpace: "nowrap",
                          fontStyle: "italic",
                        }}
                      >
                        {item.startDate && `${item.startDate} — ${item.endDate}`}
                      </span>
                    </div>
                    <DescriptionBlock text={item.description} />
                  </div>
                ))}
              </div>
            </section>
          );

        case "educations":
          if (data.educations.length === 0) return null;
          return (
            <section key="educations" style={{ marginBottom: "22px" }}>
              <SectionTitle>教育背景</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {data.educations.map((item) => (
                  <div key={item.id}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: "13.5px",
                            fontWeight: "700",
                            color: "#1e293b",
                          }}
                        >
                          {item.school}
                        </span>
                        <span
                          style={{
                            fontSize: "12px",
                            color: "#64748b",
                            marginLeft: "8px",
                          }}
                        >
                          {item.major} · {item.degree}
                        </span>
                        {item.gpa && (
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#10b981",
                              background: "rgba(16,185,129,0.08)",
                              padding: "1px 7px",
                              borderRadius: "4px",
                              marginLeft: "8px",
                            }}
                          >
                            GPA {item.gpa}
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "#94a3b8",
                          whiteSpace: "nowrap",
                          fontStyle: "italic",
                        }}
                      >
                        {item.startDate} — {item.endDate}
                      </span>
                    </div>
                    {item.description && (
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          marginTop: "4px",
                          lineHeight: "1.6",
                        }}
                      >
                        {item.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );

        case "skills":
          if (data.skills.length === 0) return null;
          return (
            <section key="skills" style={{ marginBottom: "22px" }}>
              <SectionTitle>技能特长</SectionTitle>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {data.skills.map((item) => (
                  <div
                    key={item.id}
                    style={{ display: "flex", alignItems: "baseline", gap: "12px" }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#334155",
                        minWidth: "72px",
                        flexShrink: 0,
                      }}
                    >
                      {item.category}
                    </span>
                    <div
                      style={{
                        flex: 1,
                        height: "1px",
                        background: "#f1f5f9",
                        flexShrink: 0,
                        width: "12px",
                        alignSelf: "center",
                      }}
                    />
                    <span
                      style={{
                        fontSize: "12.5px",
                        color: "#475569",
                        lineHeight: "1.5",
                        flex: 1,
                      }}
                    >
                      {item.items}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          );

        default:
          return null;
      }
    };

    return (
      <div
        ref={ref}
        style={{
          width: "794px",
          minHeight: "1123px",
          backgroundColor: "#ffffff",
          fontFamily: "'Inter', 'PingFang SC', 'Microsoft YaHei', sans-serif",
        }}
      >
        {/* Header Banner */}
        <div
          style={{
            background: "linear-gradient(135deg, #1e3a5f 0%, #2d1b69 50%, #1a1a2e 100%)",
            padding: "36px 44px 32px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Decorative circles */}
          <div
            style={{
              position: "absolute",
              top: "-40px",
              right: "-40px",
              width: "200px",
              height: "200px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.04)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-20px",
              right: "120px",
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.03)",
            }}
          />

          <div style={{ display: "flex", alignItems: "flex-start", gap: "24px", position: "relative" }}>
            {/* Avatar */}
            {data.avatar && (
              <img
                src={data.avatar}
                alt="avatar"
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "3px solid rgba(255,255,255,0.2)",
                  flexShrink: 0,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                }}
              />
            )}

            <div style={{ flex: 1 }}>
              {/* Name */}
              <h1
                style={{
                  fontSize: "28px",
                  fontWeight: "700",
                  color: "#ffffff",
                  margin: "0 0 4px 0",
                  letterSpacing: "-0.5px",
                }}
              >
                {data.name || "您的姓名"}
              </h1>

              {/* Title */}
              {data.title && (
                <p
                  style={{
                    fontSize: "14px",
                    color: "rgba(255,255,255,0.7)",
                    margin: "0 0 16px 0",
                    fontWeight: "500",
                    letterSpacing: "0.5px",
                  }}
                >
                  {data.title}
                </p>
              )}

              {/* Contact Info */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px" }}>
                {data.phone && (
                  <ContactItem icon="📱" text={data.phone} />
                )}
                {data.email && (
                  <ContactItem icon="✉️" text={data.email} />
                )}
                {data.location && (
                  <ContactItem icon="📍" text={data.location} />
                )}
                {data.github && (
                  <ContactItem icon="⌨" text={data.github} />
                )}
                {data.website && (
                  <ContactItem icon="🔗" text={data.website} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body — sections rendered in user-defined order */}
        <div style={{ padding: "28px 44px" }}>
          {sectionOrder.map(renderSection)}
        </div>
      </div>
    );
  }
);

ResumePreview.displayName = "ResumePreview";

function ContactItem({ icon, text }: { icon: string; text: string }) {
  return (
    <span
      style={{
        display: "flex",
        alignItems: "center",
        gap: "5px",
        fontSize: "11.5px",
        color: "rgba(255,255,255,0.75)",
      }}
    >
      <span style={{ fontSize: "11px" }}>{icon}</span>
      {text}
    </span>
  );
}
