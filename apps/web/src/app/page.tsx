import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';

const quickLinks = [
  {
    eyebrow: '가장 많이 찾는 메뉴',
    title: '대회 일정',
    description: '접수 중인 대회를 날짜순으로 바로 살펴봅니다.',
    href: '/races',
    action: '지금 보기',
    featured: true,
  },
  {
    eyebrow: '먼저 챙길 일정',
    title: '마감 임박',
    description: '곧 마감되는 일정만 빠르게 확인합니다.',
    href: '/races/closing-soon',
    action: '마감 일정 보기',
    featured: false,
  },
  {
    eyebrow: '가볍게 둘러보기',
    title: '커뮤니티',
    description: '후기와 질문을 편하게 둘러봅니다.',
    href: '/community',
    action: '둘러보기',
    featured: false,
  },
] as const;

export default function Home() {
  return (
    <PageShell title="러닝 홈" compactIntro>
      <section className="hero-shell rounded-[1.75rem] p-6 text-white shadow-sm sm:p-8">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold tracking-[0.16em] text-slate-200">바로 찾기</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            대회 일정, 마감 체크, 커뮤니티를 한 번에.
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-200 sm:text-base">
            자주 찾는 메뉴만 먼저 담았습니다.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/races"
              className="public-primary-button inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition"
            >
              대회 일정 보기
            </Link>
            <Link
              href="/races/closing-soon"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              마감 임박 보기
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-3">
        {quickLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`interactive-card rounded-[1.25rem] border p-5 shadow-sm ${
              item.featured
                ? 'border-[var(--brand-soft-strong)] bg-[var(--public-accent-soft)] md:col-span-2'
                : 'border-slate-200 bg-white'
            }`}
          >
            <p className={`text-xs font-semibold ${item.featured ? 'text-[var(--brand)]' : 'text-slate-500'}`}>
              {item.eyebrow}
            </p>
            <p className="mt-2 text-xl font-semibold tracking-tight text-slate-950">{item.title}</p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{item.description}</p>
            <p className="mt-5 text-sm font-semibold text-[var(--brand-strong)]">{item.action} →</p>
          </Link>
        ))}
      </section>
    </PageShell>
  );
}
