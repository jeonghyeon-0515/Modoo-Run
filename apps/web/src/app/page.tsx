import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';

const quickChecks = [
  {
    label: '기본 동선',
    value: '대회 일정부터 바로 확인',
  },
  {
    label: '놓치기 쉬운 일정',
    value: '마감 임박 대회를 먼저 확인',
  },
  {
    label: '커뮤니티 흐름',
    value: '후기와 질문으로 바로 이동',
  },
] as const;

const quickLinks = [
  {
    eyebrow: '가장 많이 찾는 경로',
    title: '대회 일정',
    description: '접수 중인 대회를 가장 먼저 확인하고 비교까지 바로 이어갑니다.',
    href: '/races',
    action: '접수 중 일정 보기',
    featured: true,
  },
  {
    eyebrow: '먼저 챙길 일정',
    title: '마감 임박',
    description: '놓치기 쉬운 대회만 빠르게 좁혀서 확인합니다.',
    href: '/races/closing-soon',
    action: '마감 일정 보기',
    featured: false,
  },
  {
    eyebrow: '가볍게 둘러보기',
    title: '커뮤니티',
    description: '후기와 질문을 보면서 다음 러닝 계획을 이어갑니다.',
    href: '/community',
    action: '커뮤니티 보기',
    featured: false,
  },
] as const;

export default function Home() {
  return (
    <PageShell
      title="오늘의 러닝 동선"
      compactIntro
    >
      <section className="hero-shell rounded-[1.75rem] p-6 text-white shadow-sm sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.9fr)] lg:items-end">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-slate-200">MODOO RUN</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
              일정 확인부터 마감 체크까지 한 번에 이어지는 홈입니다.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
              빠른 탐색은 유지하면서도, 첫 화면에서 어디로 가야 할지 더 분명하게 보이도록 디자인을 정리했습니다.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/races"
                className="public-primary-button inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition"
              >
                대회 일정 바로 보기
              </Link>
              <Link
                href="/races/closing-soon"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                마감 임박 먼저 보기
              </Link>
            </div>
          </div>

          <div className="rounded-[1.25rem] bg-white/10 p-4 shadow-sm ring-1 ring-white/15 backdrop-blur-sm">
            <p className="text-sm font-semibold text-white">빠른 확인</p>
            <div className="mt-4 space-y-3">
              {quickChecks.map((item) => (
                <div key={item.label} className="rounded-2xl bg-white/8 px-4 py-3 ring-1 ring-white/10">
                  <p className="text-[11px] font-semibold tracking-[0.12em] text-slate-200">{item.label}</p>
                  <p className="mt-1 text-sm font-medium text-white">{item.value}</p>
                </div>
              ))}
            </div>
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
            <span className="route-link-badge mt-5">{item.action}</span>
          </Link>
        ))}
      </section>
    </PageShell>
  );
}
