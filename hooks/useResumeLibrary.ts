"use client";
import { useEffect, useReducer, useRef, useState } from "react";
import { blankResume, createLibrary, parseLibrary, STORAGE_KEY, type ResumeLibrary, type ResumeDocument } from "@/lib/resume-library";
import type { ResumeData } from "@/lib/resume-data";
type State = { library: ResumeLibrary; past: ResumeLibrary[]; future: ResumeLibrary[]; ready: boolean; groupAt: number };
type Action = {type:"load";library:ResumeLibrary} | {type:"edit";library:ResumeLibrary;at:number;group:boolean} | {type:"undo"} | {type:"redo"};
function reducer(state: State, action: Action): State {
  if(action.type === "load") return {...state,library:action.library,past:[],future:[],ready:true};
  if(action.type === "undo") { const last=state.past.at(-1);return last ? {...state,library:last,past:state.past.slice(0,-1),future:[state.library,...state.future],groupAt:0} : state; }
  if(action.type === "redo") { const next=state.future[0];return next ? {...state,library:next,past:[...state.past,state.library],future:state.future.slice(1),groupAt:0} : state; }
  if(JSON.stringify(action.library) === JSON.stringify(state.library)) return state;
  return {...state,library:action.library,past:action.group && action.at-state.groupAt<650 ? state.past : [...state.past,state.library].slice(-40),future:[],groupAt:action.group ? action.at : 0};
}
export function useResumeLibrary() {
  const [state,dispatch] = useReducer(reducer,undefined,()=>({library:createLibrary(),past:[],future:[],ready:false,groupAt:0}));
  const [saveStatus,setSaveStatus]=useState("正在读取本地简历…");
  const [loadError,setLoadError]=useState("");
  const [blocked,setBlocked]=useState(false);
  const persisted = useRef<ResumeLibrary | null>(null);
  useEffect(()=>{
    // Client-only storage is hydrated after SSR; one initialization render is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try {const raw=localStorage.getItem(STORAGE_KEY);const library=raw ? parseLibrary(raw) : createLibrary();persisted.current=library;dispatch({type:"load",library});setSaveStatus(raw ? "已保存到本机" : "本地自动保存已开启");}
    catch {setLoadError("本地简历读取失败。原始数据未覆盖；可导出当前内容备份，或清理浏览器存储后重试。");setBlocked(true);dispatch({type:"load",library:createLibrary()});setSaveStatus("自动保存不可用");}
  },[]);
  useEffect(()=>{
    if(!state.ready || blocked) return;
    function persist() {
      if(persisted.current === state.library) return;
      try {localStorage.setItem(STORAGE_KEY,JSON.stringify(state.library));persisted.current=state.library;setSaveStatus("已保存到本机");}
      catch {setSaveStatus("保存失败，请导出 JSON 备份");}
    }
    const timer=setTimeout(persist,400);
    window.addEventListener("pagehide",persist);
    const visibility=()=>{if(document.visibilityState === "hidden")persist();};
    document.addEventListener("visibilitychange",visibility);
    return ()=>{clearTimeout(timer);window.removeEventListener("pagehide",persist);document.removeEventListener("visibilitychange",visibility);persist();};
  },[state.library,state.ready,blocked]);
  const active=state.library.documents.find(d=>d.id===state.library.activeId)!;
  function commit(library:ResumeLibrary,group=false) { if(!state.ready)return;setSaveStatus(blocked ? "自动保存不可用" : "保存中…");dispatch({type:"edit",library,at:Date.now(),group}); }
  function updateData(data:ResumeData) {commit({...state.library,documents:state.library.documents.map(d=>d.id===active.id ? {...d,data,updatedAt:new Date().toISOString()} : d)},true);}
  function add(copy=false) {if(state.library.documents.length>=100)return;const doc:ResumeDocument={id:crypto.randomUUID(),name:copy ? `${active.name} 副本` : "未命名简历",data:copy ? structuredClone(active.data) : blankResume(),updatedAt:new Date().toISOString()};commit({...state.library,activeId:doc.id,documents:[...state.library.documents,doc]});}
  function rename(name:string) {commit({...state.library,documents:state.library.documents.map(d=>d.id===active.id ? {...d,name,updatedAt:new Date().toISOString()} : d)},true);}
  function archive(id:string) {const next=state.library.documents.find(d=>d.id!==id && !d.archived);if(!next)return;commit({...state.library,activeId:state.library.activeId===id ? next.id : state.library.activeId,documents:state.library.documents.map(d=>d.id===id ? {...d,archived:true} : d)});}
  function restore(id:string) {commit({...state.library,documents:state.library.documents.map(d=>d.id===id ? {...d,archived:false} : d)});}
  function importLibrary(library:ResumeLibrary) {if(state.library.documents.length+library.documents.length>100)throw new Error("简历总数不能超过 100 份。");const docs=library.documents.map(d=>({...d,id:crypto.randomUUID(),archived:false}));commit({...state.library,activeId:docs[0].id,documents:[...state.library.documents,...docs]});}
  return { ...state,active,saveStatus,loadError,updateData,add,rename,archive,restore,importLibrary,select:(id:string)=>commit({...state.library,activeId:id}),undo:()=>dispatch({type:"undo"}),redo:()=>dispatch({type:"redo"}) };
}
