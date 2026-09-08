"use client";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState,
} from "react";
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

async function responseMessage(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return body?.error?.message || "数据库保存失败，请稍后重试。";
  } catch {
    return "数据库保存失败，请稍后重试。";
  }
}

export function useResumeLibrary() {
  const [state, dispatch] = useReducer(libraryReducer, undefined, () => ({
    library: createLibrary(),
    past: [],
    future: [],
    ready: false,
    groupAt: 0,
  }));
  const [saveStatus, setSaveStatus] = useState("正在读取账号简历…");
  const [loadError, setLoadError] = useState("");
  const [blocked, setBlocked] = useState(false);
  const persisted = useRef<ResumeLibrary | null>(null);
  const pending = useRef<ResumeLibrary | null>(null);
  const queued = useRef<ResumeLibrary | null>(null);
  const saving = useRef(false);
  const legacyPending = useRef(false);

  useLayoutEffect(() => {
    pending.current = state.ready && !blocked ? state.library : null;
  }, [state.library, state.ready, blocked]);

  const drainSaveQueue = useCallback(async () => {
    if (saving.current) return;
    saving.current = true;
    try {
      while (queued.current) {
        const library = queued.current;
        queued.current = null;
        setSaveStatus("正在保存到数据库…");
        let response: Response;
        try {
          response = await fetch("/api/resumes", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ library }),
          });
        } catch {
          if (!queued.current) queued.current = library;
          setSaveStatus("数据库保存失败，请检查服务状态");
          return;
        }
        if (!response.ok) {
          if (response.status === 401) {
            window.location.replace(
              `/login?next=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`,
            );
            return;
          }
          if (!queued.current) queued.current = library;
          setSaveStatus(await responseMessage(response));
          return;
        }
        persisted.current = library;
        if (legacyPending.current) {
          localStorage.removeItem(STORAGE_KEY);
          legacyPending.current = false;
          setSaveStatus("旧版本地简历已迁移到当前账号");
        } else if (!queued.current) {
          setSaveStatus("已保存到账号");
        }
      }
    } finally {
      saving.current = false;
    }
  }, []);

  const queueSave = useCallback(
    (library: ResumeLibrary) => {
      queued.current = library;
      void drainSaveQueue();
    },
    [drainSaveQueue],
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/resumes", {
          cache: "no-store",
          credentials: "same-origin",
        });
        if (response.status === 401) {
          window.location.replace(
            `/login?next=${encodeURIComponent(`${window.location.pathname}${window.location.search}`)}`,
          );
          return;
        }
        if (!response.ok) throw new Error(await responseMessage(response));
        const body = await response.json();
        if (cancelled) return;
        if (body.library) {
          const library = parseLibrary(JSON.stringify(body.library));
          persisted.current = library;
          localStorage.removeItem(STORAGE_KEY);
          dispatch({ type: "load", library });
          setSaveStatus("已读取账号数据");
          return;
        }
        const raw = localStorage.getItem(STORAGE_KEY);
        const library = raw ? parseLibrary(raw) : createLibrary();
        legacyPending.current = Boolean(raw);
        persisted.current = null;
        dispatch({ type: "load", library });
        setSaveStatus(
          raw ? "正在迁移旧版本地简历…" : "数据库自动保存已开启",
        );
        queueSave(library);
      } catch (cause) {
        if (cancelled) return;
        setLoadError(
          cause instanceof Error
            ? `读取账号简历失败：${cause.message}`
            : "读取账号简历失败，请刷新重试。",
        );
        setBlocked(true);
        dispatch({ type: "load", library: createLibrary() });
        setSaveStatus("数据库自动保存不可用");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [queueSave]);

  useEffect(() => {
    if (!state.ready || blocked || persisted.current === state.library) return;
    const timer = window.setTimeout(() => queueSave(state.library), 500);
    const keepalive = () => {
      const latest = pending.current;
      if (!latest || latest === persisted.current) return;
      void fetch("/api/resumes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ library: latest }),
        keepalive: true,
      });
    };
    const visibility = () => {
      if (document.visibilityState === "hidden") keepalive();
    };
    window.addEventListener("pagehide", keepalive);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pagehide", keepalive);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [state.library, state.ready, blocked, queueSave]);

  useEffect(
    () => () => {
      const latest = pending.current;
      if (!latest || latest === persisted.current) return;
      void fetch("/api/resumes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ library: latest }),
        keepalive: true,
      });
    },
    [],
  );

  const active = state.library.documents.find(
    (document) => document.id === state.library.activeId,
  )!;

  function commit(
    update: (library: ResumeLibrary) => ResumeLibrary,
    group = false,
  ) {
    if (!state.ready) return;
    setSaveStatus(blocked ? "数据库自动保存不可用" : "等待保存…");
    dispatch({ type: "edit", update, at: Date.now(), group });
  }

  function updateData(data: ResumeData) {
    const id = active.id;
    const updatedAt = new Date().toISOString();
    commit(
      (library) => ({
        ...library,
        documents: library.documents.map((document) =>
          document.id === id ? { ...document, data, updatedAt } : document,
        ),
      }),
      true,
    );
  }

  function add(copy = false) {
    if (state.library.documents.length >= 100) return;
    const document: ResumeDocument = {
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
            activeId: document.id,
            documents: [...library.documents, document],
          },
    );
  }

  function rename(name: string) {
    const id = active.id;
    const updatedAt = new Date().toISOString();
    commit(
      (library) => ({
        ...library,
        documents: library.documents.map((document) =>
          document.id === id ? { ...document, name, updatedAt } : document,
        ),
      }),
      true,
    );
  }

  function archive(id: string) {
    commit((library) => {
      const next = library.documents.find(
        (document) => document.id !== id && !document.archived,
      );
      return next
        ? {
            ...library,
            activeId: library.activeId === id ? next.id : library.activeId,
            documents: library.documents.map((document) =>
              document.id === id ? { ...document, archived: true } : document,
            ),
          }
        : library;
    });
  }

  function restore(id: string) {
    commit((library) => ({
      ...library,
      documents: library.documents.map((document) =>
        document.id === id ? { ...document, archived: false } : document,
      ),
    }));
  }

  function importLibrary(imported: ResumeLibrary) {
    if (state.library.documents.length + imported.documents.length > 100)
      throw new Error("简历总数不能超过 100 份。");
    const documents = imported.documents.map((document) => ({
      ...document,
      id: crypto.randomUUID(),
      archived: false,
    }));
    commit((library) =>
      library.documents.length + documents.length > 100
        ? library
        : {
            ...library,
            activeId: documents[0].id,
            documents: [...library.documents, ...documents],
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
        setSaveStatus(blocked ? "数据库自动保存不可用" : "等待保存…");
        dispatch({ type: "undo" });
      }
    },
    redo: () => {
      if (state.future.length) {
        setSaveStatus(blocked ? "数据库自动保存不可用" : "等待保存…");
        dispatch({ type: "redo" });
      }
    },
  };
}
