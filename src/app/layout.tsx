import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// [修改 1] 这里控制浏览器标签页的标题和描述
export const metadata: Metadata = {
  title: "全景角色设定生成器 v7.0",
  description: "Professional AI Character Design Tool powered by Gemini",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>{children}</body>
    </html>
  );
}