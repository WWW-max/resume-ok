"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Menu,
  X,
  ArrowUpRight,
  LogOut,
  Trash2,
  ChevronDown,
  FileText,
  KeyRound,
  ShieldCheck,
  Gift,
  MessageSquarePlus,
} from "lucide-react";
import { Brand } from "@/components/Brand";
import { PasswordSetupModal } from "@/components/auth/PasswordSetupModal";
import { CommunityRewardsModal } from "@/components/editor/CommunityRewardsModal";
import { Input } from "@/components/ui/input";
import { formatMembershipExpiry } from "@/lib/membership";
import { trackEvent } from "@/lib/analytics";
const links = [
  { href: "/#top", label: "首页" },
  { href: "/editor?view=templates", label: "模板" },
  { href: "/#features", label: "功能" },
  { href: "/#pricing", label: "价格" },
  { href: "/#about", label: "关于我们" },
];
export function LandingHeader({
  user,
}: {
  user?: {
    id: string;
    email: string;
    isPro?: boolean;
    planLabel?: string;
    membershipExpiresAt?: string | null;
    isAdmin?: boolean;
  } | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [rewardsModalTab, setRewardsModalTab] = useState<"invite" | "feedback" | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState("");
  const toggleRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.location.pathname === "/") {
        trackEvent("home_view");
      }
      try {
        const params = new URLSearchParams(window.location.search);
        const ref = params.get("ref");
        if (ref && ref.trim()) {
          window.localStorage.setItem("rok_ref", ref.trim().toUpperCase());
        }
      } catch {
        // ignore
      }
    }
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

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setConfirmLogout(false);
    setUserMenuOpen(false);
    setOpen(false);
    router.refresh();
  }

  async function handleDeleteAccount() {
    if (deletingAccount || deleteConfirmText.trim() !== "确认注销") return;
    setDeletingAccount(true);
    setDeleteAccountError("");
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
      setOpen(false);
      router.refresh();
    } catch (error) {
      setDeleteAccountError(
        error instanceof Error ? error.message : "注销账号失败，请稍后重试。",
      );
    } finally {
      setDeletingAccount(false);
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-neutral-100/80 bg-white/95 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-[1160px] items-center gap-2 sm:h-[76px] lg:gap-12 px-5 sm:px-8">
          <Link
            href="/"
            aria-label="ResumeOK 首页"
            className="shrink-0 rounded-lg max-[380px]:[&_.brand]:text-[17px] max-[380px]:[&_.brand-clover]:size-6 focus-visible:outline-2 focus-visible:outline-brand"
          >
            <Brand />
          </Link>
          <nav
            aria-label="首页导航"
            className="hidden items-center gap-7 text-sm font-medium text-ink lg:flex"
          >
            {links.map((link, i) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative py-6 transition-colors hover:text-brand ${i === 0 ? "text-brand after:absolute after:bottom-3 after:left-1/2 after:h-0.5 after:w-4 after:-translate-x-1/2 after:rounded-full after:bg-brand" : ""}`}
              >
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => setRewardsModalTab("feedback")}
              className="relative py-6 text-sm font-medium text-ink transition-colors hover:text-brand"
            >
              联系我们
            </button>
          </nav>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setRewardsModalTab("invite")}
              className="hidden sm:inline-flex min-h-9 items-center gap-1.5 rounded-full border border-green-200 bg-green-50/80 px-3 py-1.5 text-xs font-semibold text-green-800 transition-colors hover:border-green-300 hover:bg-green-100"
            >
              <Gift size={14} className="text-green-600" />
              免费领会员
            </button>
            {user ? (
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
                  <span className="max-w-32 truncate sm:max-w-44">
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
                          <p className="text-[11px] text-muted-ink">
                            当前登录账号
                          </p>
                          <span
                            className={`rounded px-1.5 py-0.2 text-[10px] font-semibold ${
                              user.isPro
                                ? "bg-[#e8f8ee] text-[#0c8a3e]"
                                : "bg-neutral-100 text-neutral-500"
                            }`}
                          >
                            {user.isPro ? "PRO" : "免费版"}
                          </span>
                        </div>
                        <p className="truncate text-xs font-semibold text-ink">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <div className="mt-1 grid gap-0.5">
                      <Link
                        href="/editor"
                        role="menuitem"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-ink transition-colors hover:bg-[#eef9f3] hover:text-[#08a644]"
                      >
                        <FileText size={14} className="text-[#388855]" />
                        进入简历工作台
                      </Link>
                      {user.isAdmin && (
                        <Link
                          href="/admin-dashboard"
                          role="menuitem"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-ink transition-colors hover:bg-[#eef9f3] hover:text-[#08a644]"
                        >
                          <ShieldCheck size={14} className="text-[#0cb449]" />
                          运营管理中台
                        </Link>
                      )}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setUserMenuOpen(false);
                          setRewardsModalTab("invite");
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-[#0c8a3e] transition-colors hover:bg-[#eef9f3]"
                      >
                        <Gift size={14} className="text-[#0cb449]" />
                        邀请好友送月卡
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setUserMenuOpen(false);
                          setRewardsModalTab("feedback");
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-ink transition-colors hover:bg-[#eef9f3] hover:text-[#08a644]"
                      >
                        <MessageSquarePlus size={14} className="text-[#388855]" />
                        联系我们 / 提建议送会员
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setUserMenuOpen(false);
                          setPasswordModalOpen(true);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-ink transition-colors hover:bg-[#eef9f3] hover:text-[#08a644]"
                      >
                        <KeyRound size={14} className="text-[#388855]" />
                        设置 / 修改密码
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
            ) : (
              <Link
                href="/login"
                className="inline-flex min-h-11 items-center justify-center gap-1 rounded-full bg-brand px-3 text-xs sm:px-5 sm:text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark"
              >
                登录 / 注册
                <ArrowUpRight size={15} className="hidden sm:block" />
              </Link>
            )}
            <button
              ref={toggleRef}
              aria-label={open ? "关闭导航" : "展开导航"}
              aria-expanded={open}
              aria-controls="mobile-navigation"
              onClick={() => setOpen(!open)}
              className="grid size-11 place-items-center rounded-lg text-ink hover:bg-green-50 lg:hidden"
            >
              {open ? <X size={23} /> : <Menu size={23} />}
            </button>
          </div>
        </div>
        {open && (
          <nav
            id="mobile-navigation"
            aria-label="移动端首页导航"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setOpen(false);
                toggleRef.current?.focus();
              }
            }}
            className="grid gap-1 border-t border-neutral-100 bg-white p-4 shadow-lg lg:hidden"
          >
            {(user
              ? [
                  ...links,
                  { href: "/editor", label: `我的简历 (${user.email})` },
                  ...(user.isAdmin
                    ? [{ href: "/admin-dashboard", label: "运营管理中台" }]
                    : []),
                ]
              : [...links, { href: "/login", label: "登录 / 注册" }]
            ).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="min-h-11 rounded-lg px-4 py-3 text-sm font-medium text-ink hover:bg-green-50 focus-visible:outline-brand"
              >
                {link.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setRewardsModalTab("invite");
              }}
              className="min-h-11 rounded-lg px-4 py-3 text-left text-sm font-semibold text-green-700 hover:bg-green-50"
            >
              🎁 邀请好友送月卡
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setRewardsModalTab("feedback");
              }}
              className="min-h-11 rounded-lg px-4 py-3 text-left text-sm font-medium text-ink hover:bg-green-50"
            >
              💬 联系我们 / 提建议送会员
            </button>
            {user && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setPasswordModalOpen(true);
                  }}
                  className="min-h-11 rounded-lg px-4 py-3 text-left text-sm font-medium text-ink hover:bg-green-50"
                >
                  设置 / 修改密码
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setConfirmLogout(true);
                  }}
                  className="min-h-11 rounded-lg px-4 py-3 text-left text-sm font-medium text-ink hover:bg-green-50"
                >
                  退出登录
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setDeleteConfirmText("");
                    setDeleteAccountError("");
                    setConfirmDeleteAccount(true);
                  }}
                  className="min-h-11 rounded-lg px-4 py-3 text-left text-sm font-medium text-[#bd554d] hover:bg-red-50"
                >
                  注销账号并清空数据
                </button>
              </>
            )}
          </nav>
        )}
      </header>
      {confirmLogout && user && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="logout-dialog-title"
          className="fixed inset-0 z-50 grid place-items-center bg-black/25 p-4 backdrop-blur-[1px]"
          onClick={() => setConfirmLogout(false)}
        >
          <div
            className="w-full max-w-xs rounded-2xl border border-[#d8efe1] bg-white p-5 shadow-[0_16px_40px_#10391d26]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="logout-dialog-title"
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
      {confirmDeleteAccount && user && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="landing-delete-account-dialog-title"
          className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4 backdrop-blur-[1px]"
          onClick={() => {
            if (!deletingAccount) setConfirmDeleteAccount(false);
          }}
        >
          <div
            className="max-h-[calc(100dvh-2rem)] w-[min(calc(100vw-2rem),620px)] overflow-y-auto rounded-2xl border border-[#f2c8c3] bg-white p-4 shadow-[0_16px_40px_#10391d26] sm:p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#fff2f0] text-[#bd554d]">
                <Trash2 size={17} />
              </span>
              <h2
                id="landing-delete-account-dialog-title"
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
            <ul className="mt-2 list-disc space-y-1 overflow-x-auto rounded-xl border border-[#f7dad7] bg-[#fff9f8] py-2.5 pl-6 pr-3.5 text-xs text-[#7a342e] sm:pl-7 sm:pr-4">
              <li className="sm:whitespace-nowrap">该账号下保存的所有简历文档与历史版本；</li>
              <li className="sm:whitespace-nowrap">所有已发布的在线简历分享链接及访客统计记录；</li>
              <li className="sm:whitespace-nowrap">账号登录凭证、关联绑定信息及尚未到期的会员权益（视为自愿放弃，不予退还或转移）。</li>
            </ul>
            {user.isPro && (
              <div className="mt-2.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                ⚠️ 检测到您当前拥有有效的{" "}
                <strong>{user.planLabel || "PRO 会员"}</strong>
                {user.membershipExpiresAt
                  ? `（有效期至 ${formatMembershipExpiry(user.membershipExpiresAt)}）`
                  : ""}
                ，注销账号后会员权益将立即作废且无法恢复！
              </div>
            )}
            <div className="mt-3.5">
              <label
                htmlFor="landing-delete-confirm-input"
                className="mb-1.5 block text-xs font-medium text-ink"
              >
                请在下方输入{" "}
                <span className="rounded bg-[#fff2f0] px-1.5 py-0.5 font-semibold text-[#bd554d]">
                  确认注销
                </span>{" "}
                以继续：
              </label>
              <Input
                id="landing-delete-confirm-input"
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
                className="h-9 rounded-lg border-[#e5c2be] bg-white px-3 py-2 text-xs text-ink focus:border-[#bd554d]"
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
      {user && (
        <PasswordSetupModal
          open={passwordModalOpen}
          userEmail={user.email}
          onClose={() => setPasswordModalOpen(false)}
        />
      )}
      <CommunityRewardsModal
        open={rewardsModalTab !== null}
        initialTab={rewardsModalTab ?? "invite"}
        userEmail={user?.email ?? null}
        onClose={() => setRewardsModalTab(null)}
      />
    </>
  );
}
