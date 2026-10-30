"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ComponentProps,
} from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  CircleX,
  Undo2,
  Redo2,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignJustify,
  List,
  ListOrdered,
  Outdent,
  Indent,
  Link2,
  RemoveFormatting,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ClearActionProps = {
  clearLabel: string;
  onClear: () => void;
};

type ClearableInputProps = ComponentProps<"input"> & ClearActionProps;
type ClearableTextareaProps = ComponentProps<"textarea"> & ClearActionProps;

function ClearButton({
  label,
  onClear,
  className,
}: {
  label: string;
  onClear: () => void;
  className: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "absolute z-10 inline-grid size-7 place-items-center rounded-full text-neutral-400 hover:bg-green-50 hover:text-green-700",
        className,
      )}
      aria-label={label}
      title={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClear}
    >
      <CircleX size={15} aria-hidden="true" />
    </button>
  );
}

export function ClearableInput({
  clearLabel,
  onClear,
  value,
  type = "text",
  className,
  ...props
}: ClearableInputProps) {
  return (
    <Input
      {...props}
      type={type}
      value={value}
      clearLabel={clearLabel}
      onClear={onClear}
      className={className}
    />
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inlineMarkdownToHtml(line: string): string {
  return escapeHtml(line)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "<em>$1</em>")
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2">$1</a>',
    );
}

function valueToHtml(raw: string): string {
  if (!raw) return "<p></p>";
  const lines = raw.split("\n");
  const blocks: string[] = [];
  let listType: "ul" | "ol" | null = null;
  let listItems: string[] = [];

  const flushList = () => {
    if (listType && listItems.length) {
      blocks.push(`<${listType}>${listItems.join("")}</${listType}>`);
    }
    listType = null;
    listItems = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^[•·]\s+/.test(trimmed)) {
      if (listType !== "ul") flushList();
      listType = "ul";
      listItems.push(
        `<li><p>${inlineMarkdownToHtml(trimmed.replace(/^[•·]\s+/, ""))}</p></li>`,
      );
    } else if (/^\d+\.\s+/.test(trimmed)) {
      if (listType !== "ol") flushList();
      listType = "ol";
      listItems.push(
        `<li><p>${inlineMarkdownToHtml(trimmed.replace(/^\d+\.\s+/, ""))}</p></li>`,
      );
    } else {
      flushList();
      blocks.push(`<p>${inlineMarkdownToHtml(line)}</p>`);
    }
  }
  flushList();
  return blocks.join("");
}

function serializeInline(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.nodeValue ?? "").replace(/\u00a0/g, " ");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";
  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  if (tag === "br") return "\n";
  const inner = Array.from(el.childNodes).map(serializeInline).join("");
  if (!inner) return "";
  const fw = el.style?.fontWeight;
  const isBold =
    tag === "b" || tag === "strong" || fw === "bold" || Number(fw) >= 600;
  const isItalic =
    tag === "i" || tag === "em" || el.style?.fontStyle === "italic";
  if (tag === "a") {
    const href = el.getAttribute("href");
    return href ? `[${inner}](${href})` : inner;
  }
  if (isBold) {
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(inner);
    if (!m || !m[2]) return inner;
    const clean = m[2].replace(/\*\*/g, "");
    return `${m[1]}**${clean}**${m[3]}`;
  }
  if (isItalic) {
    const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(inner);
    if (!m || !m[2]) return inner;
    const clean = m[2].replace(/(?<!\*)\*(?!\*)/g, "");
    return `${m[1]}*${clean}*${m[3]}`;
  }
  return inner;
}

function htmlToValue(root: HTMLElement): string {
  const lines: string[] = [];
  for (const child of Array.from(root.childNodes)) {
    if (child.nodeType !== Node.ELEMENT_NODE) {
      const text = serializeInline(child);
      if (text) lines.push(text);
      continue;
    }
    const el = child as HTMLElement;
    const tag = el.tagName.toLowerCase();
    if (tag === "ul" || tag === "ol") {
      const items = Array.from(el.querySelectorAll(":scope > li"));
      items.forEach((li, idx) => {
        const text = serializeInline(li).replace(/\n+/g, " ").trim();
        const prefix = tag === "ol" ? `${idx + 1}. ` : "• ";
        lines.push(
          text.startsWith("• ") || /^\d+\.\s/.test(text)
            ? text
            : `${prefix}${text}`,
        );
      });
    } else if (tag === "p" || tag === "div") {
      lines.push(serializeInline(el).replace(/\n$/, ""));
    } else {
      lines.push(serializeInline(el));
    }
  }
  const result = lines
    .join("\n")
    .replace(/\*{4,}/g, "**")
    .replace(/\n{3,}/g, "\n\n");
  return result.trim() === "" ? "" : result;
}

export function ClearableTextarea({
  clearLabel,
  onClear,
  value,
  onChange,
  placeholder,
  id,
  rows = 5,
  className,
}: ClearableTextareaProps) {
  const strValue = String(value ?? "");
  const lastEmitted = useRef<string>(strValue);
  const onChangeRef = useRef(onChange);
  const [, setTick] = useState(0);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const minHeight = Math.max(110, rows * 24);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      TextAlign.configure({
        types: ["paragraph"],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "underline text-green-700",
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "",
      }),
    ],
    content: valueToHtml(strValue),
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        role: "textbox",
        "aria-multiline": "true",
        style: `min-height: ${minHeight}px`,
        class:
          "w-full px-3 py-2.5 text-[13px] leading-[1.75] text-[#1a4026] focus:outline-none [&_p]:my-0.5 [&_strong]:font-bold [&_strong]:text-[#0b2915] [&_em]:italic [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:text-[#93b39e] [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
      },
    },
    onUpdate({ editor: ed }) {
      const next = htmlToValue(ed.view.dom);
      if (next === lastEmitted.current) return;
      lastEmitted.current = next;
      onChangeRef.current?.({
        target: { value: next },
        currentTarget: { value: next },
      } as ChangeEvent<HTMLTextAreaElement>);
    },
    onSelectionUpdate() {
      setTick((t) => t + 1);
    },
    onTransaction() {
      setTick((t) => t + 1);
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (strValue !== lastEmitted.current) {
      lastEmitted.current = strValue;
      editor.commands.setContent(valueToHtml(strValue), { emitUpdate: false });
    }
  }, [strValue, editor]);

  const handleLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt(
      "请输入链接地址 (留空则移除链接)",
      previousUrl || "https://",
    );
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    if (/^https?:\/\//i.test(url.trim())) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url.trim() })
        .run();
    }
  };

  const activeBtn = "bg-[#d2f4de] text-[#069b43] shadow-2xs";
  const baseBtn =
    "inline-grid size-7 place-items-center rounded-[5px] hover:bg-[#dff8e7] hover:text-[#08a644] disabled:opacity-35";

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-[8px] border border-[#d2ebda] bg-white transition-colors focus-within:border-[#19af60] focus-within:ring-2 focus-within:ring-[#19af60]/20",
        className,
      )}
    >
      {/* Tiptap Rich Text Toolbar */}
      <div
        role="toolbar"
        aria-label="富文本格式工具栏"
        className="flex flex-wrap items-center gap-0.5 border-b border-[#e5f4ea] bg-[#f4fbf6] px-2 py-1.5 text-[#386647]"
      >
        <button
          type="button"
          title="撤销 (Ctrl+Z)"
          aria-label="撤销"
          disabled={!editor?.can().undo()}
          onMouseDown={(e) => {
            e.preventDefault();
            editor?.chain().focus().undo().run();
          }}
          className={baseBtn}
        >
          <Undo2 size={14} />
        </button>
        <button
          type="button"
          title="重做 (Ctrl+Shift+Z)"
          aria-label="重做"
          disabled={!editor?.can().redo()}
          onMouseDown={(e) => {
            e.preventDefault();
            editor?.chain().focus().redo().run();
          }}
          className={baseBtn}
        >
          <Redo2 size={14} />
        </button>
        <span className="mx-0.5 h-4 w-px bg-[#d6ecde]" aria-hidden="true" />
        <button
          type="button"
          title="加粗 (Ctrl+B)"
          aria-label="加粗"
          aria-pressed={editor?.isActive("bold") ?? false}
          onMouseDown={(e) => {
            e.preventDefault();
            editor?.chain().focus().toggleBold().run();
          }}
          className={cn(baseBtn, "font-bold", editor?.isActive("bold") && activeBtn)}
        >
          <Bold size={14} strokeWidth={2.5} />
        </button>
        <button
          type="button"
          title="斜体 (Ctrl+I)"
          aria-label="斜体"
          aria-pressed={editor?.isActive("italic") ?? false}
          onMouseDown={(e) => {
            e.preventDefault();
            editor?.chain().focus().toggleItalic().run();
          }}
          className={cn(baseBtn, editor?.isActive("italic") && activeBtn)}
        >
          <Italic size={14} />
        </button>
        <span className="mx-0.5 h-4 w-px bg-[#d6ecde]" aria-hidden="true" />
        <button
          type="button"
          title="左对齐"
          aria-label="左对齐"
          aria-pressed={editor?.isActive({ textAlign: "left" }) ?? false}
          onMouseDown={(e) => {
            e.preventDefault();
            editor?.chain().focus().setTextAlign("left").run();
          }}
          className={cn(
            baseBtn,
            editor?.isActive({ textAlign: "left" }) && activeBtn,
          )}
        >
          <AlignLeft size={14} />
        </button>
        <button
          type="button"
          title="居中对齐"
          aria-label="居中对齐"
          aria-pressed={editor?.isActive({ textAlign: "center" }) ?? false}
          onMouseDown={(e) => {
            e.preventDefault();
            editor?.chain().focus().setTextAlign("center").run();
          }}
          className={cn(
            baseBtn,
            editor?.isActive({ textAlign: "center" }) && activeBtn,
          )}
        >
          <AlignCenter size={14} />
        </button>
        <button
          type="button"
          title="两端对齐"
          aria-label="两端对齐"
          aria-pressed={editor?.isActive({ textAlign: "justify" }) ?? false}
          onMouseDown={(e) => {
            e.preventDefault();
            editor?.chain().focus().setTextAlign("justify").run();
          }}
          className={cn(
            baseBtn,
            editor?.isActive({ textAlign: "justify" }) && activeBtn,
          )}
        >
          <AlignJustify size={14} />
        </button>
        <span className="mx-0.5 h-4 w-px bg-[#d6ecde]" aria-hidden="true" />
        <button
          type="button"
          title="无序列表"
          aria-label="无序列表"
          aria-pressed={editor?.isActive("bulletList") ?? false}
          onMouseDown={(e) => {
            e.preventDefault();
            editor?.chain().focus().toggleBulletList().run();
          }}
          className={cn(baseBtn, editor?.isActive("bulletList") && activeBtn)}
        >
          <List size={14} />
        </button>
        <button
          type="button"
          title="有序列表"
          aria-label="有序列表"
          aria-pressed={editor?.isActive("orderedList") ?? false}
          onMouseDown={(e) => {
            e.preventDefault();
            editor?.chain().focus().toggleOrderedList().run();
          }}
          className={cn(baseBtn, editor?.isActive("orderedList") && activeBtn)}
        >
          <ListOrdered size={14} />
        </button>
        <button
          type="button"
          title="减少列表缩进"
          aria-label="减少缩进"
          disabled={!editor?.can().liftListItem("listItem")}
          onMouseDown={(e) => {
            e.preventDefault();
            editor?.chain().focus().liftListItem("listItem").run();
          }}
          className={baseBtn}
        >
          <Outdent size={14} />
        </button>
        <button
          type="button"
          title="增加列表缩进"
          aria-label="增加缩进"
          disabled={!editor?.can().sinkListItem("listItem")}
          onMouseDown={(e) => {
            e.preventDefault();
            editor?.chain().focus().sinkListItem("listItem").run();
          }}
          className={baseBtn}
        >
          <Indent size={14} />
        </button>
        <span className="mx-0.5 h-4 w-px bg-[#d6ecde]" aria-hidden="true" />
        <button
          type="button"
          title="插入/编辑链接"
          aria-label="插入链接"
          aria-pressed={editor?.isActive("link") ?? false}
          onMouseDown={(e) => {
            e.preventDefault();
            handleLink();
          }}
          className={cn(baseBtn, editor?.isActive("link") && activeBtn)}
        >
          <Link2 size={14} />
        </button>
        <button
          type="button"
          title="清除所选格式"
          aria-label="清除格式"
          onMouseDown={(e) => {
            e.preventDefault();
            editor?.chain().focus().unsetAllMarks().clearNodes().run();
          }}
          className={baseBtn}
        >
          <RemoveFormatting size={14} />
        </button>
        {strValue.length > 0 && (
          <ClearButton
            label={clearLabel}
            onClear={() => {
              lastEmitted.current = "";
              editor?.commands.setContent("<p></p>", { emitUpdate: false });
              onClear();
            }}
            className="static ml-auto size-7"
          />
        )}
      </div>

      {/* Tiptap Editor Content */}
      <EditorContent editor={editor} />
    </div>
  );
}
