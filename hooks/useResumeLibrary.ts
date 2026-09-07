"use client";
import { useEffect, useReducer, useRef, useState } from "react";
import {
  blankResume,
  createLibrary,
  parseLibrary,
  STORAGE_KEY,
  type ResumeLibrary,
  type ResumeDocument,
} from "@/lib/resume-library";
import type { ResumeData } from "@/lib/resume-data";
import { libraryReducer } from "@/lib/resume-history";
export function useResumeLibrary() {
  const [state, dispatch] = useReducer(libraryReducer, undefined, () => ({
    library: createLibrary(),
    past: [],
    future: [],
    ready: false,
    groupAt: 0,
  }));
  const [saveStatus, setSaveStatus] = useState("正在读取本地简历…");
  const [loadError, setLoadError] = useState("");
  const [blocked, setBlocked] = useState(false);
  const persisted = useRef<ResumeLibrary | null>(null);
  useEffect(() => {
    // Client-only storage is hydrated after SSR; one initialization render is intentional.
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const library = raw ? parseLibrary(raw) : createLibrary();
      persisted.current = library;
      dispatch({ type: "load", library });
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate browser storage once after SSR
      setSaveStatus(raw ? "已保存到本机" : "本地自动保存已开启");
    } catch {
      setLoadError(
        "本地简历读取失败。原始数据未覆盖；可导出当前内容备份，或清理浏览器存储后重试。",
      );
      setBlocked(true);
      dispatch({ type: "load", library: createLibrary() });
      setSaveStatus("自动保存不可用");
    }
  }, []);
  useEffect(() => {
    if (!state.ready || blocked) return;
    function persist() {
      if (persisted.current === state.library) return;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state.library));
        persisted.current = state.library;
        setSaveStatus("已保存到本机");
      } catch {
        setSaveStatus("保存失败，请导出 JSON 备份");
      }
    }
    const timer = setTimeout(persist, 400);
    window.addEventListener("pagehide", persist);
    const visibility = () => {
      if (document.visibilityState === "hidden") persist();
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pagehide", persist);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [state.library, state.ready, blocked]);
  const active = state.library.documents.find(
    (d) => d.id === state.library.activeId,
  )!;
  function commit(
    update: (library: ResumeLibrary) => ResumeLibrary,
    group = false,
  ) {
    if (!state.ready) return;
    setSaveStatus(blocked ? "自动保存不可用" : "保存中…");
    dispatch({ type: "edit", update, at: Date.now(), group });
  }
  function updateData(data: ResumeData) {
    const id = active.id,
      updatedAt = new Date().toISOString();
    commit(
      (library) => ({
        ...library,
        documents: library.documents.map((d) =>
          d.id === id ? { ...d, data, updatedAt } : d,
        ),
      }),
      true,
    );
  }
  function add(copy = false) {
    if (state.library.documents.length >= 100) return;
    const doc: ResumeDocument = {
      id: crypto.randomUUID(),
      name: copy ? `${active.name} 副本` : "未命名简历",
      data: copy ? structuredClone(active.data) : blankResume(),
      updatedAt: new Date().toISOString(),
    };
    commit((library) =>
      library.documents.length >= 100
        ? library
        : {
            ...library,
            activeId: doc.id,
            documents: [...library.documents, doc],
          },
    );
  }
  function rename(name: string) {
    const id = active.id,
      updatedAt = new Date().toISOString();
    commit(
      (library) => ({
        ...library,
        documents: library.documents.map((d) =>
          d.id === id ? { ...d, name, updatedAt } : d,
        ),
      }),
      true,
    );
  }
  function archive(id: string) {
    commit((library) => {
      const next = library.documents.find((d) => d.id !== id && !d.archived);
      return next
        ? {
            ...library,
            activeId: library.activeId === id ? next.id : library.activeId,
            documents: library.documents.map((d) =>
              d.id === id ? { ...d, archived: true } : d,
            ),
          }
        : library;
    });
  }
  function restore(id: string) {
    commit((library) => ({
      ...library,
      documents: library.documents.map((d) =>
        d.id === id ? { ...d, archived: false } : d,
      ),
    }));
  }
  function importLibrary(imported: ResumeLibrary) {
    if (state.library.documents.length + imported.documents.length > 100)
      throw new Error("简历总数不能超过 100 份。");
    const docs = imported.documents.map((d) => ({
      ...d,
      id: crypto.randomUUID(),
      archived: false,
    }));
    commit((library) =>
      library.documents.length + docs.length > 100
        ? library
        : {
            ...library,
            activeId: docs[0].id,
            documents: [...library.documents, ...docs],
          },
    );
  }
  return {
    ...state,
    active,
    saveStatus,
    loadError,
    updateData,
    add,
    rename,
    archive,
    restore,
    importLibrary,
    select: (id: string) => {
      if (id !== active.id) commit((library) => ({ ...library, activeId: id }));
    },
    undo: () => {
      if (state.past.length) {
        setSaveStatus(blocked ? "自动保存不可用" : "保存中…");
        dispatch({ type: "undo" });
      }
    },
    redo: () => {
      if (state.future.length) {
        setSaveStatus(blocked ? "自动保存不可用" : "保存中…");
        dispatch({ type: "redo" });
      }
    },
  };
}
