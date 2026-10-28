import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clover,
  Crown,
  LayoutTemplate,
  MousePointer2,
  ShieldCheck,
  Smartphone,
  Download,
  Sparkles,
  Heart,
} from "lucide-react";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { ProductShowcase } from "@/components/landing/ProductShowcase";
import { StepIllustration } from "@/components/landing/StepIllustration";
import { Brand } from "@/components/Brand";
import { currentUser } from "@/lib/server/auth";
import { MEMBERSHIP_PLANS, PLAN_ENTITLEMENTS } from "@/lib/membership";
import { getSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";
const features = [
  {
    icon: LayoutTemplate,
    title: "专业简历模板",
    text: "清新、极简、商务三种风格，一键切换，专注呈现你的优势。",
    href: "/editor?view=templates",
  },
  {
    icon: MousePointer2,
    title: "可视化编辑器",
    text: "模块自由排序，内容实时预览。所见即所得，编辑更高效。",
    href: "/editor",
  },
  {
    icon: Sparkles,
    title: "智能内容检查",
    text: "检查基础信息、日期与成果表达，帮你发现容易忽略的细节。",
    href: "/editor?view=assistant",
  },
  {
    icon: ShieldCheck,
    title: "简历完整度",
    text: "逐项检查内容完整度，直接跳转到待完善的模块。",
    href: "/editor?view=assistant",
  },
  {
    icon: Download,
    title: "一键导出 PDF",
    text: "A4 排版与长简历分页，随时下载，准备好下一次投递。",
    href: "/editor",
  },
  {
    icon: Smartphone,
    title: "多端轻松编辑",
    text: "登录同一账号，在电脑与手机间继续编辑你的简历。",
    href: "/editor?view=resumes",
  },
];
const steps = [
  {
    title: "选择模板",
    text: "从精选模板中挑选喜欢的风格，开启创建简历的第一步。",
    href: "/editor?view=templates",
  },
  {
    title: "编辑简历",
    text: "填写你的信息，拖拽排序，自由调整简历模块。",
    href: "/editor",
  },
  {
    title: "下载简历",
    text: "一键生成 PDF 简历，随时投递，开启新的机会。",
    href: "/editor",
  },
];
const faqs = [
  {
    question: "ResumeOK 在线制作和导出 PDF 简历是免费的吗？",
    answer:
      "是的，ResumeOK 提供永久免费的基础版方案，支持创建个人简历、切换专业简历模板、实时预览排版、智能内容完整度检查以及无水印一键导出标准 A4 PDF 简历。",
  },
  {
    question: "导出的 PDF 简历支持长简历自动 A4 分页吗？",
    answer:
      "支持。ResumeOK 内置智能 A4 分页计算引擎，在导出单页或多页长简历时会自动识别文字行高与页边距，避免文字在跨页处被截断，同时支持自定义字号、行距与页边距。",
  },
  {
    question: "可以把已有的旧 PDF 简历导入编辑，或者一键转成英文简历吗？",
    answer:
      "可以。通过编辑器内的「导入简历」功能上传已有 PDF、图片或文本简历，系统会自动解析并填充至对应模块；升级 PRO 会员后还可一键生成地道专业的英文版本简历。",
  },
  {
    question: "我的个人简历数据安全吗？会不会被公开或泄露？",
    answer:
      "您的所有简历数据均按账号严格隔离加密保存，默认仅您本人登录后可见，平台绝不向任何第三方出售或共享个人数据。仅当您主动开启「在线简历分享」时才会生成专属访问链接，且随时可一键关闭。",
  },
];
export default async function LandingPage() {
  const user = await currentUser().catch(() => null);
  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: siteUrl,
        description: SITE_DESCRIPTION,
        inLanguage: "zh-CN",
      },
      {
        "@type": "SoftwareApplication",
        name: SITE_NAME,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: siteUrl,
        description: SITE_DESCRIPTION,
        offers: [
          {
            "@type": "Offer",
            name: "免费版",
            price: "0",
            priceCurrency: "CNY",
          },
          ...MEMBERSHIP_PLANS.map((plan) => ({
            "@type": "Offer",
            name: plan.name,
            price: String(plan.price),
            priceCurrency: "CNY",
          })),
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
    ],
  };
  return (
    <div
      id="top"
      className="min-h-screen bg-white text-ink selection:bg-green-100"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <a
        href="#main-content"
        className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:not-sr-only focus:rounded-lg focus:bg-white focus:p-4 focus:shadow-lg"
      >
        跳到主要内容
      </a>
      <LandingHeader user={user} />
      <main id="main-content">
        <section className="relative isolate overflow-hidden bg-[linear-gradient(115deg,#f1fbf5_0%,#fbfdfd_45%,#eaf9f0_100%)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-56 h-[550px] w-[480px] -rotate-45 rounded-[150px] bg-green-100/30"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-40 -left-40 size-96 rounded-full bg-green-100/50 blur-3xl"
          />
          <div className="mx-auto grid max-w-[1160px] items-center gap-14 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[.88fr_1.12fr] lg:gap-12 lg:py-20">
            <div className="relative z-10 text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full bg-green-100/70 px-3 py-2 text-xs font-semibold text-green-900">
                <Sparkles size={15} className="text-green-500" />
                让好机会，从一份好简历开始
              </span>
              <h1 className="mt-6 text-[34px] font-bold leading-[1.3] tracking-tight sm:text-[46px] lg:text-[44px] xl:text-[48px]">
                用 ResumeOK
                <br />
                打造你的<span className="text-[#18aa49]">完美简历</span>
              </h1>
              <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-[#476f54] sm:text-[15px] lg:mx-0">
                专业的在线简历编辑工具，精选精美模板，轻松完善内容。
                <br className="hidden sm:block" />
                让你更快拿到心仪的 Offer！
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4 lg:justify-start">
                <Link
                  href={user ? "/editor" : "/login?next=%2Feditor"}
                  className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-brand px-7 text-sm font-semibold text-white shadow-[0_8px_20px_#13ad5025] transition-colors hover:bg-brand-dark"
                >
                  <Clover size={19} className="fill-white/30" />
                  立即开始制作
                  <ArrowRight size={17} />
                </Link>
                <Link
                  href="/editor?view=templates"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-green-200 bg-white/50 px-6 text-sm font-semibold text-green-800 transition-colors hover:bg-green-50"
                >
                  <LayoutTemplate size={17} />
                  浏览模板
                </Link>
              </div>
              <div className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-neutral-500 lg:justify-start">
                {["精选专业模板", "账号专属存储", "一键导出 PDF"].map((t) => (
                  <span className="inline-flex items-center gap-1.5" key={t}>
                    <Check
                      size={13}
                      className="rounded-full bg-green-200 p-0.5 text-green-700"
                    />
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <ProductShowcase />
          </div>
        </section>
        <section
          id="features"
          className="scroll-mt-24 px-5 py-14 sm:px-8 sm:py-16"
        >
          <div className="mx-auto max-w-[1160px]">
            <div className="text-center">
              <p className="text-xs font-semibold text-brand-dark">
                为什么选择 ResumeOK
              </p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-[30px]">
                强大功能 · 助你脱颖而出
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-neutral-500">
                从简历制作到内容完善，让繁琐的排版变简单，让你的优势被看见。
              </p>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-9 sm:grid-cols-3 lg:grid-cols-6 lg:gap-6">
              {features.map(({ icon: Icon, title, text, href }, i) => (
                <Link
                  href={href}
                  key={title}
                  className="group rounded-xl text-center outline-offset-8"
                >
                  <span
                    className={`mx-auto grid size-14 place-items-center rounded-[20px] ${i === 0 ? "bg-green-50" : "bg-green-50"}`}
                  >
                    <Icon
                      size={29}
                      strokeWidth={1.8}
                      className="text-green-500 transition-transform group-hover:-translate-y-1 motion-reduce:transform-none"
                    />
                  </span>
                  <h3
                    className={`mt-4 text-sm font-semibold ${i === 0 ? "text-green-800" : "text-ink"}`}
                  >
                    {title}
                  </h3>
                  <p className="mt-2 text-xs leading-[1.9] text-[#658b72]">
                    {text}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
        <section className="bg-[#f3faf6] px-5 py-12 sm:px-8">
          <div className="mx-auto max-w-[1080px]">
            <div className="text-center">
              <p className="text-xs font-semibold text-brand-dark">
                只需 3 步，轻松搞定你的简历
              </p>
              <h2 className="mt-3 text-2xl font-bold sm:text-[28px]">
                简单 <span className="text-green-500">3</span> 步，开启求职之旅
              </h2>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-3 md:gap-12">
              {steps.map((step, i) => (
                <Link
                  href={step.href}
                  key={step.title}
                  className="relative rounded-[20px] border border-white bg-white/80 p-5 pb-0 transition-shadow hover:shadow-lg"
                >
                  <div className="flex gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-green-100 text-xl font-semibold text-green-600">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="pt-1 text-sm font-semibold text-green-800">
                        {step.title}
                      </h3>
                      <p className="mt-2 text-xs leading-6 text-neutral-500">
                        {step.text}
                      </p>
                    </div>
                  </div>
                  <StepIllustration step={i + 1} />
                  {i < 2 && (
                    <ArrowRight
                      aria-hidden="true"
                      size={20}
                      className="absolute -right-9 top-1/2 hidden text-green-400 md:block"
                    />
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
        <section
          id="pricing"
          className="relative isolate scroll-mt-24 overflow-hidden bg-[linear-gradient(120deg,#f1fcf5,white,#e9fff0)] px-5 py-14 sm:px-8 sm:py-16"
        >
          <Clover
            aria-hidden="true"
            className="absolute -left-4 top-8 -z-10 size-28 -rotate-12 fill-green-100 text-green-200/70"
          />
          <div className="mx-auto max-w-[1120px]">
            <div className="text-center">
              <p className="text-xs font-semibold text-brand-dark">
                简单透明 · 买断时长无自动扣费
              </p>
              <h2 className="mt-2.5 text-2xl font-bold tracking-tight sm:text-[30px]">
                选择适合你的求职方案
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-neutral-500">
                免费版即可制作并导出标准 PDF 简历；升级 PRO 会员解锁多份简历、智能导入、一键转英文及 HR 访客实时追踪。
              </p>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col justify-between rounded-2xl border border-[#dfeee5] bg-white p-5 shadow-xs">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-ink">免费版</span>
                    <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-600">
                      永久免费
                    </span>
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="text-xs font-bold text-ink">¥</span>
                    <span className="text-3xl font-extrabold tracking-tight text-ink">
                      0
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-400">
                    满足单份基础简历制作与导出
                  </p>
                  <ul className="mt-5 space-y-2.5 text-xs text-[#2c4d37]">
                    {PLAN_ENTITLEMENTS.free.displayFeatures.map((feat) => (
                      <li key={feat} className="flex items-center gap-2">
                        <Check size={14} className="shrink-0 text-green-600" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href={user ? "/editor" : "/login?next=%2Feditor"}
                  className="mt-6 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-green-200 bg-green-50/60 text-xs font-semibold text-green-800 transition-colors hover:bg-green-100/70"
                >
                  免费开始使用
                </Link>
              </div>

              {MEMBERSHIP_PLANS.map((plan) => {
                const featured = plan.id === "quarterly";
                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-shadow ${
                      featured
                        ? "border-[#12b653] bg-white shadow-[0_14px_34px_#12b6531c] ring-2 ring-[#12b653]/20"
                        : "border-[#d8efe1] bg-white shadow-xs"
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-2.5 right-4 rounded-full bg-brand px-2.5 py-0.5 text-[10px] font-semibold text-white">
                        {plan.badge}
                      </span>
                    )}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-ink">
                          <Crown size={14} className="text-[#0cb449]" />
                          {plan.name}
                        </span>
                        <span className="rounded-md bg-[#e8f8ee] px-2 py-0.5 text-[11px] font-medium text-[#118a43]">
                          {plan.periodLabel}
                        </span>
                      </div>
                      <div className="mt-3 flex items-baseline gap-1.5">
                        <span className="text-xs font-bold text-[#0c9c43]">
                          ¥
                        </span>
                        <span className="text-3xl font-extrabold tracking-tight text-ink">
                          {plan.price}
                        </span>
                        <span className="text-xs text-neutral-400 line-through">
                          ¥{plan.originalPrice}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-[#158844]">
                        {plan.dailyCostLabel}
                      </p>
                      <ul className="mt-5 space-y-2.5 text-xs text-[#2c4d37]">
                        {PLAN_ENTITLEMENTS[plan.id].displayFeatures.map((feat) => (
                          <li key={feat} className="flex items-center gap-2">
                            <Check
                              size={14}
                              className="shrink-0 text-[#0cb449]"
                            />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Link
                      href={user ? "/editor" : "/login?next=%2Feditor"}
                      className={`mt-6 inline-flex min-h-10 w-full items-center justify-center rounded-xl text-xs font-semibold transition-colors ${
                        featured
                          ? "bg-brand text-white hover:bg-brand-dark"
                          : "border border-green-300 bg-[#f2fbf6] text-green-800 hover:bg-[#e3f7ec]"
                      }`}
                    >
                      进入工作台开通
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        <section
          id="faq"
          className="scroll-mt-24 bg-[#f8fcf9] px-5 py-14 sm:px-8 sm:py-16"
        >
          <div className="mx-auto max-w-[960px]">
            <div className="text-center">
              <p className="text-xs font-semibold text-brand-dark">
                常见疑问解答
              </p>
              <h2 className="mt-2.5 text-2xl font-bold tracking-tight sm:text-[28px]">
                关于在线简历制作与导出
              </h2>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {faqs.map((item) => (
                <article
                  key={item.question}
                  className="rounded-2xl border border-[#dfeee5] bg-white p-5 shadow-xs"
                >
                  <h3 className="text-sm font-semibold text-ink">
                    {item.question}
                  </h3>
                  <p className="mt-2 text-xs leading-6 text-neutral-500">
                    {item.answer}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer
        id="about"
        className="scroll-mt-24 border-t border-[#e6f3eb] bg-white px-5 py-9 sm:px-8"
      >
        <div className="mx-auto max-w-[1100px]">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="text-center sm:text-left">
              <Link
                href="/"
                aria-label="ResumeOK 首页"
                className="inline-flex justify-center sm:justify-start"
              >
                <Brand small />
              </Link>
              <p className="mt-2 text-xs text-neutral-500">
                让每一份简历，都更接近 Offer · 简历按账号隔离安全保存，支持随时导出备份。
              </p>
            </div>
            <Link
              href="/editor"
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-green-200 bg-green-50/70 px-4 py-2 text-xs font-semibold text-green-700 transition-colors hover:border-green-300 hover:bg-green-100/80 sm:text-sm"
            >
              开始写下新的可能
              <Heart size={14} className="fill-green-500 text-green-500" />
            </Link>
          </div>
          <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-neutral-100 pt-5 text-xs text-neutral-400 sm:flex-row">
            <p>© {new Date().getFullYear()} ResumeOK. All rights reserved.</p>
            <div className="flex flex-wrap items-center justify-center gap-5">
              <Link
                href="#features"
                className="transition-colors hover:text-green-700"
              >
                产品功能
              </Link>
              <Link
                href="/editor?view=templates"
                className="transition-colors hover:text-green-700"
              >
                精选模板
              </Link>
              <Link
                href="#pricing"
                className="transition-colors hover:text-green-700"
              >
                价格方案
              </Link>
              <Link
                href="#faq"
                className="transition-colors hover:text-green-700"
              >
                常见问题
              </Link>
              <Link
                href="/terms"
                className="transition-colors hover:text-green-700"
              >
                用户服务协议
              </Link>
              <Link
                href="/privacy"
                className="transition-colors hover:text-green-700"
              >
                隐私政策
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
