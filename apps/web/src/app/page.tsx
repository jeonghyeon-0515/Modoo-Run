import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';

const quickLinks = [
  {
    title: '대회 일정',
    description: '접수 중인 대회를 바로 확인합니다.',
    href: '/races',
  },
  {
    title: '마감 임박',
    description: '놓치기 쉬운 일정만 빠르게 봅니다.',
    href: '/races/closing-soon',
  },
  {
    title: '커뮤니티',
    description: '후기와 질문을 이어서 확인합니다.',
    href: '/community',
  },
] as const;

export default function Home() {
  return (
    <PageShell title="바로 이동" compactIntro>
      <section className="grid gap-4 md:grid-cols-3">
        {quickLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="interactive-card rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-semibold text-slate-950">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            <p className="mt-5 text-sm font-semibold text-[var(--brand)]">바로 이동 →</p>
          </Link>
        ))}
      </section>
    </PageShell>
  );
}
