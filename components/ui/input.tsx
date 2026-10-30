"use client";

import * as React from "react";
import { CircleX } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  wrapperClassName?: string;
  clearLabel?: string;
  onClear?: () => void;
  disableClear?: boolean;
}

function Input({
  className,
  wrapperClassName,
  type = "text",
  value,
  defaultValue,
  onChange,
  clearLabel = "清空输入内容",
  onClear,
  disableClear = false,
  disabled,
  readOnly,
  ...props
}: InputProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const isControlled = value !== undefined;
  const [uncontrolledHasValue, setUncontrolledHasValue] = React.useState(() =>
    Boolean(defaultValue !== undefined && String(defaultValue).length > 0),
  );

  const nonClearableType = [
    "file",
    "checkbox",
    "radio",
    "range",
    "color",
    "hidden",
  ].includes(type);

  const dateLike = [
    "date",
    "datetime-local",
    "month",
    "time",
    "week",
  ].includes(type);

  const hasText = isControlled
    ? String(value ?? "").length > 0
    : uncontrolledHasValue;

  const showClear =
    !disableClear && !nonClearableType && !disabled && !readOnly && hasText;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!isControlled) {
      setUncontrolledHasValue(e.target.value.length > 0);
    }
    onChange?.(e);
  }

  function handleClear() {
    if (onClear) {
      onClear();
      inputRef.current?.focus();
      return;
    }
    const el = inputRef.current;
    if (el) {
      const nativeValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;
      nativeValueSetter?.call(el, "");
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.focus();
    }
    if (!isControlled) {
      setUncontrolledHasValue(false);
    }
  }

  return (
    <div className={cn("relative w-full min-w-0", wrapperClassName)}>
      <input
        ref={inputRef}
        type={type}
        value={value}
        defaultValue={defaultValue}
        disabled={disabled}
        readOnly={readOnly}
        onChange={handleChange}
        data-slot="input"
        className={cn(
          "h-9 w-full min-w-0 rounded-md border border-input bg-white px-3 py-1 text-base text-ink transition-colors outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-neutral-400 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus:border-brand focus-visible:border-brand focus-visible:outline-none",
          "aria-invalid:border-destructive",
          !nonClearableType && (dateLike ? "pr-16!" : "pr-9!"),
          className,
        )}
        {...props}
      />
      {showClear && (
        <button
          type="button"
          tabIndex={-1}
          aria-label={clearLabel}
          title={clearLabel}
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleClear}
          className={cn(
            "absolute top-1/2 z-10 inline-grid size-6 -translate-y-1/2 place-items-center rounded-full text-neutral-400 transition-colors hover:bg-green-50 hover:text-green-700",
            dateLike ? "right-8" : "right-2",
          )}
        >
          <CircleX size={15} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export { Input };
