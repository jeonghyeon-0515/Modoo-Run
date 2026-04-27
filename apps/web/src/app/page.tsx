import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';
import { getOptionalViewer } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

const quickLinks = [
  {
    href: '/races/closing-soon',
    eyebrow: '놓치기 전에',
    title: '마감 임박 대회',
    description: '이번 주 안에 확인해야 할 일정만 먼저 모아봅니다.',
  },
  {
    href: '/plan',
    eyebrow: '일정 맞추기',
    title: '월간 플랜',
    description: '목표 대회에 맞춰 이번 달 훈련 계획을 정리합니다.',
  },
  {
    href: '/community',
    eyebrow: '같이 준비하기',
    title: '커뮤니티',
    description: '준비 과정과 후기, 실전 팁을 다른 러너와 나눕니다.',
  },
];

const signedOutActions = [
  {
    eyebrow: '처음 시작할 때',
    title: '지금 열려 있는 대회 보기',
    href: '/races',
    action: '대회 일정 보기',
  },
  {
    eyebrow: '저장하고 싶다면',
    title: '로그인 후 플랜 만들기',
    href: '/login?next=%2Fplan',
    action: '로그인하고 시작하기',
  },
];

const signedInActions = [
  {
    eyebrow: '이어서 보기',
    title: '이번 달 플랜',
    href: '/plan',
    action: '플랜 보기',
  },
  {
    eyebrow: '놓치지 않기',
    title: '알림 확인',
    href: '/notifications',
    action: '알림 보기',
  },
  {
    eyebrow: '비교해서 고르기',
    title: '대회 비교',
    href: '/compare',
    action: '비교 화면 열기',
  },
];

export default async function Home() {
  const viewer = await getOptionalViewer();
  const secondaryActions = viewer
    ? viewer.isStaff
      ? [
          ...signedInActions.slice(0, 2),
          {
            eyebrow: '운영 확인',
            title: '관리자 화면',
            href: '/ops',
            action: '관리 화면 열기',
          },
        ]
      : signedInActions
    : signedOutActions;

  return (
    <PageShell
      title={viewer ? `${viewer.displayName}님, 다음 러닝을 이어가볼까요?` : '러닝 준비를 한 번에 이어보세요'}
      description="대회 찾기부터 월간 계획, 커뮤니티까지 필요한 흐름만 가볍게 이어서 확인할 수 있습니다."
      compactIntro
      viewer={viewer}
    >
      <section className="hero-shell overflow-hidden rounded-[1.75rem] px-6 py-7 text-white sm:px-8 sm:py-9">
        <p className="text-sm font-semibold text-[#ffd3c4]">Everyone&apos;s Running</p>
        <h2 className="text-balance mt-3 text-3xl font-bold tracking-tight sm:text-[40px]">
          접수 중인 대회부터
          <br className="hidden sm:block" />
          계획과 기록까지 바로 시작하세요.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
          지금 열려 있는 일정은 빠르게 찾고, 목표 대회에 맞춘 플랜과 준비 흐름은 한 곳에서 이어볼 수 있습니다.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/races"
            className="focus-ring public-primary-button pressable inline-flex min-h-11 items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
          >
            대회 일정 보기
          </Link>
          <Link
            href={viewer ? '/plan' : '/login?next=%2Fplan'}
            className="focus-ring pressable inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--secondary)] hover:bg-[#fff6f2]"
          >
            {viewer ? '이번 달 플랜 보기' : '로그인하고 저장하기'}
          </Link>
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        {quickLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="interactive-card soft-surface rounded-[1.5rem] border border-[var(--line)] bg-white p-5"
          >
            <p className="text-xs font-semibold text-[var(--brand-strong)]">{item.eyebrow}</p>
            <h3 className="text-balance mt-2 text-lg font-semibold text-[var(--secondary)]">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
          </Link>
        ))}
      </section>

      <section className="mt-6 rounded-[1.5rem] border border-[var(--line)] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[var(--secondary)] sm:text-2xl">다음으로 많이 찾는 화면</h2>
            <p className="mt-1 text-sm text-slate-500">찾기 → 계획하기 → 실행하기 흐름에 맞춰 자주 여는 화면만 남겼습니다.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {secondaryActions.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="interactive-card rounded-[1.25rem] border border-[var(--line)] bg-[#fffaf8] p-5"
            >
              <p className="text-xs font-semibold text-slate-500">{item.eyebrow}</p>
              <h3 className="text-balance mt-2 text-lg font-semibold text-[var(--secondary)]">{item.title}</h3>
              <span className="mt-4 inline-flex min-h-11 items-center rounded-full border border-[rgba(255,107,84,0.16)] bg-white px-4 py-2 text-sm font-semibold text-[var(--brand-strong)]">
                {item.action}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
