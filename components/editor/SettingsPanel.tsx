"use client";
import { ui } from "@/lib/ui-styles";
import type { ResumeData } from "@/lib/resume-data";
import {
  defaultAppearance,
  accentColors,
  type ResumeAppearance,
} from "@/lib/resume-appearance";
import { Check, RotateCcw, WandSparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
export function SettingsPanel({
  data,
  onChange,
  onSmartOnePage,
}: {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
  onSmartOnePage?: () => void;
}) {
  const appearance = { ...defaultAppearance, ...data.appearance };
  function update(patch: Partial<ResumeAppearance>) {
    onChange({ ...data, appearance: { ...appearance, ...patch } });
  }
  return (
    <div className={ui["editor-panel"]}>
      <div className={ui["panel-heading"]}>
        <h1>排版设置</h1>
        <p>微调细节，找到最适合你的呈现方式。</p>
      </div>
      <div className={`${ui["panel-scroll"]} ${ui["settings-panel"]}`}>
        {onSmartOnePage && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#cde9d7] bg-[#f4fbf6] p-3.5">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#153a22]">
                智能一页排版
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-ink">
                当简历超出 A4 一页不多时，自动微调行距与页边距收敛至一页
              </p>
            </div>
            <Button
              type="button"
              onClick={onSmartOnePage}
              className="h-9 shrink-0 gap-1.5 rounded-lg bg-brand px-3 py-2 text-xs font-medium text-white hover:bg-brand-dark"
            >
              <WandSparkles size={14} />
              智能一页
            </Button>
          </div>
        )}
        <fieldset>
          <legend>强调色</legend>
          <div className={ui["color-options"]}>
            {(
              Object.keys(accentColors) as Array<keyof typeof accentColors>
            ).map((color) => (
              <button
                key={color}
                className={`${ui["color-swatch"]} ${{ none: "bg-white text-neutral-800", green: "bg-[#15934b]", fresh: "bg-[#16a34a]", forest: "bg-[#166534]" }[color]}`}
                aria-label={`${{ none: "无色（黑白）", green: "品牌绿", fresh: "清新绿", forest: "森林绿" }[color]}`}
                aria-pressed={appearance.accent === color}
                onClick={() => update({ accent: color })}
              >
                {appearance.accent === color ? (
                  <Check size={17} />
                ) : (
                  color === "none" && (
                    <span
                      aria-hidden="true"
                      className="h-px w-5 -rotate-45 bg-neutral-500"
                    />
                  )
                )}
              </button>
            ))}
          </div>
        </fieldset>
        <div className={ui["field"]}>
          <label htmlFor="font-size">正文字号：{appearance.fontSize} px</label>
          <input
            type="range"
            id="font-size"
            min={10}
            max={15}
            step={0.5}
            value={appearance.fontSize}
            onChange={(e) => update({ fontSize: Number(e.target.value) })}
          />
          <p className={ui["subtle"]}>较大字号更易阅读，也可能增加页数。</p>
        </div>
        <div className={ui["field"]}>
          <label htmlFor="resume-spacing">内容间距</label>
          <Select
            value={appearance.spacing}
            onValueChange={(val) =>
              update({ spacing: val as ResumeAppearance["spacing"] })
            }
          >
            <SelectTrigger id="resume-spacing">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="comfortable">舒适 · 更多留白</SelectItem>
              <SelectItem value="compact">紧凑 · 更多内容</SelectItem>
              <SelectItem value="tight">极简紧凑 · 一页优选</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <fieldset>
          <legend>个人信息布局</legend>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["left", "左对齐"],
                ["center", "居中"],
                ["split", "左右布局"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`${ui["soft-button"]} ${appearance.personalInfoLayout === value ? "border-green-500 bg-green-50 text-green-800" : ""}`}
                aria-pressed={appearance.personalInfoLayout === value}
                onClick={() => update({ personalInfoLayout: value })}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>页面边距</legend>
          <div className="grid grid-cols-2 gap-4">
            {(
              [
                ["paddingTop", "上"],
                ["paddingRight", "右"],
                ["paddingBottom", "下"],
                ["paddingLeft", "左"],
              ] as const
            ).map(([key, label]) => (
              <div className={ui["field"]} key={key}>
                <label htmlFor={key}>
                  {label}边距：{appearance[key]} px
                </label>
                <input
                  id={key}
                  type="range"
                  min={16}
                  max={96}
                  step={1}
                  value={appearance[key]}
                  onChange={(e) => update({ [key]: Number(e.target.value) })}
                />
              </div>
            ))}
          </div>
        </fieldset>
        <div className={ui["field"]}>
          <label htmlFor="divider-color">模块分割线颜色</label>
          <input
            id="divider-color"
            type="color"
            value={appearance.dividerColor}
            onChange={(e) => update({ dividerColor: e.target.value })}
          />
        </div>
        <label className={ui["check-field"]}>
          <input
            type="checkbox"
            checked={appearance.showIcons}
            onChange={(e) => update({ showIcons: e.target.checked })}
          />
          显示模块标题与联系方式图标
        </label>
        <button
          className={ui["soft-button"]}
          onClick={() =>
            onChange({ ...data, appearance: { ...defaultAppearance } })
          }
        >
          <RotateCcw size={15} />
          恢复默认排版
        </button>
        <div className={ui["settings-note"]}>
          <h2>关于保存</h2>
          <p>
            当前采用本地保存，不需要登录。数据仅存在此浏览器中，不会自动同步到其他设备。
          </p>
          <p>
            清除浏览器数据会移除简历，请在「我的简历」中定期导出 JSON 备份。
          </p>
          <h2>快捷操作</h2>
          <p>
            撤销：⌘ / Ctrl + Z<br />
            重做：⌘ / Ctrl + Shift + Z
          </p>
        </div>
      </div>
    </div>
  );
}
