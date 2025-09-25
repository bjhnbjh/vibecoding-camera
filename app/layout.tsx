import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 식단 기록 | 원클릭으로 간편하게",
  description: "사진 한 장으로 식단을 자동 분석하고 기록하는 AI 서비스. 마찰 없는 기록으로 건강한 식습관을 만들어보세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <script src="https://js.tosspayments.com/v1"></script>
      </head>
      <body className="antialiased bg-gradient-to-br from-emerald-50 via-cyan-50 to-sky-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
