"use client";
import { ui } from "@/lib/ui-styles";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  Lightbulb,
  Undo2,
  Redo2,
  LogOut,
} from "lucide-react";
export default function EditorWorkspace({
  initialView = "editor",
  user,
}: {
  initialView?: string;
  user: { id: string; email: string };
}) {
  const router = useRouter();
  const store = useResumeLibrary();
  const data = store.active.data;
  const setData = store.updateData;
  const [view, setView] = useState(initialView);
  const [previewOnly, setPreviewOnly] = useState(false);
  const [editTarget, setEditTarget] = useState<EditorSection | null>(null);
  const [zoom, setZoom] = useState<number | "fit">("fit");
  const [actualScale, setActualScale] = useState(0.85);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const workspaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) {
        setPreviewOnly(true);
        if (workspaceRef.current?.requestFullscreen) {
          await workspaceRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setPreviewOnly(false);
      }
    } catch {
      setPreviewOnly((prev) => !prev);
    }
  }

  function handleZoomIn() {
    const currentPercent = Math.round(actualScale * 100);
    const next = Math.min(200, Math.floor(currentPercent / 10) * 10 + 10);
    setZoom(next);
  }

  function handleZoomOut() {
    const currentPercent = Math.round(actualScale * 100);
    const next = Math.max(30, Math.ceil(currentPercent / 10) * 10 - 10);
    setZoom(next);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }
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
      ref={workspaceRef}
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
            className={`${ui["soft-button"]} hidden max-w-52 lg:inline-flex`}
            aria-label={`当前账号 ${user.email}，打开设置`}
            onClick={() => openPanel("settings")}
          >
            <span className="truncate">{user.email}</span>
            <ChevronDown size={14} className="shrink-0" />
          </button>
          <button
            className={ui["profile-button"]}
            aria-label={`退出账号 ${user.email}`}
            title={`退出 ${user.email}`}
            onClick={() => void logout()}
          >
            <span>{user.email.slice(0, 1).toUpperCase()}</span>
            <LogOut size={14} />
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
              <button
                className={ui["icon-button"]}
                aria-label={
                  isFullscreen || previewOnly ? "退出全屏预览" : "全屏幕预览"
                }
                title={
                  isFullscreen || previewOnly
                    ? "退出全屏预览 (Esc)"
                    : "全屏幕预览"
                }
                onClick={toggleFullscreen}
              >
                {isFullscreen || previewOnly ? (
                  <Minimize2 size={17} />
                ) : (
                  <Maximize2 size={17} />
                )}
              </button>
              <div className="inline-flex items-center rounded-[8px] bg-white border border-[#ebf6ee] p-0.5 shadow-2xs">
                <button
                  className="inline-grid place-items-center size-8 rounded-[6px] text-[#4a805c] hover:bg-[#dff8e7] disabled:opacity-35 disabled:hover:bg-transparent"
                  aria-label="缩小"
                  title="缩小 (Ctrl + 滚轮向下)"
                  disabled={typeof zoom === "number" && zoom <= 30}
                  onClick={handleZoomOut}
                >
                  <ZoomOut size={15} />
                </button>
                <select
                  className="bg-transparent text-[12px] px-1.5 py-1 text-[#1a4026] cursor-pointer focus:outline-none"
                  aria-label="预览缩放比例"
                  value={zoom}
                  onChange={(e) =>
                    setZoom(
                      e.target.value === "fit" ? "fit" : Number(e.target.value),
                    )
                  }
                >
                  <option value="fit">
                    自适应 ({Math.round(actualScale * 100)}%)
                  </option>
                  {[50, 75, 100, 125, 150, 200].map((z) => (
                    <option key={z} value={z}>
                      {z}%
                    </option>
                  ))}
                  {typeof zoom === "number" &&
                    ![50, 75, 100, 125, 150, 200].includes(zoom) && (
                      <option value={zoom}>{zoom}%</option>
                    )}
                </select>
                <button
                  className="inline-grid place-items-center size-8 rounded-[6px] text-[#4a805c] hover:bg-[#dff8e7] disabled:opacity-35 disabled:hover:bg-transparent"
                  aria-label="放大"
                  title="放大 (Ctrl + 滚轮向上)"
                  disabled={typeof zoom === "number" && zoom >= 200}
                  onClick={handleZoomIn}
                >
                  <ZoomIn size={15} />
                </button>
              </div>
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
          <PreviewCanvas
            zoom={zoom}
            data={data}
            previewRef={previewRef}
            onZoomChange={setZoom}
            onScaleChange={setActualScale}
          />
        </main>
      </div>
    </div>
  );
}
