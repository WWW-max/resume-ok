"use client";

import { useRef, useState } from "react";
import {
  ResumeData,
  SectionKey,
  SECTION_LABELS,
  DEFAULT_SECTION_ORDER,
} from "@/lib/resume-data";
import { GripVertical, ChevronUp, ChevronDown, RotateCcw } from "lucide-react";

interface SectionOrderFormProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

const SECTION_ICONS: Record<SectionKey, string> = {
  summary: "📝",
  workExperiences: "💼",
  projects: "🚀",
  educations: "🎓",
  skills: "⚡",
};

export function SectionOrderForm({ data, onChange }: SectionOrderFormProps) {
  const order = data.sectionOrder ?? [...DEFAULT_SECTION_ORDER];
  const dragIndex = useRef<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  function reorder(newOrder: SectionKey[]) {
    onChange({ ...data, sectionOrder: newOrder });
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const next = [...order];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    reorder(next);
  }

  function moveDown(index: number) {
    if (index === order.length - 1) return;
    const next = [...order];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    reorder(next);
  }

  function handleReset() {
    reorder([...DEFAULT_SECTION_ORDER]);
  }

  // --- Drag handlers ---
  function onDragStart(e: React.DragEvent, index: number) {
    dragIndex.current = index;
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // transparent 1×1 ghost image
    const ghost = document.createElement("div");
    ghost.style.position = "absolute";
    ghost.style.top = "-9999px";
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  }

  function onDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragIndex.current !== null && dragIndex.current !== index) {
      setOverIndex(index);
    }
  }

  function onDrop(index: number) {
    if (dragIndex.current === null || dragIndex.current === index) return;
    const next = [...order];
    const [moved] = next.splice(dragIndex.current, 1);
    next.splice(index, 0, moved);
    reorder(next);
    dragIndex.current = null;
    setDraggingIndex(null);
    setOverIndex(null);
  }

  function onDragEnd() {
    dragIndex.current = null;
    setDraggingIndex(null);
    setOverIndex(null);
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-neutral-500 text-sm font-semibold">模块顺序</h3>
          <p className="text-neutral-500 text-xs mt-0.5">
            拖拽或点击箭头调整简历模块的显示顺序
          </p>
        </div>
        <button
          onClick={handleReset}
          title="恢复默认顺序"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-neutral-500 hover:text-neutral-500
                     hover:bg-white border border-transparent hover:border-neutral-200
                     text-xs font-medium transition-all duration-200 active:scale-95"
        >
          <RotateCcw className="w-3 h-3" />
          重置
        </button>
      </div>

      {/* Sortable list */}
      <div className="space-y-2">
        {order.map((key, index) => {
          const isDragging = draggingIndex === index;
          const isOver = overIndex === index;

          return (
            <div
              key={key}
              draggable
              onDragStart={(e) => onDragStart(e, index)}
              onDragOver={(e) => onDragOver(e, index)}
              onDrop={() => onDrop(index)}
              onDragEnd={onDragEnd}
              className={[
                "flex items-center gap-3 px-3 py-3 rounded-xl border transition-all duration-150 select-none",
                "bg-white/[0.04] border-white/[0.08]",
                isDragging
                  ? "opacity-30 scale-[0.98]"
                  : "hover:bg-white/[0.07] hover:border-white/[0.14]",
                isOver && !isDragging
                  ? "border-green-500/60 bg-green-500/10 shadow-lg shadow-green-500/10"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {/* Drag handle */}
              <GripVertical className="w-4 h-4 text-neutral-500 hover:text-neutral-500 cursor-grab active:cursor-grabbing flex-shrink-0 transition-colors" />

              {/* Index badge */}
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-linear-to-br from-green-500/30 to-green-500/30 text-white/60 border border-white/10">
                {index + 1}
              </span>

              {/* Icon + Label */}
              <span className="text-base flex-shrink-0">
                {SECTION_ICONS[key]}
              </span>
              <span className="flex-1 text-neutral-500 text-sm font-medium">
                {SECTION_LABELS[key]}
              </span>

              {/* Up / Down buttons */}
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="w-6 h-5 flex items-center justify-center rounded text-neutral-500
                             hover:text-neutral-500 hover:bg-white disabled:opacity-20
                             disabled:cursor-not-allowed transition-all duration-150 active:scale-90"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => moveDown(index)}
                  disabled={index === order.length - 1}
                  className="w-6 h-5 flex items-center justify-center rounded text-neutral-500
                             hover:text-neutral-500 hover:bg-white disabled:opacity-20
                             disabled:cursor-not-allowed transition-all duration-150 active:scale-90"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tip */}
      <p className="text-neutral-500 text-xs text-center pt-1">
        调整后右侧预览将实时更新
      </p>
    </div>
  );
}
