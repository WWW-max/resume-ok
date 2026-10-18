"use client";
import { ui } from "@/lib/ui-styles";
import { useEffect, useState } from "react";
import type { useResumeLibrary } from "@/hooks/useResumeLibrary";
import {
  downloadBackup,
  parseLibrary,
  type ResumeDocument,
} from "@/lib/resume-library";
import {
  Plus,
  Copy,
  Archive,
  RotateCcw,
  Download,
  Upload,
  FileText,
  AlertTriangle,
  Pencil,
  Trash2,
} from "lucide-react";
import { ClearableInput } from "./ClearableField";

type ConfirmAction = {
  type: "archive" | "delete";
  doc: ResumeDocument;
};

export function LibraryPanel({
  store,
  onEdit,
}: {
  store: ReturnType<typeof useResumeLibrary>;
  onEdit?: () => void;
}) {
  const [error, setError] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null,
  );

  useEffect(() => {
    if (!confirmAction) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setConfirmAction(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [confirmAction]);
  return (
    <div className={ui["editor-panel"]}>
      <div className={ui["panel-heading"]}>
        <h1>我的简历</h1>
        <p>简历保存在当前浏览器，建议定期导出备份。</p>
      </div>
      <div className={`${ui["panel-scroll"]} ${ui["library-panel"]}`}>
        <div className={ui["field"]}>
          <label htmlFor="resume-name">当前简历名称</label>
          <ClearableInput
            id="resume-name"
            maxLength={80}
            value={store.active.name}
            clearLabel="清空当前简历名称"
            onClear={() => store.rename("")}
            onChange={(e) => store.rename(e.target.value)}
          />
        </div>
        <div className={ui["button-row"]}>
          <button
            className={ui["outline-green"]}
            disabled={store.library.documents.length >= 100}
            onClick={() => store.add()}
          >
            <Plus size={15} />
            新建空白简历
          </button>
          <button
            className={ui["soft-button"]}
            disabled={store.library.documents.length >= 100}
            onClick={() => store.add(true)}
          >
            <Copy size={15} />
            复制当前简历
          </button>
        </div>
        {store.library.documents
          .filter((d) => !d.archived)
          .map((doc) => (
            <div
              className={`${ui["document-card"]} ${doc.id === store.active.id ? "active" : ""}`}
              key={doc.id}
            >
              <button
                className={ui["document-select"]}
                onClick={() => store.select(doc.id)}
              >
                <FileText size={23} />
                <span>
                  <strong>{doc.name || "未命名简历"}</strong>
                  <small>
                    {doc.data.name || "待填写"} · {doc.data.title || "求职意向"}
                  </small>
                </span>
              </button>
              <button
                className={ui["icon-button"]}
                aria-label={`编辑${doc.name || "未命名简历"}`}
                title="编辑此简历"
                onClick={() => {
                  store.select(doc.id);
                  onEdit?.();
                }}
              >
                <Pencil size={15} />
              </button>
              <button
                className={ui["icon-button"]}
                aria-label={`删除${doc.name || "未命名简历"}`}
                title={
                  store.library.documents.filter((d) => !d.archived).length < 2
                    ? "至少保留一份简历"
                    : "删除简历（可恢复）"
                }
                disabled={
                  store.library.documents.filter((d) => !d.archived).length < 2
                }
                onClick={() => setConfirmAction({ type: "archive", doc })}
              >
                <Archive size={16} />
              </button>
            </div>
          ))}
        <div className={ui["button-row"]}>
          <button
            className={ui["soft-button"]}
            onClick={() => downloadBackup(store.library)}
          >
            <Download size={15} />
            导出 JSON 备份
          </button>
          <label className={`${ui["soft-button"]} ${ui["upload-button"]}`}>
            <Upload size={15} />
            导入备份
            <input
              aria-label="导入简历备份"
              type="file"
              accept=".json,application/json"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                try {
                  if (file.size > 10 * 1024 * 1024)
                    throw new Error("备份文件不能超过 10 MB。");
                  store.importLibrary(parseLibrary(await file.text()));
                  setError("");
                } catch (err) {
                  setError(err instanceof Error ? err.message : "导入失败");
                }
              }}
            />
          </label>
        </div>
        {error && (
          <p className={ui["field-error"]} role="alert">
            {error}
          </p>
        )}
        <details className={ui["archive-list"]}>
          <summary>
            已归档（{store.library.documents.filter((d) => d.archived).length}）
          </summary>
          {store.library.documents
            .filter((d) => d.archived)
            .map((doc) => (
              <div className={ui["section-heading"]} key={doc.id}>
                <span className="truncate mr-2">
                  {doc.name || "未命名简历"}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    className={ui["text-button"]}
                    onClick={() => store.restore(doc.id)}
                  >
                    <RotateCcw size={14} />
                    恢复
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-[12px] text-red-600 hover:text-red-700 p-1 min-h-11 cursor-pointer"
                    title="永久删除此简历"
                    onClick={() => setConfirmAction({ type: "delete", doc })}
                  >
                    <Trash2 size={14} />
                    永久删除
                  </button>
                </div>
              </div>
            ))}
        </details>
      </div>

      {confirmAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          onClick={() => setConfirmAction(null)}
        >
          <div
            className="w-full max-w-sm rounded-[12px] bg-white p-5 shadow-2xl border border-line animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="size-9 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} />
              </div>
              <h2
                id="confirm-modal-title"
                className="text-[15px] font-bold text-ink"
              >
                {confirmAction.type === "delete"
                  ? "确认永久删除？"
                  : "确认删除此简历？"}
              </h2>
            </div>
            <p className="text-[13px] text-muted-ink leading-relaxed mb-5">
              {confirmAction.type === "delete" ? (
                <>
                  此操作不可逆！「
                  <strong className="text-ink font-semibold">
                    {confirmAction.doc.name || "未命名简历"}
                  </strong>
                  」将被彻底从数据库中清除，无法再次恢复。确定要永久删除吗？
                </>
              ) : (
                <>
                  确定要删除「
                  <strong className="text-ink font-semibold">
                    {confirmAction.doc.name || "未命名简历"}
                  </strong>
                  」吗？删除后将移至下方已归档列表，可随时恢复。
                </>
              )}
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                className={ui["soft-button"]}
                onClick={() => setConfirmAction(null)}
              >
                取消
              </button>
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center gap-1.5 text-[13px] rounded-[8px] px-4 py-2 whitespace-nowrap bg-red-600 text-white font-medium hover:bg-red-700 transition-colors shadow-2xs"
                onClick={() => {
                  if (confirmAction.type === "delete") {
                    store.remove(confirmAction.doc.id);
                  } else {
                    store.archive(confirmAction.doc.id);
                  }
                  setConfirmAction(null);
                }}
              >
                {confirmAction.type === "delete" ? "彻底删除" : "确认删除"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
