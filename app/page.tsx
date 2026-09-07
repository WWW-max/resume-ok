"use client";
import { useRef, useState } from "react";
import { useResumeLibrary } from "@/hooks/useResumeLibrary";
import { LibraryPanel } from "@/components/editor/LibraryPanel";
import { EditorPanel } from "@/components/editor/EditorPanel";
import { PreviewCanvas } from "@/components/preview/PreviewCanvas";
import { TemplatePanel } from "@/components/editor/TemplatePanel";
import { Brand } from "@/components/Brand";
import { Download, Eye, PencilLine, LayoutGrid, Sparkles, Files, Settings, Monitor, ChevronDown, Lightbulb, Undo2, Redo2 } from "lucide-react";
export default function Home() {
  const store = useResumeLibrary();
  const data = store.active.data;
  const setData = store.updateData;
  const [view, setView] = useState("editor");
  const [previewOnly, setPreviewOnly] = useState(false);
  const [zoom,setZoom] = useState<number | "fit">("fit");
  const [exporting,setExporting] = useState(false);
  const [exportError,setExportError] = useState("");
  async function download() {
    if(!previewRef.current || exporting)return;
    setExporting(true);setExportError("");
    try {const {exportResumePdf}=await import("@/lib/export-pdf");await exportResumePdf(previewRef.current,`${data.name || "我的"}_简历`);}catch(error){setExportError(error instanceof Error ? error.message : "导出失败，请重试或使用打印。");}finally{setExporting(false);}
  }
  const previewRef = useRef<HTMLDivElement>(null);
  return <div className={`workspace ${previewOnly ? "preview-only" : ""}`}>
    <header className="topbar"><Brand /><span className="tagline">让每一份简历，都更接近 Offer</span><div className="top-actions"><button className="soft-button" onClick={() => setPreviewOnly(!previewOnly)}><Eye size={17} />{previewOnly ? "返回编辑" : "预览"}</button><button className="soft-button" onClick={() => setView("assistant")}><Lightbulb size={17} />助手</button><button className="primary-button" disabled={exporting || !store.ready} onClick={download}><Download size={17} />{exporting ? "导出中…" : "下载简历"}</button><button className="profile-button" aria-label="打开设置" onClick={() => setView("settings")}><span>{data.name.slice(0,1) || "我"}</span><ChevronDown size={14} /></button></div></header>
    {exportError && <div className="export-error" role="alert">{exportError}<button onClick={()=>window.print()}>使用浏览器打印</button><button onClick={()=>setExportError("")}>关闭</button></div>}<div className="save-status" role="status">{store.loadError || store.saveStatus}</div><div className="workspace-body" inert={!store.ready}><nav className="side-nav" aria-label="主导航">{[{id:"editor",label:"编辑简历",icon:PencilLine},{id:"templates",label:"模板库",icon:LayoutGrid},{id:"assistant",label:"简历优化",icon:Sparkles},{id:"resumes",label:"我的简历",icon:Files},{id:"settings",label:"设置",icon:Settings}].map(({id,label,icon:Icon}) => <button key={id} className={view===id ? "active" : ""} onClick={() => {setView(id);setPreviewOnly(false);}}><Icon size={21} /><span>{label}</span></button>)}</nav>
    <aside className="editing-column">{view === "editor" ? <EditorPanel key={store.active.id} data={data} onChange={setData} onAssistant={() => setView("assistant")} /> : view === "templates" ? <TemplatePanel data={data} onChange={setData} /> : view === "resumes" ? <LibraryPanel store={store} /> : <div className="panel-heading"><h1>{({templates:"模板库",assistant:"简历助手",resumes:"我的简历",settings:"设置"} as Record<string,string>)[view]}</h1><p>当前简历：{data.name} · {data.title}</p><button className="back-button" onClick={() => setView("editor")}>返回编辑简历</button></div>}</aside>
    <main className="preview-column" aria-label="简历预览"><div className="preview-toolbar"><div className="toolbar-group"><button className="icon-button" aria-label="撤销" disabled={!store.past.length} onClick={store.undo}><Undo2 size={17}/></button><button className="icon-button" aria-label="重做" disabled={!store.future.length} onClick={store.redo}><Redo2 size={17}/></button><Monitor size={18} /><select className="toolbar-pill" aria-label="预览缩放" value={zoom} onChange={e=>setZoom(e.target.value==="fit" ? "fit" : Number(e.target.value))}><option value="fit">自适应</option>{[50,75,100,125,150].map(z=><option key={z} value={z}>{z}%</option>)}</select></div><div className="toolbar-group"><button className="blue-button" onClick={() => setView("templates")}><LayoutGrid size={15} />模板库</button><button className="blue-button" onClick={() => setView("assistant")}><Sparkles size={15} />简历检查</button><span className="toolbar-pill">A4 (210 × 297mm)</span></div></div><PreviewCanvas zoom={zoom} data={data} previewRef={previewRef} /></main>
    </div>
  </div>;
}
