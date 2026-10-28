import "server-only";
import nodemailer from "nodemailer";

export async function sendLoginCode(email: string, code: string) {
  const port = Number(process.env.SMTP_PORT ?? "1025");
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "127.0.0.1",
    port,
    secure: process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === "true"
      : port === 465,
    ...(smtpUser && smtpPass
      ? {
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        }
      : {}),
  });
  const rawFrom = process.env.SMTP_FROM?.trim();
  const fromAddress =
    rawFrom && (!smtpUser || !rawFrom.includes("@resume-ok.local"))
      ? rawFrom
      : smtpUser
        ? `ResumeOK <${smtpUser}>`
        : "ResumeOK <no-reply@resume-ok.local>";

  await transport.sendMail({
    from: fromAddress,
    replyTo: smtpUser || undefined,
    to: email,
    subject: `[ResumeOK] 登录验证码 / Verification Code: ${code}`,
    text: `您好！您的 ResumeOK 登录验证码为：${code}（10 分钟内有效，仅可使用一次）。如非本人操作，请忽略此邮件。\n\nHello! Your ResumeOK verification code is: ${code}. This code will expire in 10 minutes and can only be used once. If you did not request this code, please ignore this email.\n\nhttps://resumeok.cn`,
    html: `
      <div style="max-width:520px;margin:0 auto;padding:28px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1f2937;border:1px solid #e5e7eb;border-radius:12px;background:#ffffff;">
        <div style="font-size:16px;font-weight:700;color:#0d853d;margin-bottom:16px;">ResumeOK</div>
        <p style="font-size:14px;line-height:1.6;margin:0 0 6px;">您好！您正在登录 <strong>ResumeOK</strong>，本次邮箱验证码为：</p>
        <p style="font-size:13px;line-height:1.5;color:#4b5563;margin:0 0 16px;">Hello! Here is your one-time verification code to sign in to <strong>ResumeOK</strong>:</p>
        <div style="margin:20px 0;padding:16px;text-align:center;background:#f2fbf6;border:1px solid #cdebd9;border-radius:10px;font-size:28px;font-weight:800;letter-spacing:6px;color:#0d853d;">${code}</div>
        <p style="font-size:13px;line-height:1.6;color:#4b5563;margin:0 0 6px;">验证码将在 <strong>10 分钟</strong>后失效，且仅可使用一次。若非本人操作，请忽略本邮件。</p>
        <p style="font-size:12px;line-height:1.5;color:#6b7280;margin:0 0 16px;">This code expires in <strong>10 minutes</strong> and can only be used once. If you didn't request this, you can safely ignore this email.</p>
        <div style="border-top:1px solid #f3f4f6;padding-top:12px;font-size:12px;color:#9ca3af;">
          Automated message from <a href="https://resumeok.cn" style="color:#0d853d;text-decoration:none;">resumeok.cn</a> · 请勿直接回复
        </div>
      </div>
    `,
  });
}
