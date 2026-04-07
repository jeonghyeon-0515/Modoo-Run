import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "모두의 러닝",
  description:
    "접수중인 마라톤 대회 탐색, 월별 러닝 계획, 달성 체크, 커뮤니티를 연결하는 모바일 우선 러닝 웹앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)]">
        {children}
      </body>
    </html>
  );
}
