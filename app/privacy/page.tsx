import Link from "next/link";
import { Brand } from "@/components/Brand";
import { ArrowLeft, FileCheck2, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "隐私政策 · ResumeOK",
  description: "ResumeOK 隐私政策与个人信息保护说明",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f2fbf6_0%,#ffffff_28%,#f8fcf9_100%)] text-ink">
      <header className="sticky top-0 z-20 border-b border-[#dff2e6] bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[960px] items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="返回 ResumeOK 首页">
            <Brand small />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/terms"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#d4ecdd] bg-[#f5fbf7] px-3.5 py-1.5 text-xs font-medium text-[#1b6e3d] transition-colors hover:bg-[#e8f7ee]"
            >
              <FileCheck2 size={14} />
              用户协议
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#d8efe1] bg-white px-3.5 py-1.5 text-xs font-medium text-ink transition-colors hover:bg-[#f4fbf6]"
            >
              <ArrowLeft size={14} />
              返回首页
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[960px] px-5 py-10 sm:px-8 sm:py-14">
        <article className="rounded-3xl border border-[#d8efe1] bg-white p-6 shadow-[0_18px_50px_#10391d12] sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e6f4ec] pb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#e8f8ee] px-3 py-1 text-xs font-medium text-[#118a43]">
                <ShieldCheck size={14} />
                个人信息与隐私保护
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                ResumeOK 隐私政策
              </h1>
              <p className="mt-1.5 text-xs text-muted-ink">
                生效日期：2026 年 10 月 21 日 · 最近更新：2026 年 10 月 21 日
              </p>
            </div>
          </div>

          <div className="mt-7 space-y-7 text-sm leading-7 text-[#2c4735]">
            <section>
              <p>
                <strong>ResumeOK</strong>（以下简称“本平台”或“我们”）深知个人简历数据对您的重要性，我们将按照合法、正当、最小必要的原则，严格保护您的个人信息与简历隐私安全。本《隐私政策》旨在向您清晰说明我们在您使用本平台服务时如何收集、使用、存储和保护您的信息，以及您享有的各项权利。
              </p>
            </section>

            <section className="space-y-2.5">
              <h2 className="text-base font-semibold text-ink">
                一、 我们收集哪些信息及用途
              </h2>
              <p>
                为了向您提供账号认证、简历编辑保存及在线简历分享服务，我们仅在以下场景收集必要信息：
              </p>
              <ul className="list-disc space-y-2 pl-5 text-xs sm:text-sm">
                <li>
                  <strong>账号注册与登录信息</strong>：当您使用邮箱或 Google 账号登录时，我们会记录您的电子邮箱地址、加密后的密码哈希（<code>bcrypt</code>）或 Google OAuth 唯一身份标识（<code>sub</code>），用于识别您的账号身份并隔离保护您的简历数据。
                </li>
                <li>
                  <strong>您主动录入或导入的简历内容</strong>：包括您在简历编辑器中填写的姓名、求职意向、联系方式、教育经历、工作经历、项目经历、头像照片，以及您通过「导入简历」上传解析的 PDF 或图片文件。上传的原始文件仅在服务端内存中完成文本解析并立即释放，不会长期留存原始附件。
                </li>
                <li>
                  <strong>在线简历访客统计信息</strong>：当您主动开启「在线简历分享链接」并将链接发送给他人（如招聘方 HR）访问时，为向您提供「访客统计」功能，系统会记录访问该公开链接的时间、加密来源标记（<code>?t=...</code> 解码后的备注名称）、访问端浏览器/应用类型（User-Agent 概要）、城市级 IP 归属地及是否点击下载了 PDF。
                </li>
              </ul>
            </section>

            <section className="space-y-2.5">
              <h2 className="text-base font-semibold text-ink">
                二、 简历数据的存储与安全保护
              </h2>
              <p>
                2.1 <strong>账号级严格隔离</strong>：您的所有简历文档均按用户账号 ID 严格隔离存储在后端 PostgreSQL 数据库中，未授权的其他用户无法读取或修改您的简历。
              </p>
              <p>
                2.2 <strong>高强度加密与安全会话</strong>：登录密码采用高强度单向哈希加密存储，会话令牌（Session Token）在数据库中仅保存确定性 <code>SHA-256</code> 哈希值，不保存明文令牌，并启用 <code>HttpOnly</code> 与 <code>SameSite</code> 安全策略防止跨站攻击。
              </p>
              <p>
                2.3 <strong>来源标记加密保护</strong>：您在生成在线简历分享链接时填写的“投递公司 / HR 追踪标记”会自动编码为加密参数（<code>?t=...</code>），链接中不会直接暴露明文公司或 HR 名称。
              </p>
            </section>

            <section className="space-y-2.5">
              <h2 className="text-base font-semibold text-ink">
                三、 信息共享、转让与公开披露
              </h2>
              <p>
                3.1 <strong>绝不出售个人数据</strong>：我们郑重承诺，<strong>绝不会向任何第三方广告商、数据中介或无关机构出售、出租或交易您的个人简历信息</strong>。
              </p>
              <p>
                3.2 <strong>您主动发起的在线分享</strong>：您的简历默认仅对您本人可见。仅当您在「在线简历」弹窗中点击发布并通过二次确认后，系统才会将您当前确认发布的简历快照展示在对应的专属链接上。您随时可以点击「关闭在线访问」立即终止对外公开访问。
              </p>
            </section>

            <section className="space-y-2.5">
              <h2 className="text-base font-semibold text-ink">
                四、 Cookie 与本地存储说明
              </h2>
              <p>
                4.1 我们仅使用维持网站核心功能所必需的 Cookie（例如登录会话凭证 <code>resumeok_session</code> 及 OAuth 防伪校验状态 Cookie）与浏览器本地缓存，用于保障您的登录状态与防丢失自动保存体验。我们不会植入任何跨站广告追踪 Cookie。
              </p>
            </section>

            <section className="space-y-2.5">
              <h2 className="text-base font-semibold text-ink">
                五、 您对个人信息享有的权利
              </h2>
              <p>您对自己的简历及账号信息享有完全的控制权：</p>
              <ul className="list-disc space-y-1.5 pl-5 text-xs sm:text-sm">
                <li>
                  <strong>查阅与更正</strong>：您可随时登录编辑器查阅、修改您的全部简历内容；
                </li>
                <li>
                  <strong>数据可携与备份导出</strong>：您可随时在「我的简历」中将简历导出为标准 JSON 备份文件，或导出为 PDF、Word、Markdown、图片；
                </li>
                <li>
                  <strong>撤回公开分享</strong>：您可随时在「在线简历」设置中点击「关闭在线访问」，立即撤回在线简历的外部访问权限；
                </li>
                <li>
                  <strong>删除与账号注销</strong>：您可随时删除单份或全部简历文档，或联系我们注销账号并彻底清除服务器上的关联数据。
                </li>
              </ul>
            </section>

            <section className="space-y-2.5">
              <h2 className="text-base font-semibold text-ink">
                六、 政策更新与联系我们
              </h2>
              <p>
                我们可能适时更新本《隐私政策》并在本页面发布。若您对个人信息保护有任何疑问或需要行使数据删除/账号注销权利，请随时通过本平台官方渠道联系我们，我们将在收到请求后及时为您处理。
              </p>
            </section>
          </div>
        </article>
      </main>
    </div>
  );
}
