import type { Metadata } from "next";
import "./globals.css";
import { getSiteUrl } from '@/lib/site';

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "모두의 러닝",
  description:
    "대회 찾기부터 계획 세우기, 기록 남기기까지 함께하는 러닝 서비스",
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: '모두의 러닝',
    description: '대회 찾기부터 계획 세우기, 기록 남기기까지 함께하는 러닝 서비스',
    url: '/',
    siteName: '모두의 러닝',
    locale: 'ko_KR',
    type: 'website',
  },
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
