import "server-only";
import nodemailer from "nodemailer";

export async function sendLoginCode(email: string, code: string) {
  const port = Number(process.env.SMTP_PORT ?? "1025");
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "127.0.0.1",
    port,
    secure: false,
  });
  await transport.sendMail({
    from: process.env.SMTP_FROM ?? "ResumeOK <no-reply@resume-ok.local>",
    to: email,
    subject: `${code} 是你的 ResumeOK 登录验证码`,
    text: `你的 ResumeOK 登录验证码是：${code}\n\n验证码将在 10 分钟后失效，且只能使用一次。若非本人操作，请忽略本邮件。`,
    html: `<p>你的 ResumeOK 登录验证码是：</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px">${code}</p><p>验证码将在 10 分钟后失效，且只能使用一次。若非本人操作，请忽略本邮件。</p>`,
  });
}
