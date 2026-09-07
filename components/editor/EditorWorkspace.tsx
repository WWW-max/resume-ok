"use client";
import { ui } from "@/lib/ui-styles";
import Link from "next/link";
import { useRef, useState } from "react";
import { useResumeLibrary } from "@/hooks/useResumeLibrary";
import { LibraryPanel } from "@/components/editor/LibraryPanel";
import {
  EditorPanel,
  type EditorSection,
} from "@/components/editor/EditorPanel";
import { PreviewCanvas } from "@/components/preview/PreviewCanvas";
import { SettingsPanel } from "@/components/editor/SettingsPanel";
import { AssistantPanel } from "@/components/editor/AssistantPanel";
import { TemplatePanel } from "@/components/editor/TemplatePanel";
import { Brand } from "@/components/Brand";
import {
  Download,
  Eye,
  PencilLine,
  LayoutGrid,
  Sparkles,
  Files,
  Settings,
  Monitor,
  ChevronDown,
  Lightbulb,
  Undo2,
  Redo2,
} from "lucide-react";
export default function EditorWorkspace({
  initialView = "editor",
}: {
  initialView?: string;
}) {
  const store = useResumeLibrary();
  const data = store.active.data;
  const setData = store.updateData;
  const [view, setView] = useState(initialView);
  const [previewOnly, setPreviewOnly] = useState(false);
  const [editTarget, setEditTarget] = useState<EditorSection | null>(null);
  const [zoom, setZoom] = useState<number | "fit">("fit");
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  async function download() {
    if (!previewRef.current || exporting) return;
    setExporting(true);
    setExportError("");
    try {
      const { exportResumePdf } = await import("@/lib/export-pdf");
      await exportResumePdf(previewRef.current, `${data.name || "我的"}_简历`);
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : "导出失败，请重试或使用打印。",
      );
    } finally {
      setExporting(false);
    }
  }
  function openPanel(panel: string) {
    setView(panel);
    setPreviewOnly(false);
  }
  const previewRef = useRef<HTMLDivElement>(null);
  return (
    <div
      className={`${ui["workspace"]} ${previewOnly ? "preview-only" : ""}`}
      onKeyDown={(event) => {
        if (
          (event.metaKey || event.ctrlKey) &&
          !event.altKey &&
          event.key.toLowerCase() === "z"
        ) {
          event.preventDefault();
          if (event.shiftKey) store.redo();
          else store.undo();
        }
      }}
    >
      <header className={ui["topbar"]}>
        <Link
          href="/"
          aria-label="返回 ResumeOK 首页"
          className="shrink-0 rounded-lg max-[380px]:[&_.brand]:text-[17px] max-[380px]:[&_.brand-clover]:size-6 focus-visible:outline-2 focus-visible:outline-brand"
        >
          <Brand />
        </Link>
        <span className={ui["tagline"]}>让每一份简历，都更接近 Offer</span>
        <div className={ui["top-actions"]}>
          <button
            className={ui["soft-button"]}
            onClick={() => setPreviewOnly(!previewOnly)}
          >
            <Eye size={17} className="max-[380px]:hidden" />
            {previewOnly ? "编辑" : "预览"}
          </button>
          <button
            className={ui["soft-button"]}
            onClick={() => openPanel("assistant")}
          >
            <Lightbulb size={17} />
            助手
          </button>
          <button
            className={ui["primary-button"]}
            disabled={exporting || !store.ready}
            onClick={download}
          >
            <Download size={17} />
            <span className="hidden sm:inline">
              {exporting ? "导出中…" : "下载简历"}
            </span>
            <span className="sm:hidden">{exporting ? "导出中" : "导出"}</span>
          </button>
          <button
            className={ui["profile-button"]}
            aria-label="打开设置"
            onClick={() => openPanel("settings")}
          >
            <span>{data.name.slice(0, 1) || "我"}</span>
            <ChevronDown size={14} />
          </button>
        </div>
      </header>
      {exportError && (
        <div className={ui["export-error"]} role="alert">
          {exportError}
          <button onClick={() => window.print()}>使用浏览器打印</button>
          <button onClick={() => setExportError("")}>关闭</button>
        </div>
      )}
      <div className={ui["save-status"]} role="status">
        {store.loadError || store.saveStatus}
      </div>
      <div className={ui["workspace-body"]} inert={!store.ready}>
        <nav className={ui["side-nav"]} aria-label="主导航">
          {[
            { id: "editor", label: "编辑简历", icon: PencilLine },
            { id: "templates", label: "模板库", icon: LayoutGrid },
            { id: "assistant", label: "简历优化", icon: Sparkles },
            { id: "resumes", label: "我的简历", icon: Files },
            { id: "settings", label: "设置", icon: Settings },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              aria-current={view === id ? "page" : undefined}
              className={view === id ? "active" : ""}
              onClick={() => {
                setView(id);
                setPreviewOnly(false);
                setEditTarget(null);
              }}
            >
              <Icon size={21} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <aside className={ui["editing-column"]}>
          {view === "editor" ? (
            <EditorPanel
              key={`${store.active.id}-${editTarget}`}
              initialSection={editTarget}
              data={data}
              onChange={setData}
              onAssistant={() => setView("assistant")}
            />
          ) : view === "assistant" ? (
            <AssistantPanel
              data={data}
              onEdit={(section) => {
                setEditTarget(section);
                setView("editor");
              }}
            />
          ) : view === "templates" ? (
            <TemplatePanel data={data} onChange={setData} />
          ) : view === "resumes" ? (
            <LibraryPanel store={store} />
          ) : (
            <SettingsPanel data={data} onChange={setData} />
          )}
        </aside>
        <main className={ui["preview-column"]} aria-label="简历预览">
          <div className={ui["preview-toolbar"]}>
            <span className="sr-only">预览控制</span>
            <div className={ui["toolbar-group"]}>
              <button
                className={ui["icon-button"]}
                aria-label="撤销"
                disabled={!store.past.length}
                onClick={store.undo}
              >
                <Undo2 size={17} />
              </button>
              <button
                className={ui["icon-button"]}
                aria-label="重做"
                disabled={!store.future.length}
                onClick={store.redo}
              >
                <Redo2 size={17} />
              </button>
              <Monitor size={18} className="hidden xl:block" />
              <select
                className={ui["toolbar-pill"]}
                aria-label="预览缩放"
                value={zoom}
                onChange={(e) =>
                  setZoom(
                    e.target.value === "fit" ? "fit" : Number(e.target.value),
                  )
                }
              >
                <option value="fit">自适应</option>
                {[50, 75, 100, 125, 150].map((z) => (
                  <option key={z} value={z}>
                    {z}%
                  </option>
                ))}
              </select>
            </div>
            <div className={ui["toolbar-group"]}>
              <button
                className={ui["secondary-button"]}
                onClick={() => openPanel("templates")}
              >
                <LayoutGrid size={15} />
                模板库
              </button>
              <button
                className={ui["secondary-button"]}
                onClick={() => openPanel("assistant")}
              >
                <Sparkles size={15} />
                简历检查
              </button>
              <span
                className={`${ui["toolbar-pill"]} hidden min-[1450px]:inline-flex`}
              >
                A4 (210 × 297mm)
              </span>
            </div>
          </div>
          <PreviewCanvas zoom={zoom} data={data} previewRef={previewRef} />
        </main>
      </div>
    </div>
  );
}
