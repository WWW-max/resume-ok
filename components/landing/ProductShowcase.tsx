import {
  Clover,
  Check,
  Download,
  UserRound,
  FileText,
  Star,
  Settings,
  BriefcaseBusiness,
  GraduationCap,
  LayoutGrid,
  GripVertical,
} from "lucide-react";
const modules = [
  { icon: UserRound, name: "个人信息" },
  { icon: BriefcaseBusiness, name: "工作经历" },
  { icon: FileText, name: "项目经历" },
  { icon: GraduationCap, name: "教育背景" },
  { icon: Star, name: "技能特长" },
];
function MiniResume() {
  return (
    <div className="h-full rounded bg-white p-3 text-[6px] shadow-sm sm:p-4 lg:p-5">
      <div className="flex items-center gap-1 text-[8px] font-bold">
        <Clover size={15} className="fill-green-200 text-green-500" />
        Resume<span className="-ml-1 text-green-600">OK</span>
      </div>
      <div className="mt-3 flex justify-between gap-2">
        <div>
          <strong className="text-[12px] sm:text-sm">张一鸣</strong>
          <p className="mt-1 text-[7px] text-green-700">前端开发工程师</p>
          <p className="mt-1 text-[5px] text-neutral-400">
            138-8888-8888 · 北京
          </p>
        </div>
        <span className="grid size-9 place-items-center rounded-lg bg-green-50 text-green-600">
          <UserRound size={26} strokeWidth={1.3} />
        </span>
      </div>
      {[
        {
          title: "工作经历",
          company: "某科技有限公司",
          role: "前端开发工程师",
        },
        { title: "项目经历", company: "企业级后台管理系统", role: "核心开发" },
        {
          title: "教育背景",
          company: "某某大学",
          role: "计算机科学与技术 · 本科",
        },
      ].map(({ title, company, role }, i) => (
        <div className="mt-3" key={title}>
          <h3 className="flex items-center gap-1 border-b border-green-100 pb-1 text-[7px] font-semibold text-green-800">
            <BriefcaseBusiness size={8} />
            {title}
          </h3>
          <div className="mt-1.5 flex items-center justify-between text-[6px]">
            <strong>{company}</strong>
            <span className="text-[5px] text-neutral-400">
              {i === 0 ? "2021.06 – 至今" : "2019 – 2021"}
            </span>
          </div>
          <p className="mt-0.5 text-neutral-400">{role}</p>
          {i < 2 && (
            <>
              <p className="mt-1 text-[5px] leading-3 text-neutral-500">
                • 参与核心业务系统开发，持续优化产品体验
              </p>
              <div className="mt-1 h-0.5 w-11/12 rounded bg-neutral-100" />
              <div className="mt-1 h-0.5 w-3/4 rounded bg-neutral-100" />
            </>
          )}
        </div>
      ))}
      <div className="mt-3 flex flex-wrap gap-1">
        {["React", "TypeScript", "CSS"].map((t) => (
          <span
            className="rounded bg-green-50 px-1 py-0.5 text-[5px] text-green-700"
            key={t}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}
export function ProductShowcase() {
  return (
    <div
      role="img"
      aria-label="绿色主题产品示意：电脑端编辑简历，手机端预览和下载"
      className="relative mx-auto w-full max-w-[650px] pb-5 pr-12 sm:pr-14 lg:pb-2"
    >
      <div
        className="pointer-events-none absolute -inset-8 -z-10 rounded-full bg-green-100/60 blur-3xl"
        aria-hidden="true"
      />
      <div
        aria-hidden="true"
        className="overflow-hidden rounded-xl border border-white/90 bg-white shadow-[0_15px_60px_#285c3818]"
      >
        <div className="flex items-center justify-between border-b border-green-50 px-3 py-2.5">
          <span className="flex items-center gap-1 text-[9px] font-bold">
            <Clover size={14} className="fill-green-200 text-green-500" />
            Resume<span className="-ml-1 text-green-600">OK</span>
          </span>
          <span className="flex items-center gap-1 text-[5px] text-green-600">
            <Check size={7} />
            已保存
          </span>
          <span className="rounded-full bg-green-500 px-2 py-1 text-[5px] text-white">
            下载简历
          </span>
        </div>
        <div className="grid grid-cols-[9%_34%_57%] bg-[#f4faf5]">
          <div className="space-y-4 px-1 pt-4 text-center text-green-600">
            {[FileText, LayoutGrid, Star, Settings].map((Icon, i) => (
              <Icon key={i} size={10} className="mx-auto" />
            ))}
          </div>
          <div className="border-x border-green-50 bg-white/80 px-2 py-4">
            <h3 className="text-[8px] font-bold sm:text-[10px]">编辑简历</h3>
            <p className="mt-1 text-[5px] text-neutral-400">
              让每一个优势，都被看见
            </p>
            <div className="mt-4 space-y-2">
              {modules.map(({ icon: Icon, name }, i) => (
                <div
                  className={`flex items-center gap-1.5 rounded-md border px-1.5 py-2 sm:py-3 ${i === 0 ? "border-green-300 bg-green-50 text-green-600" : "border-neutral-100 bg-white text-neutral-500"}`}
                  key={name}
                >
                  <GripVertical size={7} className="text-neutral-300" />
                  <Icon size={9} />
                  <span className="text-[6px] sm:text-[7px]">{name}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex items-center gap-1 rounded-md bg-green-50 px-1.5 py-2 text-[5px] text-green-600">
              <Clover size={10} />
              简历助手 · LuckyMe
            </div>
          </div>
          <div className="p-2 sm:p-3">
            <MiniResume />
          </div>
        </div>
      </div>
      <div
        aria-hidden="true"
        className="absolute -right-1 bottom-0 w-[23%] min-w-[85px] rotate-2 rounded-[22px] border-[3px] border-neutral-300 bg-white p-2 shadow-[0_12px_25px_#24452b20] sm:rounded-[26px] sm:p-2.5"
      >
        <div className="mx-auto mb-3 h-1 w-6 rounded-full bg-neutral-300" />
        <div className="flex items-center gap-1 text-[7px] font-bold">
          <Clover size={11} className="fill-green-300 text-green-500" />
          Resume<span className="-ml-1 text-green-600">OK</span>
        </div>
        <div className="mt-3 flex items-start justify-between gap-1">
          <div>
            <strong className="text-[9px]">张一鸣</strong>
            <p className="text-[5px] text-neutral-500">前端开发工程师</p>
          </div>
          <div className="grid size-6 place-items-center rounded-md bg-green-50 text-green-500">
            <UserRound size={18} />
          </div>
        </div>
        <div className="mx-auto my-3 grid aspect-square w-[54%] place-content-center rounded-full border-[3px] border-green-400 text-center">
          <Check className="mx-auto text-green-600" size={21} />
          <span className="text-[5px] text-neutral-500">准备好出发</span>
        </div>
        <div className="space-y-2">
          {["基本信息", "工作经历", "项目经历"].map((t) => (
            <div
              key={t}
              className="flex items-center gap-1 text-[6px] text-neutral-500"
            >
              <Check size={7} className="text-green-500" />
              {t}
              <span className="ml-auto h-1 w-4 rounded bg-green-100" />
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-center gap-1 rounded-full bg-brand py-1.5 text-[6px] text-white">
          <Download size={7} />
          导出简历
        </div>
        <div className="mt-3 flex justify-around border-t border-neutral-100 pt-2 text-neutral-400">
          <FileText size={9} />
          <Star size={9} />
          <Settings size={9} />
        </div>
      </div>
      <span
        aria-hidden="true"
        className="absolute -right-8 -top-12 hidden rotate-[-10deg] text-center font-serif text-sm italic leading-6 tracking-wider text-green-700 xl:block"
      >
        让好简历
        <br />
        带你去更好的地方 ♡
      </span>
    </div>
  );
}
