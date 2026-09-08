"use client";

import type { ComponentProps } from "react";
import { X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
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
      onClick={onClear}
    >
      <X size={14} aria-hidden="true" />
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
  const dateLike = ["date", "datetime-local", "month", "time", "week"].includes(
    type,
  );
  return (
    <div className="relative w-full">
      <input
        {...props}
        type={type}
        value={value}
        className={cn(dateLike ? "pr-16!" : "pr-10!", className)}
      />
      {String(value ?? "").length > 0 && (
        <ClearButton
          label={clearLabel}
          onClear={onClear}
          className={cn(
            "top-1/2 -translate-y-1/2",
            dateLike ? "right-8" : "right-2",
          )}
        />
      )}
    </div>
  );
}

export function ClearableTextarea({
  clearLabel,
  onClear,
  value,
  className,
  ...props
}: ClearableTextareaProps) {
  return (
    <div className="relative w-full">
      <Textarea
        {...props}
        value={value}
        className={cn("pr-10!", className)}
      />
      {String(value ?? "").length > 0 && (
        <ClearButton
          label={clearLabel}
          onClear={onClear}
          className="right-2 top-2"
        />
      )}
    </div>
  );
}
