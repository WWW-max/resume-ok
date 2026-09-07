"use client";
import { ui } from "@/lib/ui-styles";
import { useState } from "react";
import type { useResumeLibrary } from "@/hooks/useResumeLibrary";
import { downloadBackup, parseLibrary } from "@/lib/resume-library";
import {
  Plus,
  Copy,
  Archive,
  RotateCcw,
  Download,
  Upload,
  FileText,
  Check,
} from "lucide-react";
export function LibraryPanel({
  store,
}: {
  store: ReturnType<typeof useResumeLibrary>;
}) {
  const [error, setError] = useState("");
  return (
    <div className={ui["editor-panel"]}>
      <div className={ui["panel-heading"]}>
        <h1>我的简历</h1>
        <p>简历保存在当前浏览器，建议定期导出备份。</p>
      </div>
      <div className={`${ui["panel-scroll"]} ${ui["library-panel"]}`}>
        <div className={ui["field"]}>
          <label htmlFor="resume-name">当前简历名称</label>
          <input
            id="resume-name"
            maxLength={80}
            value={store.active.name}
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
                {doc.id === store.active.id && <Check size={15} />}
              </button>
              <button
                className={ui["icon-button"]}
                aria-label={`归档${doc.name}`}
                title="归档（可恢复）"
                disabled={
                  store.library.documents.filter((d) => !d.archived).length < 2
                }
                onClick={() => store.archive(doc.id)}
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
                <span>{doc.name}</span>
                <button
                  className={ui["text-button"]}
                  onClick={() => store.restore(doc.id)}
                >
                  <RotateCcw size={14} />
                  恢复
                </button>
              </div>
            ))}
        </details>
      </div>
    </div>
  );
}
