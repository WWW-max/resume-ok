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
  FileText,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  Languages,
  Upload,
  Globe,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";
import type { ExportFormat } from "@/lib/export-pdf";
import type { ResumeData } from "@/lib/resume-data";
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
  const [translating, setTranslating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<ExportFormat | null>(
    null,
  );
  const [downloadFilename, setDownloadFilename] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [onlineSlugs, setOnlineSlugs] = useState<Record<string, string>>({});
  const [onlineModalOpen, setOnlineModalOpen] = useState(false);
  const [onlineSlugInput, setOnlineSlugInput] = useState("");
  const [onlineSaving, setOnlineSaving] = useState(false);
  const [onlineError, setOnlineError] = useState("");
  const [copiedOnlineUrl, setCopiedOnlineUrl] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const editingColumnRef = useRef<HTMLElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

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
    let active = true;
    fetch("/api/online-resume")
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (
          payload: {
            items?: Array<{ documentId: string; slug: string; enabled: boolean }>;
          } | null,
        ) => {
          if (!active || !payload?.items) return;
          const map: Record<string, string> = {};
          for (const item of payload.items) {
            if (item.enabled && item.documentId && item.slug) {
              map[item.documentId] = item.slug;
            }
          }
          setOnlineSlugs(map);
        },
      )
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!userMenuOpen && !downloadMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
      if (
        downloadMenuRef.current &&
        !downloadMenuRef.current.contains(e.target as Node)
      ) {
        setDownloadMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen, downloadMenuOpen]);

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
  function openDownloadDialog(format: ExportFormat) {
    setDownloadMenuOpen(false);
    const defaultName =
      store.active.name.trim() ||
      (data.name.trim() ? `${data.name.trim()}_简历` : "我的简历");
    setDownloadFilename(defaultName);
    setDownloadFormat(format);
  }

  async function confirmDownload() {
    if (!downloadFormat || exporting) return;
    const format = downloadFormat;
    const finalName =
      downloadFilename.trim() ||
      store.active.name.trim() ||
      (data.name.trim() ? `${data.name.trim()}_简历` : "我的简历");
    if (finalName !== store.active.name) {
      store.rename(finalName);
    }
    setDownloadFormat(null);
    setExporting(true);
    setExportError("");
    try {
      const {
        exportResumePdf,
        exportResumeWord,
        exportResumeImage,
        exportResumeMarkdown,
      } = await import("@/lib/export-pdf");
      if (format === "word") {
        exportResumeWord(data, finalName);
      } else if (format === "markdown") {
        exportResumeMarkdown(data, finalName);
      } else {
        if (!previewRef.current) return;
        if (format === "pdf") {
          await exportResumePdf(previewRef.current, finalName, data);
        } else {
          await exportResumeImage(previewRef.current, finalName);
        }
      }
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : "导出失败，请重试或使用打印。",
      );
    } finally {
      setExporting(false);
    }
  }
  async function handleTranslateToEnglish() {
    if (translating || !store.ready) return;
    if (store.library.documents.length >= 100) {
      setExportError(
        "简历总数已达上限（100 份），请先在「我的简历」中清理旧简历。",
      );
      return;
    }
    setTranslating(true);
    setExportError("");
    try {
      const { translateResumeToEnglish } =
        await import("@/lib/translate-resume");
      const translated = await translateResumeToEnglish(data);
      const baseName = (
        store.active.name.trim() ||
        data.name.trim() ||
        "我的简历"
      ).replace(/\s*\(英文版\)$/, "");
      store.addDocument(`${baseName} (英文版)`, translated);
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : "简历翻译失败，请稍后重试。",
      );
    } finally {
      setTranslating(false);
    }
  }
  async function handleImportResumeFile(file: File) {
    if (importing || !store.ready) return;
    if (store.library.documents.length >= 100) {
      setExportError(
        "简历总数已达上限（100 份），请先在「我的简历」中清理旧简历。",
      );
      return;
    }
    setImporting(true);
    setExportError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });
      const payload = (await res.json()) as {
        error?: string | { code?: string; message?: string };
        name?: string;
        data?: ResumeData;
      };
      if (!res.ok || !payload.data) {
        const errMsg =
          typeof payload.error === "string"
            ? payload.error
            : payload.error?.message || "简历解析失败，请稍后重试。";
        throw new Error(errMsg);
      }
      store.addDocument(payload.name || "导入的简历", payload.data);
      setView("editor");
      setPreviewOnly(false);
      setEditTarget(null);
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : "简历导入失败，请稍后重试。",
      );
    } finally {
      setImporting(false);
    }
  }
  const activePublishedSlug = onlineSlugs[store.active.id] ?? "";
  const siteOrigin =
    typeof window !== "undefined" ? window.location.origin : "https://resumeOK.cn";

  function openOnlineResumeModal() {
    const defaultSlug = (
      activePublishedSlug ||
      store.active.name.trim() ||
      data.name.trim() ||
      "我的简历"
    )
      .replace(/[\r\n\t/\\?#%&]+/g, "-")
      .replace(/\s+/g, "-");
    setOnlineSlugInput(defaultSlug);
    setOnlineError("");
    setCopiedOnlineUrl(false);
    setOnlineModalOpen(true);
  }

  async function handlePublishOnlineResume() {
    if (onlineSaving || !store.ready) return;
    const cleanSlug = onlineSlugInput
      .trim()
      .replace(/[\r\n\t/\\?#%&]+/g, "-")
      .replace(/\s+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!cleanSlug) {
      setOnlineError("请输入在线简历链接后缀名称（例如：张三）。");
      return;
    }
    setOnlineSaving(true);
    setOnlineError("");
    try {
      const res = await fetch("/api/online-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: store.active.id,
          slug: cleanSlug,
          title: store.active.name.trim() || data.name.trim() || cleanSlug,
          data,
        }),
      });
      const payload = (await res.json()) as {
        error?: string | { code?: string; message?: string };
        item?: { slug: string; documentId: string };
      };
      if (!res.ok || !payload.item) {
        const msg =
          typeof payload.error === "string"
            ? payload.error
            : payload.error?.message || "生成在线简历失败，请稍后重试。";
        throw new Error(msg);
      }
      const savedSlug = payload.item.slug;
      setOnlineSlugs((prev) => ({
        ...prev,
        [store.active.id]: savedSlug,
      }));
      setOnlineSlugInput(savedSlug);
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard
          .writeText(`${window.location.origin}/online-resume/${savedSlug}`)
          .catch(() => {});
        setCopiedOnlineUrl(true);
      }
    } catch (error) {
      setOnlineError(
        error instanceof Error ? error.message : "生成在线简历失败，请稍后重试。",
      );
    } finally {
      setOnlineSaving(false);
    }
  }

  async function handleUnpublishOnlineResume() {
    if (onlineSaving || !activePublishedSlug) return;
    setOnlineSaving(true);
    setOnlineError("");
    try {
      const res = await fetch("/api/online-resume", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: store.active.id }),
      });
      if (!res.ok) {
        throw new Error("关闭在线简历失败，请稍后重试。");
      }
      setOnlineSlugs((prev) => {
        const next = { ...prev };
        delete next[store.active.id];
        return next;
      });
      setCopiedOnlineUrl(false);
    } catch (error) {
      setOnlineError(
        error instanceof Error ? error.message : "关闭在线简历失败。",
      );
    } finally {
      setOnlineSaving(false);
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
          <input
            ref={importInputRef}
            type="file"
            accept=".pdf,.md,.txt,application/pdf,text/markdown,text/plain"
            className="hidden"
            aria-label="导入 PDF 或 Markdown 简历文件"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) {
                void handleImportResumeFile(file);
              }
            }}
          />
          <button
            type="button"
            className={ui["soft-button"]}
            disabled={importing || !store.ready}
            onClick={() => importInputRef.current?.click()}
            title="支持上传 PDF (.pdf)、Markdown (.md) 或文本 (.txt) 简历自动解析生成新简历"
          >
            <Upload size={17} />
            <span>{importing ? "解析中…" : "导入简历"}</span>
          </button>
          <button
            type="button"
            className={ui["soft-button"]}
            disabled={translating || !store.ready}
            onClick={() => void handleTranslateToEnglish()}
            title="基于当前简历自动新建一份英文版副本（保留原中文简历）"
          >
            <Languages size={17} />
            <span>{translating ? "翻译中…" : "译为英文"}</span>
          </button>
          <button
            type="button"
            className={ui["soft-button"]}
            disabled={!store.ready}
            onClick={openOnlineResumeModal}
            title="生成在线简历专属链接，方便 HR 随时在电脑或手机上预览与下载 PDF"
          >
            <Globe size={17} className={activePublishedSlug ? "text-[#0cb449]" : ""} />
            <span>在线简历</span>
            {activePublishedSlug && (
              <span
                className="size-2 rounded-full bg-[#0cb449]"
                title="已开启在线简历访问"
              />
            )}
          </button>
          <div className="relative" ref={downloadMenuRef}>
            <button
              type="button"
              className={ui["primary-button"]}
              aria-expanded={downloadMenuOpen}
              aria-haspopup="menu"
              disabled={exporting || !store.ready}
              onClick={() => setDownloadMenuOpen((prev) => !prev)}
            >
              <Download size={17} />
              <span className="hidden sm:inline">
                {exporting ? "导出中…" : "下载简历"}
              </span>
              <span className="sm:hidden">{exporting ? "导出中" : "导出"}</span>
              <ChevronDown
                size={14}
                className={`shrink-0 transition-transform ${downloadMenuOpen ? "rotate-180" : ""}`}
              />
            </button>
            {downloadMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+8px)] z-50 w-52 rounded-xl border border-[#d8efe1] bg-white p-1.5 shadow-[0_10px_30px_#10391d1f]"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => openDownloadDialog("pdf")}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[#eef9f3]"
                >
                  <FileText size={16} className="shrink-0 text-[#0cb449]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-ink">
                      下载 PDF (.pdf)
                    </p>
                    <p className="text-[11px] text-muted-ink">
                      标准 A4 排版，推荐投递
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => openDownloadDialog("word")}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[#eef9f3]"
                >
                  <FileSpreadsheet
                    size={16}
                    className="shrink-0 text-[#0cb449]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-ink">
                      下载 Word (.doc)
                    </p>
                    <p className="text-[11px] text-muted-ink">
                      支持 Word / WPS 编辑
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => openDownloadDialog("image")}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[#eef9f3]"
                >
                  <ImageIcon size={16} className="shrink-0 text-[#0cb449]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-ink">
                      下载图片 (.png)
                    </p>
                    <p className="text-[11px] text-muted-ink">
                      高清长图，方便手机查看
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => openDownloadDialog("markdown")}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[#eef9f3]"
                >
                  <FileCode size={16} className="shrink-0 text-[#0cb449]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-ink">
                      下载 Markdown (.md)
                    </p>
                    <p className="text-[11px] text-muted-ink">
                      纯文本，便于归档与编辑
                    </p>
                  </div>
                </button>
              </div>
            )}
          </div>
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
              当前账号为{" "}
              <span className="font-medium text-ink">{user.email}</span>
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
      {downloadFormat && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="download-dialog-title"
          className="fixed inset-0 z-50 grid place-items-center bg-black/25 p-4 backdrop-blur-[1px] print:hidden"
          onClick={() => setDownloadFormat(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[#d8efe1] bg-white p-5 shadow-[0_16px_40px_#10391d26]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="download-dialog-title"
              className="text-base font-semibold text-ink"
            >
              {downloadFormat === "pdf"
                ? "下载 PDF 简历"
                : downloadFormat === "word"
                  ? "下载 Word 简历"
                  : downloadFormat === "markdown"
                    ? "下载 Markdown 简历"
                    : "下载简历图片"}
            </h2>
            <p className="mt-1.5 text-xs text-muted-ink">
              可修改导出文件名称，同时自动同步至当前简历名称
            </p>
            <div className="mt-3.5">
              <label
                htmlFor="download-filename-input"
                className="mb-1.5 block text-xs font-medium text-[#466e53]"
              >
                简历名称
              </label>
              <div className="flex items-center overflow-hidden rounded-lg border border-[#d2ebda] bg-white focus-within:border-[#19af60] focus-within:ring-2 focus-within:ring-[#19af60]/20">
                <input
                  id="download-filename-input"
                  type="text"
                  autoFocus
                  maxLength={80}
                  value={downloadFilename}
                  placeholder="请输入简历名称"
                  onChange={(e) => setDownloadFilename(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void confirmDownload();
                    } else if (e.key === "Escape") {
                      setDownloadFormat(null);
                    }
                  }}
                  className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-[#1a4026] placeholder:text-[#93b39e] focus:outline-none"
                />
                <span className="shrink-0 border-l border-[#ebf6ee] bg-[#f4fbf6] px-2.5 py-2 text-xs font-medium text-[#4a805c]">
                  {downloadFormat === "pdf"
                    ? ".pdf"
                    : downloadFormat === "word"
                      ? ".doc"
                      : downloadFormat === "markdown"
                        ? ".md"
                        : ".png"}
                </span>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDownloadFormat(null)}
                className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[#d8efe1] bg-white px-3.5 text-xs font-medium text-ink transition-colors hover:bg-[#f4fbf6]"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => void confirmDownload()}
                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-brand px-4 text-xs font-medium text-white transition-colors hover:bg-brand-dark"
              >
                <Download size={14} />
                确认下载
              </button>
            </div>
          </div>
        </div>
      )}
      {onlineModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="online-resume-dialog-title"
          className="fixed inset-0 z-50 grid place-items-center bg-black/25 p-4 backdrop-blur-[1px] print:hidden"
          onClick={() => setOnlineModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[#d8efe1] bg-white p-5 shadow-[0_16px_40px_#10391d26]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-[#e8f8ee] text-[#0cb449]">
                  <Globe size={18} />
                </span>
                <div>
                  <h2
                    id="online-resume-dialog-title"
                    className="text-base font-semibold text-ink"
                  >
                    在线简历分享链接
                  </h2>
                  <p className="text-[11px] text-muted-ink">
                    HR 打开链接即可在电脑或手机端直接浏览 A4 简历并下载 PDF
                  </p>
                </div>
              </div>
              {activePublishedSlug && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f8ee] px-2.5 py-0.5 text-[11px] font-medium text-[#118a43]">
                  <span className="size-1.5 rounded-full bg-[#0cb449]" />
                  已发布
                </span>
              )}
            </div>

            <div className="mt-4">
              <label
                htmlFor="online-resume-slug-input"
                className="mb-1.5 block text-xs font-medium text-[#466e53]"
              >
                专属链接地址（支持中文姓名或自定义后缀）
              </label>
              <div className="flex items-center overflow-hidden rounded-lg border border-[#d2ebda] bg-white focus-within:border-[#19af60] focus-within:ring-2 focus-within:ring-[#19af60]/20">
                <span className="shrink-0 select-none border-r border-[#ebf6ee] bg-[#f4fbf6] px-2.5 py-2 text-xs text-[#4a805c]">
                  {siteOrigin}/online-resume/
                </span>
                <input
                  id="online-resume-slug-input"
                  type="text"
                  autoFocus
                  maxLength={80}
                  value={onlineSlugInput}
                  placeholder="例如：张三"
                  onChange={(e) => {
                    setOnlineSlugInput(e.target.value);
                    setCopiedOnlineUrl(false);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handlePublishOnlineResume();
                    } else if (e.key === "Escape") {
                      setOnlineModalOpen(false);
                    }
                  }}
                  className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-sm font-medium text-[#1a4026] placeholder:text-[#93b39e] focus:outline-none"
                />
              </div>
            </div>

            {activePublishedSlug && (
              <div className="mt-3.5 rounded-xl border border-[#d8efe1] bg-[#f6fcf8] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-medium text-[#153a22]">
                    {siteOrigin}/online-resume/{activePublishedSlug}
                  </p>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={async () => {
                        const url = `${siteOrigin}/online-resume/${activePublishedSlug}`;
                        await navigator.clipboard.writeText(url).catch(() => {});
                        setCopiedOnlineUrl(true);
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-[#cde9d7] bg-white px-2 py-1 text-[11px] font-medium text-[#168347] transition-colors hover:bg-[#e8f8ee]"
                    >
                      {copiedOnlineUrl ? <Check size={12} /> : <Copy size={12} />}
                      {copiedOnlineUrl ? "已复制" : "复制链接"}
                    </button>
                    <a
                      href={`/online-resume/${encodeURIComponent(activePublishedSlug)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-[#cde9d7] bg-white px-2 py-1 text-[11px] font-medium text-[#168347] transition-colors hover:bg-[#e8f8ee]"
                    >
                      <ExternalLink size={12} />
                      打开预览
                    </a>
                  </div>
                </div>
                <p className="mt-1.5 text-[11px] text-muted-ink">
                  您在编辑器中修改简历后，该在线链接会自动同步最新内容。
                </p>
              </div>
            )}

            {onlineError && (
              <p className="mt-2.5 text-xs text-red-600" role="alert">
                {onlineError}
              </p>
            )}

            <div className="mt-5 flex items-center justify-between gap-2">
              {activePublishedSlug ? (
                <button
                  type="button"
                  disabled={onlineSaving}
                  onClick={() => void handleUnpublishOnlineResume()}
                  className="inline-flex min-h-9 items-center justify-center rounded-lg px-2.5 text-xs font-medium text-[#bd554d] transition-colors hover:bg-red-50"
                >
                  关闭在线访问
                </button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOnlineModalOpen(false)}
                  className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[#d8efe1] bg-white px-3.5 text-xs font-medium text-ink transition-colors hover:bg-[#f4fbf6]"
                >
                  关闭
                </button>
                <button
                  type="button"
                  disabled={onlineSaving}
                  onClick={() => void handlePublishOnlineResume()}
                  className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-brand px-4 text-xs font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
                >
                  <Globe size={14} />
                  {onlineSaving
                    ? "保存中…"
                    : activePublishedSlug
                      ? "更新并复制链接"
                      : "生成并复制链接"}
                </button>
              </div>
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
              importing={importing}
              onImportFile={(file) => void handleImportResumeFile(file)}
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
              setEditorWidth(
                Math.min(maxWidth, Math.max(280, current + delta)),
              );
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
