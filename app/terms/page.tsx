import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/Brand";
import { ArrowLeft, FileCheck2, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "用户服务协议",
  description:
    "ResumeOK 用户服务协议与使用条款，涵盖在线简历制作、导出下载、账号安全及在线简历分享规范。",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f2fbf6_0%,#ffffff_28%,#f8fcf9_100%)] text-ink">
      <header className="sticky top-0 z-20 border-b border-[#dff2e6] bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[960px] items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="返回 ResumeOK 首页">
            <Brand small />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/privacy"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#d4ecdd] bg-[#f5fbf7] px-3.5 py-1.5 text-xs font-medium text-[#1b6e3d] transition-colors hover:bg-[#e8f7ee]"
            >
              <ShieldCheck size={14} />
              隐私政策
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
                <FileCheck2 size={14} />
                法律与合规条款
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                ResumeOK 用户服务协议
              </h1>
              <p className="mt-1.5 text-xs text-muted-ink">
                生效日期：2026 年 10 月 21 日 · 最近更新：2026 年 10 月 21 日
              </p>
            </div>
          </div>

          <div className="mt-7 space-y-7 text-sm leading-7 text-[#2c4735]">
            <section>
              <p>
                欢迎使用 <strong>ResumeOK</strong>（以下简称“本平台”或“我们”）。本《用户服务协议》（以下简称“本协议”）是您与本平台之间关于注册、登录、使用在线简历制作、简历导入解析、导出下载及在线简历分享等服务所订立的具有法律约束力的协议。请您在使用本平台服务前仔细阅读并充分理解本协议全部内容。当您注册、登录或实际使用本平台服务时，即表示您已阅读并同意遵守本协议及
                <Link
                  href="/privacy"
                  className="mx-1 font-medium text-[#0cb449] underline underline-offset-4 hover:text-[#0a963c]"
                >
                  《隐私政策》
                </Link>
                的全部约定。
              </p>
            </section>

            <section className="space-y-2.5">
              <h2 className="text-base font-semibold text-ink">
                一、 服务内容与范围
              </h2>
              <p>
                1.1 本平台为用户提供专业的在线简历编辑与排版工具，主要功能包括但不限于：多模板简历可视化编辑、现有简历文件（PDF/图片/文本）导入与结构化解析、中英文简历转换、多格式导出（PDF、Word、图片、Markdown、JSON 备份）以及在线简历专属链接分享与访问统计。
              </p>
              <p>
                1.2 您在编辑器中对简历内容的日常草稿修改仅保存在您的个人账号下，不会自动覆盖已对外发布的在线简历；仅当您主动点击并确认「同步发布到线上」时，线上分享版本的简历内容才会同步更新。
              </p>
            </section>

            <section className="space-y-2.5">
              <h2 className="text-base font-semibold text-ink">
                二、 账号注册、使用与安全
              </h2>
              <p>
                2.1 您可以通过电子邮箱验证码、账号密码或 Google 授权登录本平台。您应确保注册及登录所使用的电子邮箱真实、合法、有效。
              </p>
              <p>
                2.2 您的账号仅限您本人使用。请妥善保管您的账号凭证与登录设备，因您自身保管不善导致的账号被盗或简历信息泄露，本平台将积极配合您采取冻结或关闭分享等补救措施，但不承担由此产生的直接或间接责任。
              </p>
              <p>
                2.3 您有权随时在编辑器中删除单份或全部简历数据、关闭在线简历分享链接，或通过账号菜单中的「注销账号并清空数据」功能永久注销账号。<strong>请注意：账号一旦注销将不可恢复，该账号下所有简历数据、在线分享链接以及尚未消耗完毕的会员资格或增值权益均将视为自愿放弃并同步清零，无法找回、转移或折现退款（即使后续使用相同邮箱重新注册，亦视为全新独立账号）。</strong>
              </p>
            </section>

            <section className="space-y-2.5">
              <h2 className="text-base font-semibold text-ink">
                三、 用户内容权属与行为规范
              </h2>
              <p>
                3.1 <strong>知识产权归属</strong>：您在本平台创建、导入、编写的个人简历内容（包括文字、头像照片、校徽图标及项目经历等），其著作权及相关合法权益完全归您本人所有。本平台仅在为您提供存储、排版渲染、导出及您主动开启的在线简历展示服务所必需的范围内处理上述内容。
              </p>
              <p>
                3.2 <strong>合法性承诺</strong>：您承诺在使用本平台服务（尤其是使用「在线简历分享链接」功能对外公开展示时）不得上传、发布或传播含有以下内容的信息：
              </p>
              <ul className="list-disc space-y-1.5 pl-5 text-xs sm:text-sm">
                <li>违反国家法律法规、危害国家安全或公共利益的内容；</li>
                <li>冒用他人身份、伪造他人个人信息或侵犯第三人肖像权、隐私权、商业秘密及知识产权的内容；</li>
                <li>包含木马、恶意脚本、钓鱼欺诈、色情低俗或违法广告推广的内容。</li>
              </ul>
              <p>
                若您发布的内容违反上述规定，本平台有权在不事先通知的情况下立即关闭相关在线简历分享链接、删除违规内容或限制账号使用。
              </p>
            </section>

            <section className="space-y-2.5">
              <h2 className="text-base font-semibold text-ink">
                四、 在线简历分享功能特别约定
              </h2>
              <p>
                4.1 本平台的简历数据默认处于<strong>私密状态</strong>，仅您本人登录后可见。
              </p>
              <p>
                4.2 当您主动使用「在线简历」功能并经过二次弹窗确认发布后，系统将为您生成专属的在线访问链接（形如 <code>/online-resume/您的自定义后缀</code>）。<strong>您充分知晓并同意：开启在线访问后，任何持有该链接的人员（如招聘方 HR）均可在线浏览该简历并下载 PDF 版本。</strong>
              </p>
              <p>
                4.3 请勿将包含高度敏感个人隐私（如身份证号、家庭详细门牌号、银行卡号等）的信息发布至公开分享链接。您可随时在「在线简历」弹窗中点击<strong>「关闭在线访问」</strong>，关闭后该线上链接将立即失效，外部人员将无法继续访问。
              </p>
            </section>

            <section className="space-y-2.5">
              <h2 className="text-base font-semibold text-ink">
                五、 服务变更、中断与免责声明
              </h2>
              <p>
                5.1 本平台致力于提供稳定、安全的云端保存服务，同时也支持您随时通过「备份导出（JSON）」与「导出 PDF」功能在本地留存副本。建议您在重要求职节点及时下载本地备份。
              </p>
              <p>
                5.2 本平台仅提供简历制作与展示工具，不对用户简历内容的真实性及求职录用结果作任何明示或暗示的担保。因不可抗力、基础运营商网络故障、第三方云服务检修等原因导致的服务短暂中断，我们将尽力及时恢复。
              </p>
            </section>

            <section className="space-y-2.5">
              <h2 className="text-base font-semibold text-ink">
                六、 协议修改与联系方式
              </h2>
              <p>
                6.1 我们可能根据产品功能演进及法律法规要求适时修订本协议，并在本页面公布最新生效版本。
              </p>
              <p>
                6.2 如您对本协议或本平台服务有任何疑问、建议或投诉，可通过本平台官方支持渠道与我们联系。
              </p>
            </section>
          </div>
        </article>
      </main>
    </div>
  );
}
