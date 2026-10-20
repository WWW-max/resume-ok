"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  Eye,
  Filter,
  Globe,
  RefreshCw,
  Search,
  TrendingUp,
  Users,
} from "lucide-react";
import { Brand } from "@/components/Brand";
import { ui } from "@/lib/ui-styles";

interface ViewLogItem {
  id: string;
  slug: string;
  resumeTitle: string;
  sourceTag: string;
  deviceLabel: string;
  ipAddress: string;
  downloadedPdf: boolean;
  viewedAt: string;
}

interface ViewsQueryResponse {
  resumes: Array<{ slug: string; title: string }>;
  summary: {
    totalViews: number;
    uniqueVisitors: number;
    totalDownloads: number;
  };
  total: number;
  hasMore: boolean;
  items: ViewLogItem[];
}

const PAGE_SIZE = 20;

function formatVisitTime(iso: string): string {
  const d = new Date(iso);
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
  if (isToday) return `今天 ${hm}`;
  if (isYesterday) return `昨天 ${hm}`;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${hm}`;
}

export function ViewStatisticDashboard({
  initialSlug = "",
}: {
  initialSlug?: string;
}) {
  const [selectedSlug, setSelectedSlug] = useState(initialSlug);
  const [searchText, setSearchText] = useState("");
  const [downloadedOnly, setDownloadedOnly] = useState(false);

  const [resumes, setResumes] = useState<Array<{ slug: string; title: string }>>(
    [],
  );
  const [summary, setSummary] = useState({
    totalViews: 0,
    uniqueVisitors: 0,
    totalDownloads: 0,
  });
  const [items, setItems] = useState<ViewLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(
    async (offset: number, append: boolean) => {
      if (append) setLoadingMore(true);
      try {
        const params = new URLSearchParams();
        if (selectedSlug) params.set("slug", selectedSlug);
        if (searchText.trim()) params.set("q", searchText.trim());
        if (downloadedOnly) params.set("downloadedOnly", "1");
        params.set("offset", String(offset));
        params.set("limit", String(PAGE_SIZE));

        const res = await fetch(`/api/online-resume/views?${params.toString()}`);
        if (!res.ok) return;
        const data = (await res.json()) as ViewsQueryResponse;
        setResumes(data.resumes);
        setSummary(data.summary);
        setTotal(data.total);
        setHasMore(data.hasMore);
        setItems((prev) => (append ? [...prev, ...data.items] : data.items));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedSlug, searchText, downloadedOnly],
  );

  useEffect(() => {
    let active = true;
    const buildUrl = () => {
      const params = new URLSearchParams();
      if (selectedSlug) params.set("slug", selectedSlug);
      if (searchText.trim()) params.set("q", searchText.trim());
      if (downloadedOnly) params.set("downloadedOnly", "1");
      params.set("offset", "0");
      params.set("limit", String(PAGE_SIZE));
      return `/api/online-resume/views?${params.toString()}`;
    };

    const poll = () => {
      if (typeof document !== "undefined" && document.hidden) return;
      fetch(buildUrl())
        .then((res) => (res.ok ? res.json() : null))
        .then((data: ViewsQueryResponse | null) => {
          if (!active || !data) return;
          setResumes(data.resumes);
          setSummary(data.summary);
          setTotal(data.total);
          setItems((prev) => {
            if (prev.length <= PAGE_SIZE) {
              setHasMore(data.hasMore);
              return data.items;
            }
            const freshById = new Map(data.items.map((item) => [item.id, item]));
            const existingIds = new Set(prev.map((item) => item.id));
            const newHead = data.items.filter((item) => !existingIds.has(item.id));
            const updatedPrev = prev.map((item) => freshById.get(item.id) ?? item);
            const merged = [...newHead, ...updatedPrev];
            setHasMore(merged.length < data.total);
            return merged;
          });
          setLoading(false);
        })
        .catch(() => {
          if (active) setLoading(false);
        });
    };

    poll();
    const timer = window.setInterval(poll, 4000);
    window.addEventListener("focus", poll);
    document.addEventListener("visibilitychange", poll);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", poll);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [selectedSlug, searchText, downloadedOnly]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loading || loadingMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void fetchPage(items.length, true);
        }
      },
      { rootMargin: "120px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, items.length, fetchPage]);

  const conversionRate =
    summary.totalViews > 0
      ? `${Math.round((summary.totalDownloads / summary.totalViews) * 100)}%`
      : "0%";

  return (
    <div className="min-h-dvh bg-[#f4fbf6] text-ink">
      <header className="sticky top-0 z-20 flex h-15 items-center justify-between border-b border-[#d8efe1] bg-white/95 px-4 sm:px-8 backdrop-blur-xs">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="ResumeOK 首页">
            <Brand />
          </Link>
          <span className="h-4 w-px bg-[#d8efe1]" />
          <div className="flex items-center gap-2">
            <Globe size={16} className="text-[#0cb449]" />
            <h1 className="text-sm sm:text-base font-semibold text-[#153a22]">
              在线简历访客统计
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedSlug && (
            <a
              href={`/online-resume/${encodeURIComponent(selectedSlug)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={ui["soft-button"]}
            >
              <ExternalLink size={15} />
              <span className="hidden sm:inline">预览在线简历</span>
            </a>
          )}
          <Link href="/editor" className={ui["primary-button"]}>
            <ArrowLeft size={16} />
            <span>返回简历编辑器</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-8">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-2xl border border-[#d8efe1] bg-white p-4 shadow-[0_4px_16px_#10391d08]">
            <div className="flex items-center justify-between text-xs text-muted-ink">
              <span>总查看次数 (PV)</span>
              <span className="grid size-7 place-items-center rounded-lg bg-[#e8f8ee] text-[#0cb449]">
                <Eye size={15} />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#153a22]">
              {summary.totalViews}
            </p>
          </div>

          <div className="rounded-2xl border border-[#d8efe1] bg-white p-4 shadow-[0_4px_16px_#10391d08]">
            <div className="flex items-center justify-between text-xs text-muted-ink">
              <span>独立访客 IP (UV)</span>
              <span className="grid size-7 place-items-center rounded-lg bg-[#e8f8ee] text-[#0cb449]">
                <Users size={15} />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#153a22]">
              {summary.uniqueVisitors}
            </p>
          </div>

          <div className="rounded-2xl border border-[#d8efe1] bg-white p-4 shadow-[0_4px_16px_#10391d08]">
            <div className="flex items-center justify-between text-xs text-muted-ink">
              <span>PDF 下载次数</span>
              <span className="grid size-7 place-items-center rounded-lg bg-[#e8f8ee] text-[#0cb449]">
                <Download size={15} />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#0cb449]">
              {summary.totalDownloads}
            </p>
          </div>

          <div className="rounded-2xl border border-[#d8efe1] bg-white p-4 shadow-[0_4px_16px_#10391d08]">
            <div className="flex items-center justify-between text-xs text-muted-ink">
              <span>下载转化率</span>
              <span className="grid size-7 place-items-center rounded-lg bg-[#e8f8ee] text-[#0cb449]">
                <TrendingUp size={15} />
              </span>
            </div>
            <p className="mt-2 text-2xl font-bold text-[#153a22]">
              {conversionRate}
            </p>
          </div>
        </div>

        {/* Filter Bar + Visitor Log List */}
        <div className="mt-6 rounded-2xl border border-[#d8efe1] bg-white p-4 sm:p-6 shadow-[0_6px_24px_#10391d0a]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ebf6ee] pb-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                aria-label="选择在线简历"
                value={selectedSlug}
                onChange={(e) => setSelectedSlug(e.target.value)}
                className="h-9 rounded-lg border border-[#d2ebda] bg-[#f8fdf9] px-3 text-xs font-medium text-[#1a4026] focus:border-[#19af60] focus:outline-none"
              >
                <option value="">全部在线简历</option>
                {resumes.map((r) => (
                  <option key={r.slug} value={r.slug}>
                    {r.title} (/online-resume/{r.slug})
                  </option>
                ))}
              </select>

              <div className="relative flex items-center">
                <Search
                  size={14}
                  className="pointer-events-none absolute left-2.5 text-[#6e9179]"
                />
                <input
                  type="text"
                  value={searchText}
                  placeholder="搜索投递标记 / 城市 / IP / 设备…"
                  onChange={(e) => setSearchText(e.target.value)}
                  className="h-9 w-56 rounded-lg border border-[#d2ebda] bg-white pl-8 pr-3 text-xs text-[#1a4026] placeholder:text-[#93b39e] focus:border-[#19af60] focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => setDownloadedOnly((prev) => !prev)}
                className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors ${
                  downloadedOnly
                    ? "border-[#0cb449] bg-[#e8f8ee] text-[#0b8a3b]"
                    : "border-[#d2ebda] bg-white text-[#466e53] hover:bg-[#f4fbf6]"
                }`}
              >
                <Filter size={13} />
                仅看已下载 PDF
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-ink">
                共匹配的访问记录{" "}
                <strong className="font-semibold text-[#153a22]">
                  {total}
                </strong>{" "}
                条
              </span>
              <button
                type="button"
                disabled={loading}
                onClick={() => void fetchPage(0, false)}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#d2ebda] bg-white px-3 text-xs font-medium text-[#2d5339] transition-colors hover:bg-[#eef9f3]"
              >
                <RefreshCw
                  size={13}
                  className={loading ? "animate-spin" : ""}
                />
                刷新
              </button>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-muted-ink">
              正在加载访客记录…
            </div>
          ) : items.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-ink">
              暂无符合条件的访客查看记录
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {items.map((v) => {
                const timeStr = formatVisitTime(v.viewedAt);
                const normalizedDevice = v.deviceLabel.includes(" · ")
                  ? v.deviceLabel.replace(/^(.+?)\s*·\s*(.+)$/, "$1 ($2)")
                  : v.deviceLabel || "浏览器";
                const fixedIp = v.ipAddress.replace("浙江杭 (", "浙江杭州 (");
                return (
                  <div
                    key={v.id}
                    className="flex items-center justify-between gap-3 overflow-x-auto whitespace-nowrap rounded-xl border border-[#ebf6ee] bg-[#f8fdf9] px-3.5 py-2.5 text-xs text-[#2d5339] transition-colors hover:border-[#cde9d7]"
                  >
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span
                        aria-hidden="true"
                        className="size-2 shrink-0 rounded-full bg-[#0cb449]"
                      />
                      <p className="whitespace-nowrap">
                        <strong className="font-semibold text-[#117a3f]">
                          【{v.sourceTag || "直接访问"}】
                        </strong>
                        <span> · {timeStr}</span>
                        {fixedIp && (
                          <>
                            <span> · </span>
                            <span className="font-medium text-[#1e4b2c]">
                              {fixedIp}
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
                    {!selectedSlug && (
                      <span className="shrink-0 rounded-md border border-[#d8efe1] bg-white px-2 py-0.5 text-[11px] text-[#4a805c]">
                        简历：{v.resumeTitle}
                      </span>
                    )}
                  </div>
                );
              })}

              <div ref={sentinelRef} className="pt-2 text-center">
                {hasMore ? (
                  <button
                    type="button"
                    disabled={loadingMore}
                    onClick={() => void fetchPage(items.length, true)}
                    className="inline-flex h-9 items-center justify-center rounded-lg border border-[#d2ebda] bg-white px-4 text-xs font-medium text-[#168347] transition-colors hover:bg-[#eef9f3] disabled:opacity-60"
                  >
                    {loadingMore
                      ? "正在加载更多…"
                      : `加载更多记录（已显示 ${items.length} / 共 ${total} 条）`}
                  </button>
                ) : (
                  items.length >= PAGE_SIZE && (
                    <p className="py-2 text-[11px] text-muted-ink">
                      已加载全部 {total} 条访客记录
                    </p>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
