import type { Metadata } from "next";
import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Brand } from "@/components/Brand";
import { OnlineResumeViewer } from "@/components/preview/OnlineResumeViewer";
import { getPublicOnlineResumeBySlug } from "@/lib/server/online-resumes";

export const dynamic = "force-dynamic";

function safeDecode(slug: string): string {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug: rawSlug } = await params;
  const slug = safeDecode(rawSlug);
  const record = await getPublicOnlineResumeBySlug(slug);
  if (!record) {
    return {
      title: "未找到在线简历",
      robots: { index: false, follow: false },
    };
  }
  const candidateName = record.data.name.trim() || record.title || slug;
  const role = record.data.title.trim();
  const pageTitle = `${candidateName}${role ? ` - ${role}` : ""} | 在线简历`;
  const description = `${candidateName}${role ? `（${role}）` : ""}的在线简历预览与 PDF 下载`;
  return {
    title: pageTitle,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title: `${pageTitle} · ResumeOK`,
      description,
      type: "profile",
    },
  };
}

export default async function OnlineResumePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await params;
  const slug = safeDecode(rawSlug);
  const record = await getPublicOnlineResumeBySlug(slug);

  if (!record) {
    return (
      <div className="flex min-h-dvh flex-col bg-[#f4fbf6] text-ink">
        <header className="flex h-14 items-center border-b border-[#d8efe1] bg-white px-6">
          <Link href="/" aria-label="返回 ResumeOK 首页">
            <Brand />
          </Link>
        </header>
        <main className="grid flex-1 place-items-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-[#d8efe1] bg-white p-8 text-center shadow-[0_12px_36px_#10391d12]">
            <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-[#e8f8ee] text-[#0cb449]">
              <FileQuestion size={24} />
            </div>
            <h1 className="text-lg font-bold text-[#153620]">
              未找到该在线简历
            </h1>
            <p className="mt-2 text-xs leading-relaxed text-muted-ink">
              链接 <code className="rounded bg-[#f0f9f3] px-1.5 py-0.5 text-[#168347]">/online-resume/{slug}</code> 不存在，或简历所有者已关闭在线访问权限。
            </p>
            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-brand px-5 text-xs font-semibold text-white transition-colors hover:bg-brand-dark"
              >
                返回 ResumeOK 首页
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <OnlineResumeViewer
      title={record.title}
      slug={record.slug}
      data={record.data}
    />
  );
}
