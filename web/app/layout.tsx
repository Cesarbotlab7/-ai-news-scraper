import type { Metadata } from "next";
import { Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('http://124.222.23.162'),
  title: {
    default: 'AI热点资讯',
    template: '%s | AI热点资讯',
  },
  description: '聚合AI领域权威人物和媒体的最新动态，每3小时更新',
  keywords: ['AI', '人工智能', 'ChatGPT', 'LLM', '大模型', '深度学习', 'OpenAI', 'Anthropic'],
  openGraph: {
    title: 'AI热点资讯',
    description: '聚合AI领域权威人物和媒体的最新动态，每3小时更新',
    type: 'website',
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary',
    title: 'AI热点资讯',
    description: '聚合AI领域权威人物和媒体的最新动态，每3小时更新',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-screen flex" style={{ background: '#0f1117' }}>
        <Suspense
          fallback={
            <div
              className="hidden md:block w-[200px] flex-none"
              style={{ background: '#0b0d13', borderRight: '1px solid var(--line-soft)' }}
            />
          }
        >
          <Sidebar />
        </Suspense>
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </body>
    </html>
  );
}
