import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI热点资讯",
  description: "聚合AI领域权威人物和媒体的最新动态",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
            <a href="/" className="text-lg font-bold text-gray-900 hover:text-gray-700">
              AI热点
            </a>
            <span className="text-xs text-gray-400">每3小时更新</span>
          </div>
        </header>
        <main className="flex-1 max-w-2xl mx-auto w-full px-3 py-4 sm:px-4 sm:py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
