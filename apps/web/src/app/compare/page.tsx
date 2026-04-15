import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';
import { RaceCompareClient } from '@/components/races/race-compare-client';

export const metadata: Metadata = {
  title: '대회 비교 | 모두의 러닝',
  description: '관심 있는 러닝 대회를 일정, 접수기간, 장소, 종목 기준으로 비교합니다.',
  alternates: {
    canonical: '/compare',
  },
};

export default function ComparePage() {
  return (
    <PageShell
      title="대회 비교"
      description="관심 있는 대회를 담아두고 일정, 접수기간, 장소, 종목을 한 번에 비교하세요."
      compactIntro
    >
      <RaceCompareClient />
    </PageShell>
  );
}
