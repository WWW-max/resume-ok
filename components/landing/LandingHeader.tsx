"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { Brand } from "@/components/Brand";
const links = [{href:"/#top",label:"首页"},{href:"/editor?view=templates",label:"模板"},{href:"/#features",label:"功能"},{href:"/#pricing",label:"价格"},{href:"/#about",label:"关于我们"}];
export function LandingHeader() {
  const [open,setOpen]=useState(false);
  const toggleRef=useRef<HTMLButtonElement>(null);
  return <header className="sticky top-0 z-40 border-b border-slate-100/80 bg-white/95 backdrop-blur-lg">
    <div className="mx-auto flex h-16 max-w-[1160px] items-center gap-2 sm:h-[76px] lg:gap-12 px-5 sm:px-8">
      <Link href="/" aria-label="ResumeOK 首页" className="shrink-0 rounded-lg max-[380px]:[&_.brand]:text-[17px] max-[380px]:[&_.brand-clover]:size-6 focus-visible:outline-2 focus-visible:outline-brand"><Brand /></Link>
      <nav aria-label="首页导航" className="hidden items-center gap-8 text-sm font-medium text-ink lg:flex">{links.map((link,i)=><Link key={link.href} href={link.href} className={`relative py-6 transition-colors hover:text-brand ${i===0 ? "text-brand after:absolute after:bottom-3 after:left-1/2 after:h-0.5 after:w-4 after:-translate-x-1/2 after:rounded-full after:bg-brand" : ""}`}>{link.label}</Link>)}</nav>
      <div className="ml-auto flex items-center gap-1 sm:gap-6"><Link href="/editor?view=resumes" className="hidden rounded-md py-3 text-sm text-slate-500 hover:text-brand sm:inline-flex">我的简历</Link><Link href="/editor" className="inline-flex min-h-11 items-center justify-center gap-1 rounded-full bg-brand px-3 text-xs sm:px-5 sm:text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark">免费使用<ArrowUpRight size={15} className="hidden sm:block"/></Link><button ref={toggleRef} aria-label={open ? "关闭导航" : "展开导航"} aria-expanded={open} aria-controls="mobile-navigation" onClick={()=>setOpen(!open)} className="grid size-11 place-items-center rounded-lg text-ink hover:bg-emerald-50 lg:hidden">{open ? <X size={23}/> : <Menu size={23}/>}</button></div>
    </div>
    {open && <nav id="mobile-navigation" aria-label="移动端首页导航" onKeyDown={e=>{if(e.key==="Escape"){setOpen(false);toggleRef.current?.focus();}}} className="grid gap-1 border-t border-slate-100 bg-white p-4 shadow-lg lg:hidden">{[...links,{href:"/editor?view=resumes",label:"我的简历"}].map(link=><Link key={link.href} href={link.href} onClick={()=>setOpen(false)} className="min-h-11 rounded-lg px-4 py-3 text-sm font-medium text-ink hover:bg-emerald-50 focus-visible:outline-brand">{link.label}</Link>)}</nav>}
  </header>;
}
