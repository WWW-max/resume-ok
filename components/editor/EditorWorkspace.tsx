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
import {
  PreviewCanvas,
  computePreviewPages,
  measureResumeContentBottom,
} from "@/components/preview/PreviewCanvas";
import { SettingsPanel } from "@/components/editor/SettingsPanel";
import { AssistantPanel } from "@/components/editor/AssistantPanel";
import { TemplatePanel } from "@/components/editor/TemplatePanel";
import { Brand } from "@/components/Brand";
import {
  defaultAppearance,
  type ResumeAppearance,
} from "@/lib/resume-appearance";
import {
  Download,
  Eye,
  PencilLine,
  LayoutGrid,
  Sparkles,
  WandSparkles,
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
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileText,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  Languages,
  Upload,
  Globe,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Crown,
} from "lucide-react";
import type { ExportFormat } from "@/lib/export-pdf";
import type { ResumeData } from "@/lib/resume-data";
import { encodeSourceTag } from "@/lib/online-resume-token";
import { MembershipModal } from "@/components/editor/MembershipModal";
import {
  canExportFormat,
  canUseFeature,
  FEATURE_UPGRADE_PROMPTS,
  formatMembershipExpiry,
  type MembershipPlan,
  type MembershipStatus,
} from "@/lib/membership";

interface OnlineResumeViewLog {
  id: string;
  sourceTag: string;
  deviceLabel: string;
  ipAddress: string;
  downloadedPdf: boolean;
  viewedAt: string;
}

interface OnlineResumeClientInfo {
  documentId: string;
  slug: string;
  enabled: boolean;
  resumeData?: ResumeData | null;
  totalViews: number;
  totalDownloads: number;
  recentViews: OnlineResumeViewLog[];
}
export default function EditorWorkspace({
  initialView = "editor",
  user,
}: {
  initialView?: string;
  user: {
    id: string;
    email: string;
    membershipPlan?: MembershipPlan;
    membershipExpiresAt?: string | null;
    isPro?: boolean;
    planLabel?: string;
  };
}) {
  const router = useRouter();
  const store = useResumeLibrary(user.id);
  const data = store.active.data;
  const setData = store.updateData;
  const [membership, setMembership] = useState<MembershipStatus>(() => ({
    plan: user.membershipPlan ?? "free",
    expiresAt: user.membershipExpiresAt ?? null,
    isPro: Boolean(user.isPro),
    planLabel: user.planLabel ?? "免费版",
  }));
  const [membershipModalOpen, setMembershipModalOpen] = useState(false);
  const [membershipModalReason, setMembershipModalReason] = useState("");

  function requirePro(reason: string) {
    setMembershipModalReason(reason);
    setMembershipModalOpen(true);
  }
  const [view, setView] = useState(initialView);
  const [previewOnly, setPreviewOnly] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [editorWidth, setEditorWidth] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [editTarget, setEditTarget] = useState<EditorSection | null>(null);
  const [editTrigger, setEditTrigger] = useState(0);
  const [zoom, setZoom] = useState<number | "fit">("fit");
  const [actualScale, setActualScale] = useState(0.85);
  const [pageCount, setPageCount] = useState(1);
  const [smartFitNotice, setSmartFitNotice] = useState<{
    type: "success" | "warning" | "info";
    message: string;
  } | null>(null);
  const smartFitTimerRef = useRef<number | null>(null);
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
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState("");
  const [onlineRecords, setOnlineRecords] = useState<
    Record<string, OnlineResumeClientInfo>
  >({});
  const [onlineModalOpen, setOnlineModalOpen] = useState(false);
  const [onlineSlugInput, setOnlineSlugInput] = useState("");
  const [onlineSourceTagInput, setOnlineSourceTagInput] = useState("");
  const [onlineSaving, setOnlineSaving] = useState(false);
  const [onlineRefreshing, setOnlineRefreshing] = useState(false);
  const [onlineError, setOnlineError] = useState("");
  const [copiedOnlineUrl, setCopiedOnlineUrl] = useState(false);
  const [confirmOnlineAction, setConfirmOnlineAction] = useState<
    "publish" | "unpublish" | null
  >(null);
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

  async function refreshOnlineResumes() {
    setOnlineRefreshing(true);
    try {
      const res = await fetch("/api/online-resume");
      if (!res.ok) return;
      const payload = (await res.json()) as {
        items?: OnlineResumeClientInfo[];
      } | null;
      if (!payload?.items) return;
      const map: Record<string, OnlineResumeClientInfo> = {};
      for (const item of payload.items) {
        if (item.enabled && item.documentId && item.slug) {
          map[item.documentId] = item;
        }
      }
      setOnlineRecords(map);
    } catch {
      // ignore network error
    } finally {
      setOnlineRefreshing(false);
    }
  }

  useEffect(() => {
    let active = true;
    const poll = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      fetch("/api/online-resume")
        .then((res) => (res.ok ? res.json() : null))
        .then((payload: { items?: OnlineResumeClientInfo[] } | null) => {
          if (!active || !payload?.items) return;
          const map: Record<string, OnlineResumeClientInfo> = {};
          for (const item of payload.items) {
            if (item.enabled && item.documentId && item.slug) {
              map[item.documentId] = item;
            }
          }
          setOnlineRecords(map);
        })
        .catch(() => {});
    };

    poll();
    if (!onlineModalOpen) {
      return () => {
        active = false;
      };
    }

    const timer = window.setInterval(poll, 4000);
    window.addEventListener("focus", poll);
    document.addEventListener("visibilitychange", poll);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", poll);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [onlineModalOpen]);

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

  async function handleDeleteAccount() {
    if (deletingAccount || deleteConfirmText.trim() !== "确认注销") return;
    setDeletingAccount(true);
    setDeleteAccountError("");
    store.cancelPendingSaves();
    try {
      const res = await fetch("/api/auth/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: deleteConfirmText.trim() }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => ({}))) as {
          error?: { message?: string };
        };
        throw new Error(payload.error?.message || "注销账号失败，请稍后重试。");
      }
      setConfirmDeleteAccount(false);
      setUserMenuOpen(false);
      router.replace("/login");
      router.refresh();
    } catch (error) {
      setDeleteAccountError(
        error instanceof Error ? error.message : "注销账号失败，请稍后重试。",
      );
    } finally {
      setDeletingAccount(false);
    }
  }
  function openDownloadDialog(format: ExportFormat) {
    setDownloadMenuOpen(false);
    if (!canExportFormat(membership.plan, format)) {
      const formatLabel =
        format === "pdf"
          ? "PDF (.pdf)"
          : format === "word"
            ? "Word (.doc)"
            : format === "image"
              ? "高清长图 (.png)"
              : "Markdown (.md)";
      requirePro(
        `导出 ${formatLabel} 为会员专享功能，升级后即可无限制导出全部格式。`,
      );
      return;
    }
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
    if (!canUseFeature(membership.plan, "translateEnglish")) {
      requirePro(FEATURE_UPGRADE_PROMPTS.translateEnglish);
      return;
    }
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
    if (!canUseFeature(membership.plan, "importResume")) {
      requirePro(FEATURE_UPGRADE_PROMPTS.importResume);
      return;
    }
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
  const activeOnlineInfo = onlineRecords[store.active.id];
  const activePublishedSlug = activeOnlineInfo?.slug ?? "";
  const hasUnpublishedChanges = Boolean(
    activeOnlineInfo &&
      activeOnlineInfo.resumeData &&
      JSON.stringify(activeOnlineInfo.resumeData) !== JSON.stringify(data),
  );
  const siteOrigin =
    typeof window !== "undefined" ? window.location.origin : "https://resumeOK.cn";

  function buildOnlineShareUrl(slug: string, sourceTag: string) {
    const base = `${siteOrigin}/online-resume/${slug}`;
    const token = encodeSourceTag(sourceTag);
    return token ? `${base}?t=${token}` : base;
  }

  function openOnlineResumeModal() {
    if (
      !canUseFeature(membership.plan, "shareOnlineResume") &&
      !activePublishedSlug
    ) {
      requirePro(FEATURE_UPGRADE_PROMPTS.shareOnlineResume);
      return;
    }
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
    setConfirmOnlineAction(null);
    setOnlineModalOpen(true);
    void refreshOnlineResumes();
  }

  function getCleanOnlineSlug() {
    return onlineSlugInput
      .trim()
      .replace(/[\r\n\t/\\?#%&]+/g, "-")
      .replace(/\s+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function requestPublishOnlineResume() {
    if (onlineSaving || !store.ready) return;
    const cleanSlug = getCleanOnlineSlug();
    if (!cleanSlug) {
      setOnlineError("请输入在线简历链接后缀名称（例如：张三）。");
      return;
    }
    setOnlineError("");
    setConfirmOnlineAction("publish");
  }

  async function handlePublishOnlineResume() {
    if (onlineSaving || !store.ready) return;
    const cleanSlug = getCleanOnlineSlug();
    if (!cleanSlug) {
      setOnlineError("请输入在线简历链接后缀名称（例如：张三）。");
      setConfirmOnlineAction(null);
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
        item?: OnlineResumeClientInfo;
      };
      if (!res.ok || !payload.item) {
        const msg =
          typeof payload.error === "string"
            ? payload.error
            : payload.error?.message || "发布在线简历失败，请稍后重试。";
        throw new Error(msg);
      }
      const savedItem = payload.item;
      setOnlineRecords((prev) => ({
        ...prev,
        [store.active.id]: savedItem,
      }));
      setOnlineSlugInput(savedItem.slug);
      setConfirmOnlineAction(null);
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard
          .writeText(buildOnlineShareUrl(savedItem.slug, onlineSourceTagInput))
          .catch(() => {});
        setCopiedOnlineUrl(true);
      }
    } catch (error) {
      setOnlineError(
        error instanceof Error ? error.message : "发布在线简历失败，请稍后重试。",
      );
      setConfirmOnlineAction(null);
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
      setOnlineRecords((prev) => {
        const next = { ...prev };
        delete next[store.active.id];
        return next;
      });
      setCopiedOnlineUrl(false);
      setConfirmOnlineAction(null);
    } catch (error) {
      setOnlineError(
        error instanceof Error ? error.message : "关闭在线简历失败。",
      );
      setConfirmOnlineAction(null);
    } finally {
      setOnlineSaving(false);
    }
  }
  function openPanel(panel: string) {
    setView(panel);
    setPreviewOnly(false);
  }
  const previewRef = useRef<HTMLDivElement>(null);

  function showSmartFitFeedback(
    type: "success" | "warning" | "info",
    message: string,
  ) {
    if (smartFitTimerRef.current) {
      window.clearTimeout(smartFitTimerRef.current);
    }
    setSmartFitNotice({ type, message });
    smartFitTimerRef.current = window.setTimeout(
      () => {
        setSmartFitNotice(null);
      },
      type === "warning" ? 6500 : 4500,
    );
  }

  function handleSmartOnePage() {
    const paper = previewRef.current;
    if (!paper) return;
    const A4_HEIGHT = 1123;
    const MIN_BALANCED_MARGIN = 28;
    const cur: ResumeAppearance = { ...defaultAppearance, ...data.appearance };
    const initialSlices = computePreviewPages(
      paper,
      cur.paddingTop,
      cur.paddingBottom,
    );
    const initialBottom = measureResumeContentBottom(paper, cur.paddingBottom);
    const initialBottomWhitespace = A4_HEIGHT - initialBottom;

    if (
      initialSlices.length <= 1 &&
      initialBottomWhitespace >= MIN_BALANCED_MARGIN &&
      cur.paddingTop >= MIN_BALANCED_MARGIN &&
      Math.abs(cur.paddingTop - initialBottomWhitespace) <= 10
    ) {
      showSmartFitFeedback(
        "info",
        "当前简历已在 1 页 A4 范围内且上下留白协调，无需调整间距。",
      );
      return;
    }

    const spacingOrder: Array<ResumeAppearance["spacing"]> =
      cur.spacing === "comfortable"
        ? ["comfortable", "compact", "tight"]
        : cur.spacing === "compact"
          ? ["compact", "tight"]
          : ["tight"];

    const baseHPad = Math.max(24, Math.min(cur.paddingLeft, cur.paddingRight));
    const hPadSteps = Array.from(
      new Set([baseHPad, 34, 30, 26].filter((h) => h <= baseHPad && h >= 24)),
    ).sort((a, b) => b - a);

    // 候选配置：优先调整内部模块/行间距（spacing）与左右边距，上下边距通过实际内容高度自动居中配平
    const rawCandidates: Array<{
      spacing: ResumeAppearance["spacing"];
      fontSize: number;
      hPad: number;
    }> = [];

    for (const sp of spacingOrder) {
      for (const hPad of hPadSteps) {
        rawCandidates.push({ spacing: sp, fontSize: cur.fontSize, hPad });
      }
    }

    const fontSteps = [cur.fontSize - 0.5, cur.fontSize - 1, cur.fontSize - 1.5]
      .map((f) => Math.round(f * 2) / 2)
      .filter((f) => f >= 10.5);

    for (const fs of fontSteps) {
      for (const sp of ["compact", "tight"] as const) {
        for (const hPad of [Math.min(baseHPad, 32), 28, 24]) {
          rawCandidates.push({ spacing: sp, fontSize: fs, hPad });
        }
      }
    }

    const origClasses = [
      "spacing-comfortable",
      "spacing-compact",
      "spacing-tight",
    ].filter((cls) => paper.classList.contains(cls));
    const origFontSize = paper.style.getPropertyValue("--resume-font-size");
    const origPadTop = paper.style.paddingTop;
    const origPadRight = paper.style.paddingRight;
    const origPadBottom = paper.style.paddingBottom;
    const origPadLeft = paper.style.paddingLeft;

    let matched: ResumeAppearance | null = null;
    const TEST_PAD_TOP = 30;
    try {
      for (const item of rawCandidates) {
        paper.classList.remove(
          "spacing-comfortable",
          "spacing-compact",
          "spacing-tight",
        );
        paper.classList.add(`spacing-${item.spacing}`);
        paper.style.setProperty("--resume-font-size", `${item.fontSize}px`);
        paper.style.paddingTop = `${TEST_PAD_TOP}px`;
        paper.style.paddingBottom = `${TEST_PAD_TOP}px`;
        paper.style.paddingLeft = `${item.hPad}px`;
        paper.style.paddingRight = `${item.hPad}px`;

        const contentBottom = measureResumeContentBottom(paper, TEST_PAD_TOP);
        const pureContentHeight = Math.max(0, contentBottom - TEST_PAD_TOP);
        const totalVerticalMargin = A4_HEIGHT - pureContentHeight;

        // 必须保证上下留白合计至少 2 * MIN_BALANCED_MARGIN (56px)，避免底部贴边局促
        if (totalVerticalMargin >= MIN_BALANCED_MARGIN * 2) {
          const balancedVPad = Math.min(
            44,
            Math.max(
              MIN_BALANCED_MARGIN,
              Math.floor((totalVerticalMargin - 2) / 2),
            ),
          );
          paper.style.paddingTop = `${balancedVPad}px`;
          paper.style.paddingBottom = `${balancedVPad}px`;

          const slices = computePreviewPages(
            paper,
            balancedVPad,
            balancedVPad,
          );
          if (slices.length <= 1) {
            matched = {
              ...cur,
              spacing: item.spacing,
              fontSize: item.fontSize,
              paddingTop: balancedVPad,
              paddingBottom: balancedVPad,
              paddingLeft: item.hPad,
              paddingRight: item.hPad,
            };
            break;
          }
        }
      }
    } finally {
      paper.classList.remove(
        "spacing-comfortable",
        "spacing-compact",
        "spacing-tight",
      );
      for (const cls of origClasses) {
        paper.classList.add(cls);
      }
      paper.style.setProperty("--resume-font-size", origFontSize);
      paper.style.paddingTop = origPadTop;
      paper.style.paddingRight = origPadRight;
      paper.style.paddingBottom = origPadBottom;
      paper.style.paddingLeft = origPadLeft;
    }

    if (matched) {
      setData({ ...data, appearance: matched });
      showSmartFitFeedback(
        "success",
        "已自动协调模块间距并配平上下留白，将简历收敛为 1 页 A4（可按 Ctrl+Z 撤销）。",
      );
    } else {
      showSmartFitFeedback(
        "warning",
        "简历内容较多，无法通过微调间距压缩为一页，建议优化删减部分内容后再试。",
      );
    }
  }
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
            onClick={() => {
              if (!canUseFeature(membership.plan, "importResume")) {
                requirePro(FEATURE_UPGRADE_PROMPTS.importResume);
                return;
              }
              importInputRef.current?.click();
            }}
            title="支持上传 PDF (.pdf)、Markdown (.md) 或文本 (.txt) 简历自动解析生成新简历"
          >
            <Upload size={17} />
            <span>{importing ? "解析中…" : "导入简历"}</span>
            {!canUseFeature(membership.plan, "importResume") && (
              <Crown size={13} className="text-[#0cb449]" />
            )}
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
            {!canUseFeature(membership.plan, "translateEnglish") && (
              <Crown size={13} className="text-[#0cb449]" />
            )}
          </button>
          <button
            type="button"
            className={ui["soft-button"]}
            disabled={!store.ready}
            onClick={openOnlineResumeModal}
            title="生成或同步发布在线简历专属链接，方便 HR 随时在电脑或手机上预览与下载 PDF"
          >
            <Globe size={17} className={activePublishedSlug ? "text-[#0cb449]" : ""} />
            <span>在线简历</span>
            {!canUseFeature(membership.plan, "shareOnlineResume") &&
              !activePublishedSlug && (
                <Crown size={13} className="text-[#0cb449]" />
              )}
            {activePublishedSlug && (
              <span
                className={`size-2 rounded-full ${
                  hasUnpublishedChanges ? "bg-amber-500" : "bg-[#0cb449]"
                }`}
                title={
                  hasUnpublishedChanges
                    ? "编辑器有未同步到线上的修改，点击同步发布"
                    : "已开启在线简历访问（线上已是最新）"
                }
              />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setMembershipModalReason("");
              setMembershipModalOpen(true);
            }}
            className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[8px] border px-3 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors max-[540px]:px-2 max-[540px]:text-[12px] ${
              membership.isPro
                ? "border-[#b5e8c8] bg-[#e9f9ef] text-[#0c8a3e] hover:bg-[#daf4e4]"
                : "border-[#c4ecd3] bg-[#f2fcf6] text-[#0c9442] hover:bg-[#e3f8eb]"
            }`}
          >
            <Crown size={15} className="text-[#0cb449]" />
            <span>{membership.isPro ? "PRO 会员" : "升级会员"}</span>
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
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-ink">
                        下载 PDF (.pdf)
                      </p>
                      {!canExportFormat(membership.plan, "pdf") && (
                        <span className="inline-flex items-center gap-0.5 rounded bg-[#e8f8ee] px-1.5 py-0.5 text-[10px] font-semibold text-[#0c8a3e]">
                          <Crown size={10} />
                          PRO
                        </span>
                      )}
                    </div>
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
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-ink">
                        下载 Word (.doc)
                      </p>
                      {!canExportFormat(membership.plan, "word") && (
                        <span className="inline-flex items-center gap-0.5 rounded bg-[#e8f8ee] px-1.5 py-0.5 text-[10px] font-semibold text-[#0c8a3e]">
                          <Crown size={10} />
                          PRO
                        </span>
                      )}
                    </div>
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
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-ink">
                        下载图片 (.png)
                      </p>
                      {!canExportFormat(membership.plan, "image") && (
                        <span className="inline-flex items-center gap-0.5 rounded bg-[#e8f8ee] px-1.5 py-0.5 text-[10px] font-semibold text-[#0c8a3e]">
                          <Crown size={10} />
                          PRO
                        </span>
                      )}
                    </div>
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
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-ink">
                        下载 Markdown (.md)
                      </p>
                      {!canExportFormat(membership.plan, "markdown") && (
                        <span className="inline-flex items-center gap-0.5 rounded bg-[#e8f8ee] px-1.5 py-0.5 text-[10px] font-semibold text-[#0c8a3e]">
                          <Crown size={10} />
                          PRO
                        </span>
                      )}
                    </div>
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
                    <div className="flex items-center gap-1.5">
                      <p className="text-[11px] text-muted-ink">当前登录账号</p>
                      <span
                        className={`rounded px-1.5 py-0.2 text-[10px] font-semibold ${
                          membership.isPro
                            ? "bg-[#e8f8ee] text-[#0c8a3e]"
                            : "bg-neutral-100 text-neutral-500"
                        }`}
                      >
                        {membership.isPro ? "PRO" : "免费版"}
                      </span>
                    </div>
                    <p className="truncate text-xs font-semibold text-ink">
                      {user.email}
                    </p>
                    {membership.isPro && membership.expiresAt && (
                      <p className="text-[10px] text-[#158844]">
                        有效期至 {formatMembershipExpiry(membership.expiresAt)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-1 grid gap-0.5">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setMembershipModalReason("");
                      setMembershipModalOpen(true);
                    }}
                    className="flex w-full items-center justify-between rounded-lg bg-[#f3fbf6] px-2.5 py-2 text-left text-xs font-semibold text-[#0d853d] transition-colors hover:bg-[#e5f7ec]"
                  >
                    <span className="flex items-center gap-2">
                      <Crown size={14} className="text-[#0cb449]" />
                      {membership.isPro ? "会员中心 / 续期" : "升级 PRO 会员"}
                    </span>
                    <span className="text-[10px] font-medium text-[#1b8c48]">
                      兑换激活码 →
                    </span>
                  </button>
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
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-ink transition-colors hover:bg-[#eef9f3] hover:text-[#08a644]"
                  >
                    <LogOut size={14} className="text-[#388855]" />
                    退出登录
                  </button>
                  <div className="my-1 border-t border-[#ebf6ee]" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setDeleteConfirmText("");
                      setDeleteAccountError("");
                      setConfirmDeleteAccount(true);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-[#bd554d] transition-colors hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                    注销账号并清空数据
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
      {confirmDeleteAccount && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="editor-delete-account-dialog-title"
          className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4 backdrop-blur-[1px] print:hidden"
          onClick={() => {
            if (!deletingAccount) setConfirmDeleteAccount(false);
          }}
        >
          <div
            className="w-[min(calc(100vw-2rem),620px)] rounded-2xl border border-[#f2c8c3] bg-white p-5 shadow-[0_16px_40px_#10391d26]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#fff2f0] text-[#bd554d]">
                <Trash2 size={17} />
              </span>
              <h2
                id="editor-delete-account-dialog-title"
                className="text-base font-semibold text-ink"
              >
                注销账号并清空全部数据
              </h2>
            </div>
            <p className="mt-2.5 text-xs leading-relaxed text-muted-ink">
              您正在申请永久注销账号{" "}
              <span className="font-semibold text-ink">{user.email}</span>
              。此操作<strong>不可撤销</strong>，确认后将立即彻底清除：
            </p>
            <ul className="mt-2 list-disc space-y-1 overflow-x-auto rounded-xl border border-[#f7dad7] bg-[#fff9f8] py-2.5 pl-7 pr-4 text-xs text-[#7a342e]">
              <li className="whitespace-nowrap">该账号下保存的所有简历文档与历史版本；</li>
              <li className="whitespace-nowrap">所有已发布的在线简历分享链接及访客统计记录；</li>
              <li className="whitespace-nowrap">账号登录凭证、关联绑定信息及尚未到期的会员权益（视为自愿放弃，不予退还或转移）。</li>
            </ul>
            {membership.isPro && (
              <div className="mt-2.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                ⚠️ 检测到您当前拥有有效的{" "}
                <strong>{membership.planLabel}</strong>（有效期至{" "}
                {formatMembershipExpiry(membership.expiresAt)}
                ），注销账号后会员权益将立即作废且无法恢复！
              </div>
            )}
            <div className="mt-3.5">
              <label
                htmlFor="delete-account-confirm-input"
                className="mb-1.5 block text-xs font-medium text-ink"
              >
                请在下方输入{" "}
                <span className="rounded bg-[#fff2f0] px-1.5 py-0.5 font-semibold text-[#bd554d]">
                  确认注销
                </span>{" "}
                以继续：
              </label>
              <input
                id="delete-account-confirm-input"
                type="text"
                autoFocus
                value={deleteConfirmText}
                placeholder="请输入：确认注销"
                onChange={(e) => {
                  setDeleteConfirmText(e.target.value);
                  setDeleteAccountError("");
                }}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    deleteConfirmText.trim() === "确认注销"
                  ) {
                    e.preventDefault();
                    void handleDeleteAccount();
                  } else if (e.key === "Escape" && !deletingAccount) {
                    setConfirmDeleteAccount(false);
                  }
                }}
                className="w-full rounded-lg border border-[#e5c2be] bg-white px-3 py-2 text-xs text-ink placeholder:text-neutral-400 focus:border-[#bd554d] focus:outline-none focus:ring-2 focus:ring-[#bd554d]/20 focus-visible:outline-none"
              />
            </div>
            {deleteAccountError && (
              <p className="mt-2 text-xs text-red-600" role="alert">
                {deleteAccountError}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={deletingAccount}
                onClick={() => setConfirmDeleteAccount(false)}
                className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[#d8efe1] bg-white px-3.5 text-xs font-medium text-ink transition-colors hover:bg-[#f4fbf6] disabled:opacity-60"
              >
                取消
              </button>
              <button
                type="button"
                disabled={
                  deletingAccount || deleteConfirmText.trim() !== "确认注销"
                }
                onClick={() => void handleDeleteAccount()}
                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-[#bd554d] px-4 text-xs font-medium text-white transition-colors hover:bg-[#a6443d] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 size={13.5} />
                {deletingAccount ? "正在注销…" : "永久注销并清空数据"}
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
            className="w-full max-w-[660px] rounded-2xl border border-[#d8efe1] bg-white p-5 shadow-[0_16px_40px_#10391d26]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#e8f8ee] text-[#0cb449]">
                  <Globe size={18} />
                </span>
                <div className="min-w-0">
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
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    hasUnpublishedChanges
                      ? "border border-amber-200 bg-amber-50 text-amber-700"
                      : "bg-[#e8f8ee] text-[#118a43]"
                  }`}
                >
                  <span
                    className={`size-1.5 shrink-0 rounded-full ${
                      hasUnpublishedChanges ? "bg-amber-500" : "bg-[#0cb449]"
                    }`}
                  />
                  {hasUnpublishedChanges ? "有未发布修改" : "线上已同步"}
                </span>
              )}
            </div>

            <div className="mt-4 grid gap-3">
              <div>
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
                        requestPublishOnlineResume();
                      } else if (e.key === "Escape") {
                        setOnlineModalOpen(false);
                      }
                    }}
                    className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-sm font-medium text-[#1a4026] placeholder:text-[#93b39e] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="online-resume-source-input"
                  className="mb-1.5 block text-xs font-medium text-[#466e53]"
                >
                  投递公司 / HR 追踪标记（选填，自动加密不会显示明文）
                </label>
                <input
                  id="online-resume-source-input"
                  type="text"
                  maxLength={40}
                  value={onlineSourceTagInput}
                  placeholder="例如：字节跳动 / 阿里张HR（链接中将加密为 ?t=...）"
                  onChange={(e) => {
                    setOnlineSourceTagInput(e.target.value);
                    setCopiedOnlineUrl(false);
                  }}
                  className="w-full rounded-lg border border-[#d2ebda] bg-white px-3 py-2 text-xs text-[#1a4026] placeholder:text-[#93b39e] focus:border-[#19af60] focus:outline-none focus:ring-2 focus-within:ring-[#19af60]/20"
                />
              </div>
            </div>

            {activePublishedSlug && (
              <div className="mt-3.5 rounded-xl border border-[#d8efe1] bg-[#f6fcf8] p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-medium text-[#153a22]">
                    {buildOnlineShareUrl(
                      activePublishedSlug,
                      onlineSourceTagInput,
                    )}
                  </p>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      type="button"
                      onClick={async () => {
                        const url = buildOnlineShareUrl(
                          activePublishedSlug,
                          onlineSourceTagInput,
                        );
                        await navigator.clipboard.writeText(url).catch(() => {});
                        setCopiedOnlineUrl(true);
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-[#cde9d7] bg-white px-2 py-1 text-[11px] font-medium text-[#168347] transition-colors hover:bg-[#e8f8ee]"
                    >
                      {copiedOnlineUrl ? <Check size={12} /> : <Copy size={12} />}
                      {copiedOnlineUrl ? "已复制" : "复制链接"}
                    </button>
                    <a
                      href={`/online-resume/${encodeURIComponent(activePublishedSlug)}${
                        encodeSourceTag(onlineSourceTagInput)
                          ? `?t=${encodeSourceTag(onlineSourceTagInput)}`
                          : ""
                      }`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-[#cde9d7] bg-white px-2 py-1 text-[11px] font-medium text-[#168347] transition-colors hover:bg-[#e8f8ee]"
                    >
                      <ExternalLink size={12} />
                      打开预览
                    </a>
                  </div>
                </div>
                <p
                  className={`mt-1.5 text-[11px] ${
                    hasUnpublishedChanges
                      ? "font-medium text-amber-700"
                      : "text-muted-ink"
                  }`}
                >
                  {hasUnpublishedChanges
                    ? "当前编辑器内容有修改，未自动改动线上简历；点击下方「同步发布到线上」后才会更新线上内容。"
                    : "您在编辑器中的草稿修改不会自动改动线上简历，仅在点击下方「同步发布到线上」时才会更新。"}
                </p>
              </div>
            )}

            {activeOnlineInfo && (
              <div className="mt-3.5 rounded-xl border border-[#d8efe1] bg-white p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-semibold text-[#153a22]">
                      访问记录
                    </span>
                    <span className="text-muted-ink">
                      已查看{" "}
                      <strong className="font-semibold text-[#0cb449]">
                        {activeOnlineInfo.totalViews}
                      </strong>{" "}
                      次
                    </span>
                    <span className="text-muted-ink">
                      下载 PDF{" "}
                      <strong className="font-semibold text-[#0cb449]">
                        {activeOnlineInfo.totalDownloads}
                      </strong>{" "}
                      次
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={onlineRefreshing}
                      onClick={() => void refreshOnlineResumes()}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-[#388855] transition-colors hover:bg-[#eef9f3]"
                    >
                      <RefreshCw
                        size={12}
                        className={onlineRefreshing ? "animate-spin" : ""}
                      />
                      刷新
                    </button>
                    <Link
                      href={`/view-statistic?slug=${encodeURIComponent(activePublishedSlug)}`}
                      className="inline-flex items-center gap-1 rounded-md border border-[#cde9d7] bg-[#f4fbf6] px-2.5 py-1 text-[11px] font-medium text-[#168347] transition-colors hover:bg-[#e8f8ee]"
                    >
                      查看全部统计
                      <ExternalLink size={11} />
                    </Link>
                  </div>
                </div>

                {activeOnlineInfo.recentViews.length === 0 ? (
                  <p className="mt-2.5 py-2 text-center text-[11px] text-muted-ink">
                    暂无访问记录，分享链接后对方打开即可在此看到访问详情
                  </p>
                ) : (
                  <div className="mt-2 space-y-1.5">
                    {activeOnlineInfo.recentViews.slice(0, 5).map((v) => {
                      const d = new Date(v.viewedAt);
                      const now = new Date();
                      const isToday =
                        d.getFullYear() === now.getFullYear() &&
                        d.getMonth() === now.getMonth() &&
                        d.getDate() === now.getDate();
                      const yesterday = new Date(now);
                      yesterday.setDate(now.getDate() - 1);
                      const isYesterday =
                        d.getFullYear() === yesterday.getFullYear() &&
                        d.getMonth() === yesterday.getMonth() &&
                        d.getDate() === yesterday.getDate();
                      const hm = d.toLocaleTimeString("zh-CN", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                      });
                      const timeStr = isToday
                        ? `今天 ${hm}`
                        : isYesterday
                          ? `昨天 ${hm}`
                          : `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")} ${hm}`;
                      const normalizedDevice = v.deviceLabel.includes(" · ")
                        ? v.deviceLabel.replace(
                            /^(.+?)\s*·\s*(.+)$/,
                            "$1 ($2)",
                          )
                        : v.deviceLabel || "浏览器";
                      return (
                        <div
                          key={v.id}
                          className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap rounded-lg bg-[#f6fcf8] px-2.5 py-2 text-[11px] leading-relaxed text-[#2d5339]"
                        >
                          <span
                            aria-hidden="true"
                            className="size-2 shrink-0 rounded-full bg-[#0cb449]"
                          />
                          <p className="whitespace-nowrap">
                            <strong className="font-semibold text-[#117a3f]">
                              【{v.sourceTag || "直接访问"}】
                            </strong>
                            <span> · {timeStr}</span>
                            {v.ipAddress && (
                              <>
                                <span> · </span>
                                <span className="font-medium text-[#1e4b2c]">
                                  {v.ipAddress.replace("浙江杭 (", "浙江杭州 (")}
                                </span>
                              </>
                            )}
                            <span> · 通过 </span>
                            <strong className="font-semibold text-[#153a22]">
                              {normalizedDevice}
                            </strong>
                            <span> 打开查看</span>
                            {v.downloadedPdf && (
                              <>
                                <span> · </span>
                                <strong className="font-semibold text-[#0cb449]">
                                  已下载 PDF
                                </strong>
                              </>
                            )}
                          </p>
                        </div>
                      );
                    })}
                    {activeOnlineInfo.totalViews > 5 && (
                      <div className="pt-1 text-center">
                        <Link
                          href={`/view-statistic?slug=${encodeURIComponent(activePublishedSlug)}`}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#168347] hover:underline"
                        >
                          查看全部 {activeOnlineInfo.totalViews} 条访客记录与统计详情 →
                        </Link>
                      </div>
                    )}
                  </div>
                )}
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
                  onClick={() => setConfirmOnlineAction("unpublish")}
                  className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-[#f2c8c3] bg-[#fff7f6] px-3.5 text-xs font-medium text-[#bd554d] shadow-[0_1px_2px_rgba(189,85,77,0.06)] transition-colors hover:border-[#e6aca5] hover:bg-[#ffecea] disabled:opacity-60"
                >
                  <EyeOff size={13.5} />
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
                  onClick={requestPublishOnlineResume}
                  className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-brand px-4 text-xs font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
                >
                  <Globe size={14} />
                  {onlineSaving
                    ? "发布中…"
                    : activePublishedSlug
                      ? "同步发布到线上"
                      : "发布到线上并复制链接"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {onlineModalOpen && confirmOnlineAction && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="online-confirm-dialog-title"
          className="fixed inset-0 z-[60] grid place-items-center bg-black/30 p-4 backdrop-blur-[1px] print:hidden"
          onClick={() => {
            if (!onlineSaving) setConfirmOnlineAction(null);
          }}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[#d8efe1] bg-white p-5 shadow-[0_16px_40px_#10391d33]"
            onClick={(e) => e.stopPropagation()}
          >
            {confirmOnlineAction === "publish" ? (
              <>
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#e8f8ee] text-[#0cb449]">
                    <Globe size={17} />
                  </span>
                  <h2
                    id="online-confirm-dialog-title"
                    className="text-base font-semibold text-ink"
                  >
                    {activePublishedSlug
                      ? "确认同步发布到线上？"
                      : "确认发布在线简历？"}
                  </h2>
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-muted-ink">
                  {activePublishedSlug ? (
                    <>
                      确认后将把当前编辑器中的最新简历内容同步覆盖至线上链接{" "}
                      <span className="break-all font-medium text-ink">
                        {siteOrigin}/online-resume/{getCleanOnlineSlug()}
                      </span>
                      ，持有该链接的 HR 刷新即可看到更新后的简历并下载最新 PDF。
                    </>
                  ) : (
                    <>
                      确认后将生成专属在线简历链接{" "}
                      <span className="break-all font-medium text-ink">
                        {siteOrigin}/online-resume/{getCleanOnlineSlug()}
                      </span>{" "}
                      并自动复制到剪贴板，持有该链接的 HR 可在线浏览与下载 PDF 简历。
                    </>
                  )}
                </p>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={onlineSaving}
                    onClick={() => setConfirmOnlineAction(null)}
                    className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[#d8efe1] bg-white px-3.5 text-xs font-medium text-ink transition-colors hover:bg-[#f4fbf6] disabled:opacity-60"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    disabled={onlineSaving}
                    onClick={() => void handlePublishOnlineResume()}
                    className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-brand px-4 text-xs font-medium text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
                  >
                    <Globe size={13.5} />
                    {onlineSaving
                      ? "发布中…"
                      : activePublishedSlug
                        ? "确认同步发布"
                        : "确认发布"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#fff2f0] text-[#bd554d]">
                    <EyeOff size={17} />
                  </span>
                  <h2
                    id="online-confirm-dialog-title"
                    className="text-base font-semibold text-ink"
                  >
                    确认关闭在线访问？
                  </h2>
                </div>
                <p className="mt-2.5 text-xs leading-relaxed text-muted-ink">
                  关闭后，线上链接{" "}
                  <span className="break-all font-medium text-ink">
                    {siteOrigin}/online-resume/{activePublishedSlug}
                  </span>{" "}
                  将立即失效，HR 将无法再通过该链接查看或下载您的在线简历。编辑器内的本地简历内容不会受到影响，您随时可以重新发布。
                </p>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={onlineSaving}
                    onClick={() => setConfirmOnlineAction(null)}
                    className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[#d8efe1] bg-white px-3.5 text-xs font-medium text-ink transition-colors hover:bg-[#f4fbf6] disabled:opacity-60"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    disabled={onlineSaving}
                    onClick={() => void handleUnpublishOnlineResume()}
                    className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-[#bd554d] px-4 text-xs font-medium text-white transition-colors hover:bg-[#a6443d] disabled:opacity-60"
                  >
                    <EyeOff size={13.5} />
                    {onlineSaving ? "关闭中…" : "确认关闭访问"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <MembershipModal
        open={membershipModalOpen}
        reason={membershipModalReason}
        membership={membership}
        onClose={() => setMembershipModalOpen(false)}
        onRedeemed={(next) => {
          setMembership(next);
          router.refresh();
        }}
      />
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
            <TemplatePanel
              data={data}
              plan={membership.plan}
              onRequirePro={requirePro}
              onChange={setData}
            />
          ) : view === "resumes" ? (
            <LibraryPanel
              store={store}
              plan={membership.plan}
              onRequirePro={requirePro}
              importing={importing}
              onImportFile={(file) => void handleImportResumeFile(file)}
              onEdit={() => {
                setView("editor");
                setPreviewOnly(false);
                setEditTarget(null);
              }}
            />
          ) : (
            <SettingsPanel
              data={data}
              onChange={setData}
              onSmartOnePage={handleSmartOnePage}
            />
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
                type="button"
                className={ui["secondary-button"]}
                title="自动微调间距与页边距，尽量将超出不多的简历收敛为一页 A4"
                onClick={handleSmartOnePage}
              >
                <WandSparkles size={15} />
                智能一页
                {pageCount > 1 && (
                  <span className="rounded-full bg-[#168347] px-1.5 py-0.2 text-[10px] font-semibold text-white">
                    {pageCount}页
                  </span>
                )}
              </button>
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
          {smartFitNotice && (
            <div
              role="status"
              className={`mx-5 mb-1 flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2 text-xs font-medium shadow-2xs transition-all print:hidden ${
                smartFitNotice.type === "warning"
                  ? "border-amber-300 bg-amber-50 text-amber-800"
                  : smartFitNotice.type === "success"
                    ? "border-[#8ce0b0] bg-[#ebfaf1] text-[#116e38]"
                    : "border-[#cde9d7] bg-[#f4fbf6] text-[#28633d]"
              }`}
            >
              <span>{smartFitNotice.message}</span>
              <button
                type="button"
                onClick={() => setSmartFitNotice(null)}
                className="shrink-0 rounded px-1.5 py-0.5 text-[11px] opacity-75 hover:opacity-100"
              >
                知道了
              </button>
            </div>
          )}
          <PreviewCanvas
            zoom={zoom}
            data={data}
            previewRef={previewRef}
            onZoomChange={setZoom}
            onScaleChange={setActualScale}
            onPageCountChange={setPageCount}
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
