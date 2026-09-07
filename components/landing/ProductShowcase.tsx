import Image from "next/image";
import { Clover, Check, Download, UserRound, FileText, Star, Settings } from "lucide-react";

export function ProductShowcase() {
  return <div className="relative mx-auto w-full max-w-[650px] pb-5 pr-12 sm:pr-14 lg:pb-2">
    <div className="pointer-events-none absolute -inset-8 -z-10 rounded-full bg-emerald-100/60 blur-3xl" aria-hidden="true"/>
    <div className="overflow-hidden rounded-xl border border-white/90 bg-white shadow-[0_15px_60px_#28657618]">
      <Image src="/designs/web-ui.png" alt="ResumeOK 编辑界面示意：左侧管理简历模块，右侧实时预览简历" width={1536} height={1024} sizes="(max-width: 640px) 85vw, (max-width: 1024px) 70vw, 550px" loading="eager" className="h-auto w-full"/>
    </div>
    <div aria-hidden="true" className="absolute -right-1 bottom-0 w-[23%] min-w-[85px] rotate-2 rounded-[22px] border-[3px] border-slate-300 bg-white p-2 shadow-[0_12px_25px_#24495520] sm:rounded-[26px] sm:p-2.5">
      <div className="mx-auto mb-3 h-1 w-6 rounded-full bg-slate-300"/>
      <div className="flex items-center gap-1 text-[7px] font-bold text-ink"><Clover size={11} className="fill-emerald-300 text-emerald-500"/>Resume<span className="-ml-1 text-brand">OK</span></div>
      <div className="mt-3 flex items-start justify-between gap-1"><div><strong className="text-[9px] text-ink">张一鸣</strong><p className="text-[5px] text-slate-500">前端开发工程师</p></div><div className="grid size-6 place-items-center rounded-md bg-blue-50 text-blue-500"><UserRound size={18}/></div></div>
      <div className="mx-auto my-3 grid aspect-square w-[54%] place-content-center rounded-full border-[3px] border-emerald-400 text-center"><span className="text-sm font-bold leading-tight text-ink">85<span className="text-[6px]">分</span></span><span className="text-[5px] text-slate-500">完整度示意</span></div>
      <div className="space-y-2">{["基本信息","工作经历","项目经历"].map(t=><div key={t} className="flex items-center gap-1 text-[6px] text-slate-500"><Check size={7} className="text-emerald-500"/>{t}<span className="ml-auto h-1 w-4 rounded bg-emerald-100"/></div>)}</div>
      <div className="mt-4 flex items-center justify-center gap-1 rounded-full bg-brand py-1.5 text-[6px] text-white"><Download size={7}/>导出简历</div>
      <div className="mt-3 flex justify-around border-t border-slate-100 pt-2 text-slate-400"><FileText size={9}/><Star size={9}/><Settings size={9}/></div>
    </div>
    <span className="absolute -right-8 -top-12 hidden rotate-[-10deg] text-center font-serif text-sm italic leading-6 tracking-wider text-emerald-700 xl:block">让好简历<br/>带你去更好的地方 ♡</span>
  </div>;
}
