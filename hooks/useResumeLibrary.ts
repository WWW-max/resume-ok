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

export function useResumeLibrary(userId: string) {
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
  const loggingOut = useRef(false);

  useLayoutEffect(() => {
    pending.current =
      state.ready && !blocked && !loggingOut.current ? state.library : null;
  }, [state.library, state.ready, blocked]);

  const drainSaveQueue = useCallback(async () => {
    if (saving.current || loggingOut.current) return;
    saving.current = true;
    try {
      while (queued.current && !loggingOut.current) {
        const library = queued.current;
        queued.current = null;
        setSaveStatus("正在保存到数据库…");
        let response: Response;
        try {
          response = await fetch("/api/resumes", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, library }),
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
          if (response.status === 409) {
            window.location.reload();
            return;
          }
          if (!queued.current) queued.current = library;
          setSaveStatus(await responseMessage(response));
          return;
        }
        persisted.current = library;
        if (!queued.current) {
          setSaveStatus("已保存到账号");
        }
      }
    } finally {
      saving.current = false;
    }
  }, [userId]);

  const queueSave = useCallback(
    (library: ResumeLibrary) => {
      if (loggingOut.current) return;
      queued.current = library;
      void drainSaveQueue();
    },
    [drainSaveQueue],
  );

  const cancelPendingSaves = useCallback(() => {
    loggingOut.current = true;
    pending.current = null;
    queued.current = null;
  }, []);

  const flushBeforeLogout = useCallback(async () => {
    const latest = pending.current ?? queued.current;
    loggingOut.current = true;
    pending.current = null;
    queued.current = null;
    if (!latest || latest === persisted.current) return;
    try {
      const response = await fetch("/api/resumes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, library: latest }),
      });
      if (response.ok) persisted.current = latest;
    } catch {
      // Ignore network error during logout; local session is ending.
    }
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    loggingOut.current = false;
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
        if (typeof body.userId === "string" && body.userId !== userId) {
          window.location.reload();
          return;
        }
        if (body.library) {
          const library = parseLibrary(JSON.stringify(body.library));
          persisted.current = library;
          setLoadError("");
          setBlocked(false);
          dispatch({ type: "load", library });
          setSaveStatus("已读取账号数据");
          return;
        }
        const library = createLibrary();
        persisted.current = null;
        setLoadError("");
        setBlocked(false);
        dispatch({ type: "load", library });
        setSaveStatus("数据库自动保存已开启");
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
  }, [queueSave, userId]);

  useEffect(() => {
    if (!state.ready || blocked || persisted.current === state.library) return;
    const timer = window.setTimeout(() => queueSave(state.library), 500);
    const keepalive = () => {
      if (loggingOut.current) return;
      const latest = pending.current;
      if (!latest || latest === persisted.current) return;
      void fetch("/api/resumes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, library: latest }),
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
  }, [state.library, state.ready, blocked, queueSave, userId]);

  useEffect(
    () => () => {
      if (loggingOut.current) return;
      const latest = pending.current;
      if (!latest || latest === persisted.current) return;
      void fetch("/api/resumes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, library: latest }),
        keepalive: true,
      });
    },
    [userId],
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

  function addDocument(name: string, docData: ResumeData) {
    if (state.library.documents.length >= 100) return;
    const document: ResumeDocument = {
      id: crypto.randomUUID(),
      name: name.trim().slice(0, 80) || "英文简历",
      data: structuredClone(docData),
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

  function remove(id: string) {
    commit((library) => {
      if (library.documents.length <= 1) return library;
      const remaining = library.documents.filter(
        (document) => document.id !== id,
      );
      const nextActive =
        library.activeId === id
          ? remaining.find((doc) => !doc.archived)?.id || remaining[0].id
          : library.activeId;
      return {
        ...library,
        activeId: nextActive,
        documents: remaining,
      };
    });
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
    flushBeforeLogout,
    cancelPendingSaves,
    updateData,
    add,
    addDocument,
    rename,
    archive,
    restore,
    remove,
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
