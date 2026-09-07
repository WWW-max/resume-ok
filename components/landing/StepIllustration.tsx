import { Check, Download, FileText, GripVertical, Plus } from "lucide-react";
export function StepIllustration({ step }: { step: number }) {
  if (step === 1)
    return (
      <div
        aria-hidden="true"
        className="mt-5 flex h-24 items-end justify-center gap-3 overflow-hidden"
      >
        {[
          "bg-white text-neutral-400",
          "bg-green-600 text-white",
          "bg-white text-green-500",
        ].map((style, i) => (
          <div
            key={i}
            className={`h-[85px] w-16 rounded-t-md border border-neutral-200 p-2 shadow-sm ${style} ${i === 1 ? "h-24 rotate-3" : "-rotate-3"}`}
          >
            <div className="flex items-center gap-1">
              <FileText size={8} />
              <span className="h-1 w-6 bg-current opacity-50" />
            </div>
            {[0, 1, 2, 3, 4].map((j) => (
              <div
                key={j}
                className={`mt-2 h-0.5 rounded bg-current opacity-30 ${j % 2 ? "w-3/4" : "w-full"}`}
              />
            ))}
          </div>
        ))}
      </div>
    );
  if (step === 2)
    return (
      <div
        aria-hidden="true"
        className="relative mx-auto mt-5 h-24 w-full max-w-52 overflow-hidden rounded-t-lg border border-neutral-100 bg-white p-2 shadow-sm"
      >
        <div className="mb-2 flex gap-1">
          <span className="size-1.5 rounded-full bg-green-300" />
          <span className="size-1.5 rounded-full bg-neutral-200" />
          <span className="size-1.5 rounded-full bg-neutral-200" />
        </div>
        {["个人信息", "工作经历", "教育背景"].map((t, i) => (
          <div
            key={t}
            className={`mb-1 flex items-center gap-2 rounded border px-2 py-1 text-[8px] ${i === 1 ? "border-green-300 bg-green-50 text-green-600" : "border-neutral-100 text-neutral-400"}`}
          >
            <GripVertical size={9} />
            {t}
            {i === 1 && <Plus size={10} className="ml-auto" />}
          </div>
        ))}
      </div>
    );
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto mt-4 grid h-24 w-28 place-content-center"
    >
      <div className="rotate-[-8deg] rounded-md border border-green-100 bg-green-50 px-5 py-3">
        <FileText size={37} strokeWidth={1} className="text-green-300" />
        <span className="rounded bg-brand px-1.5 py-0.5 text-[9px] font-bold text-white">
          PDF
        </span>
      </div>
      <div className="absolute bottom-1 right-0 grid size-9 place-items-center rounded-full border-[3px] border-white bg-brand text-white">
        <Download size={16} />
      </div>
      <Check className="absolute -right-1 top-2 text-green-500" size={16} />
    </div>
  );
}
