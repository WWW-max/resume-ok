import type { Metadata } from "next";
import EditorWorkspace from "@/components/editor/EditorWorkspace";

export const metadata: Metadata = {
  title: "编辑简历 · ResumeOK",
  robots: { index: false, follow: false },
};

export default async function EditorPage({searchParams}: {
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  const { view } = await searchParams;
  const initialView = typeof view === "string" && ["editor","templates","assistant","resumes","settings"].includes(view) ? view : "editor";
  return <EditorWorkspace key={initialView} initialView={initialView} />;
}
