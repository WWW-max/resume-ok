"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Menu,
  X,
  ArrowUpRight,
  LogOut,
  ChevronDown,
  FileText,
} from "lucide-react";
import { Brand } from "@/components/Brand";
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
  user?: { id: string; email: string } | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

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
            className="hidden items-center gap-8 text-sm font-medium text-ink lg:flex"
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
          </nav>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
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
                        <p className="text-[11px] text-muted-ink">
                          当前登录账号
                        </p>
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
            {user && (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setConfirmLogout(true);
                }}
                className="min-h-11 rounded-lg px-4 py-3 text-left text-sm font-medium text-[#bd554d] hover:bg-red-50"
              >
                退出登录
              </button>
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
    </>
  );
}
