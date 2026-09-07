"use client";
import { ui } from "@/lib/ui-styles";
import type { ResumeData } from "@/lib/resume-data";
import {
  defaultAppearance,
  accentColors,
  type ResumeAppearance,
} from "@/lib/resume-appearance";
import { Check, RotateCcw } from "lucide-react";
export function SettingsPanel({
  data,
  onChange,
}: {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
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
        <fieldset>
          <legend>强调色</legend>
          <div className={ui["color-options"]}>
            {(
              Object.keys(accentColors) as Array<keyof typeof accentColors>
            ).map((color) => (
              <button
                key={color}
                className={`${ui["color-swatch"]} ${{ green: "bg-[#15934b]", fresh: "bg-[#16a34a]", forest: "bg-[#166534]" }[color]}`}
                aria-label={`${{ green: "品牌绿", fresh: "清新绿", forest: "森林绿" }[color]}`}
                aria-pressed={appearance.accent === color}
                onClick={() => update({ accent: color })}
              >
                {appearance.accent === color && <Check size={17} />}
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
          <select
            id="resume-spacing"
            value={appearance.spacing}
            onChange={(e) =>
              update({ spacing: e.target.value as ResumeAppearance["spacing"] })
            }
          >
            <option value="comfortable">舒适 · 更多留白</option>
            <option value="compact">紧凑 · 更多内容</option>
          </select>
        </div>
        <label className={ui["check-field"]}>
          <input
            type="checkbox"
            checked={appearance.showBrand}
            onChange={(e) => update({ showBrand: e.target.checked })}
          />
          在简历中显示 ResumeOK 标识
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
