import type { Metadata } from "next";
import { redirect } from "next/navigation";
import EditorWorkspace from "@/components/editor/EditorWorkspace";
import { currentUser } from "@/lib/server/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "编辑简历 · ResumeOK",
  robots: { index: false, follow: false },
};

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  const { view } = await searchParams;
  const user = await currentUser();
  if (!user) {
    const next =
      typeof view === "string"
        ? `/editor?view=${encodeURIComponent(view)}`
        : "/editor";
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }
  const initialView =
    typeof view === "string" &&
    ["editor", "templates", "assistant", "resumes", "settings"].includes(view)
      ? view
      : "editor";
  return (
    <EditorWorkspace key={initialView} initialView={initialView} user={user} />
  );
}
