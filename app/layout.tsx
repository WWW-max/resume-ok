import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { documentStyles } from "@/lib/ui-styles";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ResumeOK — 让每一份简历，更接近 Offer",
  description:
    "在线制作专业简历，支持实时预览和一键导出 PDF。免费好用的简历编辑器。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // iOS notch / safe area
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${inter.variable} ${documentStyles} min-h-full antialiased [-webkit-text-size-adjust:100%]`}
    >
      <body className="min-h-full bg-background text-foreground font-workspace">
        {children}
      </body>
    </html>
  );
}
