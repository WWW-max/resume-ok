import Link from "next/link";
import { ArrowRight, Check, Clover, FileText, LayoutTemplate, MousePointer2, ShieldCheck, Smartphone, Download, Sparkles, Star, LockKeyhole, Heart } from "lucide-react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { ProductShowcase } from "@/components/landing/ProductShowcase";
import { StepIllustration } from "@/components/landing/StepIllustration";
import { Brand } from "@/components/Brand";
const features=[
  {icon:LayoutTemplate,title:"专业简历模板",text:"清新、极简、商务三种风格，一键切换，专注呈现你的优势。",href:"/editor?view=templates"},
  {icon:MousePointer2,title:"可视化编辑器",text:"模块自由排序，内容实时预览。所见即所得，编辑更高效。",href:"/editor"},
  {icon:Sparkles,title:"智能内容检查",text:"检查基础信息、日期与成果表达，帮你发现容易忽略的细节。",href:"/editor?view=assistant"},
  {icon:ShieldCheck,title:"简历完整度",text:"逐项检查内容完整度，直接跳转到待完善的模块。",href:"/editor?view=assistant"},
  {icon:Download,title:"一键导出 PDF",text:"A4 排版与长简历分页，随时下载，准备好下一次投递。",href:"/editor"},
  {icon:Smartphone,title:"多端轻松编辑",text:"电脑与手机都能使用，通过备份文件迁移你的简历。",href:"/editor?view=resumes"},
];
const steps=[{title:"选择模板",text:"从精选模板中挑选喜欢的风格，开启创建简历的第一步。",href:"/editor?view=templates"},{title:"编辑简历",text:"填写你的信息，拖拽排序，自由调整简历模块。",href:"/editor"},{title:"下载简历",text:"一键生成 PDF 简历，随时投递，开启新的机会。",href:"/editor"}];
export default function LandingPage() {
  return <div id="top" className="min-h-screen bg-white text-ink selection:bg-emerald-100">
    <a href="#main-content" className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:not-sr-only focus:rounded-lg focus:bg-white focus:p-4 focus:shadow-lg">跳到主要内容</a>
    <LandingHeader/>
    <main id="main-content">
      <section className="relative isolate overflow-hidden bg-[linear-gradient(115deg,#f1fbf5_0%,#fbfdfd_45%,#eaf9f0_100%)]">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-56 h-[550px] w-[480px] -rotate-45 rounded-[150px] bg-emerald-100/30"/>
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -left-40 size-96 rounded-full bg-emerald-100/50 blur-3xl"/>
        <div className="mx-auto grid max-w-[1160px] items-center gap-14 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[.88fr_1.12fr] lg:gap-12 lg:py-20">
          <div className="relative z-10 text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100/70 px-3 py-2 text-xs font-semibold text-emerald-900"><Sparkles size={15} className="text-blue-500"/>让好机会，从一份好简历开始</span>
            <h1 className="mt-6 text-[34px] font-bold leading-[1.3] tracking-tight sm:text-[46px] lg:text-[44px] xl:text-[48px]">用 ResumeOK<br/>打造你的<span className="text-[#18aa49]">完美简历</span></h1>
            <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-[#556784] sm:text-[15px] lg:mx-0">专业的在线简历编辑工具，精选精美模板，轻松完善内容。<br className="hidden sm:block"/>让你更快拿到心仪的 Offer！</p>
            <div className="mt-8 flex flex-wrap justify-center gap-4 lg:justify-start"><Link href="/editor" className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-brand px-7 text-sm font-semibold text-white shadow-[0_8px_20px_#13ad5025] transition-colors hover:bg-brand-dark"><Clover size={19} className="fill-white/30"/>立即开始制作<ArrowRight size={17}/></Link><Link href="/editor?view=templates" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-emerald-200 bg-white/50 px-6 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50"><LayoutTemplate size={17}/>浏览模板</Link></div>
            <div className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-slate-500 lg:justify-start">{["精选专业模板","免费开始制作","一键导出 PDF"].map(t=><span className="inline-flex items-center gap-1.5" key={t}><Check size={13} className="rounded-full bg-emerald-200 p-0.5 text-emerald-700"/>{t}</span>)}</div>
          </div>
          <ProductShowcase/>
        </div>
      </section>
      <section id="features" className="scroll-mt-24 px-5 py-14 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-[1160px]"><div className="text-center"><p className="text-xs font-semibold text-brand-dark">为什么选择 ResumeOK</p><h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-[30px]">强大功能 · 助你脱颖而出</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">从简历制作到内容完善，让繁琐的排版变简单，让你的优势被看见。</p></div>
        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-3 lg:grid-cols-6 lg:gap-6">{features.map(({icon:Icon,title,text,href},i)=><Link href={href} key={title} className="group rounded-xl text-center outline-offset-8"><span className={`mx-auto grid size-14 place-items-center rounded-[20px] ${i===0 ? "bg-emerald-50" : "bg-blue-50"}`}><Icon size={29} strokeWidth={1.8} className="text-blue-500 transition-transform group-hover:-translate-y-1 motion-reduce:transform-none"/></span><h3 className={`mt-4 text-sm font-semibold ${i===0 ? "text-emerald-800" : "text-ink"}`}>{title}</h3><p className="mt-2 text-xs leading-[1.9] text-[#75839a]">{text}</p></Link>)}</div></div>
      </section>
      <section className="bg-[#f3faf6] px-5 py-12 sm:px-8"><div className="mx-auto max-w-[1080px]"><div className="text-center"><p className="text-xs font-semibold text-brand-dark">只需 3 步，轻松搞定你的简历</p><h2 className="mt-3 text-2xl font-bold sm:text-[28px]">简单 <span className="text-blue-500">3</span> 步，开启求职之旅</h2></div><div className="mt-8 grid gap-6 md:grid-cols-3 md:gap-12">{steps.map((step,i)=><Link href={step.href} key={step.title} className="relative rounded-[20px] border border-white bg-white/80 p-5 pb-0 transition-shadow hover:shadow-lg"><div className="flex gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-emerald-100 text-xl font-semibold text-emerald-600">{i+1}</span><div><h3 className="pt-1 text-sm font-semibold text-emerald-800">{step.title}</h3><p className="mt-2 text-xs leading-6 text-slate-500">{step.text}</p></div></div><StepIllustration step={i+1}/>{i<2&&<ArrowRight aria-hidden="true" size={20} className="absolute -right-9 top-1/2 hidden text-emerald-400 md:block"/>}</Link>)}</div></div></section>
      <section id="pricing" className="relative isolate scroll-mt-24 overflow-hidden bg-[linear-gradient(120deg,#f1fcf5,white,#f6faff)] px-5 py-12 sm:px-8"><Clover aria-hidden="true" className="absolute -left-4 top-8 -z-10 size-28 -rotate-12 fill-emerald-100 text-emerald-200/70"/><div className="mx-auto max-w-[980px] text-center"><h2 className="text-xl font-semibold sm:text-2xl">好简历，不应该有门槛</h2><p className="mt-3 text-sm text-slate-500">免费使用，无需注册。把时间留给内容，把排版交给 ResumeOK。</p><div className="mt-9 grid grid-cols-2 gap-7 sm:grid-cols-4">{[{icon:LayoutTemplate,value:"3 种",label:"精选简历模板"},{icon:FileText,value:"6 大",label:"可编辑内容模块"},{icon:LockKeyhole,value:"本地保存",label:"简历由你掌握"},{icon:Star,value:"免费",label:"编辑与 PDF 导出"}].map(({icon:Icon,value,label})=><div className="flex items-center justify-center gap-3" key={value}><span className="grid size-11 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-500"><Icon size={21}/></span><div className="text-left"><strong className="text-lg font-semibold text-emerald-700">{value}</strong><p className="mt-1 text-xs text-slate-500">{label}</p></div></div>)}</div></div></section>
    </main>
    <footer id="about" className="scroll-mt-24 border-t border-slate-100 bg-white px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-[1100px] flex-col items-center justify-between gap-5 sm:flex-row"><div className="text-center sm:text-left"><Link href="/" aria-label="ResumeOK 首页"><Brand small/></Link><p className="mt-2 text-xs text-slate-500">让每一份简历，都更接近 Offer。</p></div><p className="max-w-sm text-center text-xs leading-6 text-slate-500 sm:text-right">专注于简单、自由的简历制作。<br/>简历保存在当前浏览器，可导出备份迁移到其他设备。</p><Link href="/editor" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-emerald-700 hover:text-brand">开始写下新的可能<Heart size={15}/></Link></div></footer>
  </div>;
}
