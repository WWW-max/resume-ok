"use client";
import { ui } from "@/lib/ui-styles";
import { useEffect, useId, useRef, useState } from "react";
import { ResumeData } from "@/lib/resume-data";
import { Upload, UserRound, Trash2 } from "lucide-react";
const fields = [
  ["name", "姓名", "张三", "text"],
  ["title", "求职意向", "前端工程师", "text"],
  ["phone", "手机号", "138-0000-0000", "tel"],
  ["email", "邮箱", "name@example.com", "email"],
  ["location", "所在城市", "北京市", "text"],
  ["github", "GitHub", "github.com/username", "text"],
  ["website", "个人网站", "https://example.com", "url"],
] as const;
export function BasicInfoForm({
  data,
  onChange,
}: {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}) {
  const id = useId();
  const [error, setError] = useState("");
  const current = useRef({ data, onChange });
  const uploadSequence = useRef(0);
  useEffect(() => {
    current.current = { data, onChange };
  }, [data, onChange]);
  useEffect(
    () => () => {
      uploadSequence.current++;
    },
    [],
  );
  async function upload(file?: File) {
    if (!file) return;
    const sequence = ++uploadSequence.current;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("请选择 JPG、PNG 或 WebP 图片。");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("图片不能超过 5 MB。");
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      const ratio = Math.min(1, 400 / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.round(bitmap.width * ratio);
      canvas.height = Math.round(bitmap.height * ratio);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("图片处理失败");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      if (sequence !== uploadSequence.current) return;
      current.current.onChange({
        ...current.current.data,
        avatar: canvas.toDataURL("image/jpeg", 0.85),
      });
      setError("");
    } catch {
      if (sequence !== uploadSequence.current) return;
      setError("无法读取图片，请换一张图片重试。");
    }
  }
  return (
    <div className={ui["resume-form"]}>
      <div className={ui["avatar-editor"]}>
        {data.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- locally uploaded thumbnail
          <img src={data.avatar} alt="简历头像" />
        ) : (
          <div className={ui["avatar-placeholder"]}>
            <UserRound size={30} />
          </div>
        )}
        <div>
          <label className={`${ui["soft-button"]} ${ui["upload-button"]}`}>
            <Upload size={15} />
            上传头像
            <input
              aria-label="上传头像"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                void upload(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
          <p>JPG / PNG / WebP，最大 5 MB</p>
          {data.avatar && (
            <button
              className={ui["text-button"]}
              onClick={() => {
                uploadSequence.current++;
                onChange({ ...data, avatar: "" });
              }}
            >
              <Trash2 size={13} />
              移除头像
            </button>
          )}
        </div>
      </div>
      {error && (
        <p className={ui["field-error"]} role="alert">
          {error}
        </p>
      )}
      <div className={ui["form-grid"]}>
        {fields.map(([key, label, placeholder, type]) => {
          const invalid =
            key === "email" &&
            !!data.email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
          return (
            <div
              className={`${ui["field"]} ${key === "website" ? "wide" : ""}`}
              key={key}
            >
              <label htmlFor={`${id}-${key}`}>{label}</label>
              <input
                id={`${id}-${key}`}
                type={type}
                value={data[key]}
                placeholder={placeholder}
                aria-invalid={invalid}
                aria-describedby={invalid ? `${id}-email-error` : undefined}
                onChange={(e) => onChange({ ...data, [key]: e.target.value })}
              />
              {invalid && (
                <p id={`${id}-email-error`} className={ui["field-error"]}>
                  请输入有效邮箱。
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
