import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';

const quickLinks = [
  {
    title: '지금 접수 중인 대회 보기',
    description: '가장 많이 찾는 접수 중 대회를 바로 확인합니다.',
    href: '/races',
    tone: 'primary',
  },
  {
    title: '마감 임박 대회 보기',
    description: '놓치기 쉬운 일정만 빠르게 좁혀서 살펴봅니다.',
    href: '/races/closing-soon',
    tone: 'secondary',
  },
  {
    title: '커뮤니티 둘러보기',
    description: '러너들의 후기와 질문을 가볍게 이어서 확인합니다.',
    href: '/community',
    tone: 'secondary',
  },
] as const;

export default function Home() {
  return (
    <PageShell
      title="가볍게 들어와 바로 달릴 준비를 하세요"
      description="첫 화면에서 바로 대회 탐색, 마감 체크, 커뮤니티 이동까지 빠르게 이어지도록 정리했습니다."
      compactIntro
    >
      <section className="hero-shell rounded-[1.75rem] p-6 text-white shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-slate-100">빠른 시작</p>
        <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
          기다림 없이 바로 필요한 화면으로 이동할 수 있어요.
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
          모두의 러닝 첫 화면을 더 가볍게 열고, 자주 쓰는 경로만 먼저 보여주도록 바꿨습니다.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/races"
            className="public-primary-button inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition"
          >
            대회 일정 바로 보기
          </Link>
          <Link
            href="/login"
            className="public-secondary-button inline-flex items-center justify-center rounded-full border px-5 py-3 text-sm font-semibold transition"
          >
            로그인
          </Link>
        </div>
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-3">
        {quickLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="interactive-card rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-semibold text-slate-950">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
            <p
              className={`mt-5 text-sm font-semibold ${
                item.tone === 'primary' ? 'text-[var(--brand)]' : 'text-slate-500'
              }`}
            >
              바로 이동 →
            </p>
          </Link>
        ))}
      </section>
    </PageShell>
  );
}
