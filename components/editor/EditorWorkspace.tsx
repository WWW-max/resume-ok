"use client";
import { ui } from "@/lib/ui-styles";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
export default function EditorWorkspace({
  initialView = "editor",
  user,
}: {
  initialView?: string;
  user: { id: string; email: string };
}) {
  const router = useRouter();
  const store = useResumeLibrary(user.id);
  const data = store.active.data;
  const setData = store.updateData;
  const [view, setView] = useState(initialView);
  const [previewOnly, setPreviewOnly] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [editorWidth, setEditorWidth] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [editTarget, setEditTarget] = useState<EditorSection | null>(null);
  const [editTrigger, setEditTrigger] = useState(0);
  const [zoom, setZoom] = useState<number | "fit">("fit");
  const [actualScale, setActualScale] = useState(0.85);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const editingColumnRef = useRef<HTMLElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  function startResize(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0 || !editingColumnRef.current) return;
    e.preventDefault();
    const rect = editingColumnRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startWidth = rect.width;
    setIsResizing(true);

    function onPointerMove(moveEvent: PointerEvent) {
      const deltaX = moveEvent.clientX - startX;
      const maxWidth = Math.max(320, Math.min(760, window.innerWidth - 380));
      const nextWidth = Math.round(
        Math.min(maxWidth, Math.max(280, startWidth + deltaX)),
      );
      setEditorWidth(nextWidth);
    }

    function onPointerUp() {
      setIsResizing(false);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!userMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

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
    await store.flushBeforeLogout();
    await fetch("/api/auth/logout", { method: "POST" });
    setConfirmLogout(false);
    setUserMenuOpen(false);
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
      className={`${ui["workspace"]} ${previewOnly ? "preview-only" : ""} ${sidebarCollapsed ? "sidebar-collapsed" : ""} ${isResizing ? "select-none cursor-ew-resize" : ""}`}
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
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
              onClick={() => setUserMenuOpen((prev) => !prev)}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#d8efe1] bg-[#f4fbf6] pl-1.5 pr-3 py-1 text-xs sm:text-sm font-medium text-[#1a4026] transition-colors hover:border-[#65d995] hover:bg-[#e7faed]"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#d7f5e3] text-xs font-bold text-[#168347]">
                {user.email.slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden max-w-40 truncate sm:inline">
                {user.email}
              </span>
              <ChevronDown
                size={14}
                className={`shrink-0 text-[#4a805c] transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
              />
            </button>
            {userMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+8px)] z-50 w-60 rounded-xl border border-[#d8efe1] bg-white p-2 shadow-[0_10px_30px_#10391d1f]"
              >
                <div className="flex items-center gap-2.5 border-b border-[#ebf6ee] px-2.5 py-2.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#e0f5e8] text-sm font-bold text-[#168347]">
                    {user.email.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-muted-ink">当前登录账号</p>
                    <p className="truncate text-xs font-semibold text-ink">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="mt-1 grid gap-0.5">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      openPanel("resumes");
                      setUserMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-ink transition-colors hover:bg-[#eef9f3] hover:text-[#08a644]"
                  >
                    <Files size={14} className="text-[#388855]" />
                    我的简历
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      openPanel("settings");
                      setUserMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-ink transition-colors hover:bg-[#eef9f3] hover:text-[#08a644]"
                  >
                    <Settings size={14} className="text-[#388855]" />
                    排版设置
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setConfirmLogout(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-[#bd554d] transition-colors hover:bg-red-50"
                  >
                    <LogOut size={14} />
                    退出登录
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      {confirmLogout && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="editor-logout-dialog-title"
          className="fixed inset-0 z-50 grid place-items-center bg-black/25 p-4 backdrop-blur-[1px] print:hidden"
          onClick={() => setConfirmLogout(false)}
        >
          <div
            className="w-full max-w-xs rounded-2xl border border-[#d8efe1] bg-white p-5 shadow-[0_16px_40px_#10391d26]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="editor-logout-dialog-title"
              className="text-base font-semibold text-ink"
            >
              确认退出登录？
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-muted-ink">
              当前账号为 <span className="font-medium text-ink">{user.email}</span>
              ，退出后需重新登录才能继续编辑您的简历。
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmLogout(false)}
                className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[#d8efe1] bg-white px-3.5 text-xs font-medium text-ink transition-colors hover:bg-[#f4fbf6]"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => void logout()}
                className="inline-flex min-h-9 items-center justify-center rounded-lg bg-[#bd554d] px-3.5 text-xs font-medium text-white transition-colors hover:bg-[#a6443d]"
              >
                确认退出
              </button>
            </div>
          </div>
        </div>
      )}
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
      <div
        className={`${ui["workspace-body"]} ${isResizing ? "resizing" : ""}`}
        style={
          editorWidth
            ? ({ "--editor-width": `${editorWidth}px` } as CSSProperties)
            : undefined
        }
        inert={!store.ready}
      >
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
              type="button"
              aria-current={view === id ? "page" : undefined}
              aria-label={label}
              title={sidebarCollapsed ? label : undefined}
              className={`nav-item ${view === id ? "active" : ""}`}
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
          <button
            type="button"
            aria-expanded={!sidebarCollapsed}
            aria-label={sidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
            title={sidebarCollapsed ? "展开侧边栏" : "收起侧边栏"}
            className="absolute top-1/2 -right-3 z-20 grid size-6 -translate-y-1/2 place-items-center rounded-full border border-[#d6ecdf] bg-white text-[#386647] shadow-[0_2px_6px_#10391d14] transition-colors hover:border-[#85d7a6] hover:bg-[#eefbf3] hover:text-[#08a644] max-[900px]:hidden"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
          >
            {sidebarCollapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronLeft size={14} />
            )}
          </button>
        </nav>
        <aside ref={editingColumnRef} className={ui["editing-column"]}>
          {view === "editor" ? (
            <EditorPanel
              key={`${store.active.id}-${editTarget}-${editTrigger}`}
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
                setEditTrigger((n) => n + 1);
                setView("editor");
              }}
            />
          ) : view === "templates" ? (
            <TemplatePanel data={data} onChange={setData} />
          ) : view === "resumes" ? (
            <LibraryPanel
              store={store}
              onEdit={() => {
                setView("editor");
                setPreviewOnly(false);
                setEditTarget(null);
              }}
            />
          ) : (
            <SettingsPanel data={data} onChange={setData} />
          )}
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="左右拖动调整编辑区宽度"
            title="左右拖动调整宽度，双击恢复默认"
            tabIndex={0}
            onPointerDown={startResize}
            onDoubleClick={() => setEditorWidth(null)}
            onKeyDown={(e) => {
              if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
              e.preventDefault();
              const current =
                editorWidth ??
                editingColumnRef.current?.getBoundingClientRect().width ??
                428;
              const delta = e.key === "ArrowRight" ? 16 : -16;
              const maxWidth = Math.max(
                320,
                Math.min(760, window.innerWidth - 380),
              );
              setEditorWidth(Math.min(maxWidth, Math.max(280, current + delta)));
            }}
            className="group absolute top-0 -right-1.5 bottom-0 z-20 w-3 cursor-ew-resize select-none touch-none max-[900px]:hidden"
          >
            <span
              className={`pointer-events-none absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 transition-colors ${
                isResizing
                  ? "bg-[#0cb449]"
                  : "bg-transparent group-hover:bg-[#37ba58]/70"
              }`}
            />
          </div>
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
            onSelectSection={(section) => {
              setEditTarget(section);
              setEditTrigger((n) => n + 1);
              setView("editor");
              setPreviewOnly(false);
            }}
          />
        </main>
      </div>
    </div>
  );
}
