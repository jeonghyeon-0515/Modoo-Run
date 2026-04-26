import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';
import { PartnerInquiryCard } from '@/components/monetization/partner-inquiry-card';
import { getOptionalViewer } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

const quickEntryLinks = [
  { href: '/races', label: '접수 중 대회' },
  { href: '/races/closing-soon', label: '마감 임박' },
  { href: '/plan', label: '일정 캘린더' },
  { href: '/compare', label: '대회 비교' },
  { href: '/community', label: '커뮤니티' },
];

const destinationCards: Array<{
  eyebrow: string;
  title: string;
  href: string;
  action: string;
  tone: 'brand' | 'default';
}> = [
  {
    eyebrow: '탐색 시작',
    title: '대회 일정 둘러보기',
    href: '/races',
    action: '대회 보러 가기',
    tone: 'brand',
  },
  {
    eyebrow: '놓치기 쉬운 일정',
    title: '마감 임박 대회 확인',
    href: '/races/closing-soon',
    action: '마감 일정 보기',
    tone: 'default',
  },
  {
    eyebrow: '계획 세우기',
    title: '이번 달 러닝 캘린더',
    href: '/plan',
    action: '캘린더 열기',
    tone: 'default',
  },
  {
    eyebrow: '비교해서 고르기',
    title: '대회 비교하기',
    href: '/compare',
    action: '비교 화면 열기',
    tone: 'default',
  },
  {
    eyebrow: '러너들의 이야기',
    title: '커뮤니티 읽고 남기기',
    href: '/community',
    action: '커뮤니티 보기',
    tone: 'default',
  },
];

const signedOutActions = [
  {
    eyebrow: '로그인하면',
    title: '내 일정과 기록 저장',
    href: '/login?next=%2Fplan',
    action: '로그인하고 계획 보기',
  },
  {
    eyebrow: '먼저 둘러보기',
    title: '대회부터 가볍게 탐색',
    href: '/races',
    action: '대회 둘러보기',
  },
  {
    eyebrow: '정보 모으기',
    title: '커뮤니티 후기 읽기',
    href: '/community',
    action: '후기 읽기',
  },
];

const signedInActions = [
  {
    eyebrow: '이어서 하기',
    title: '이번 달 일정',
    href: '/plan',
    action: '내 일정 보기',
  },
  {
    eyebrow: '놓치지 않기',
    title: '알림 확인',
    href: '/notifications',
    action: '알림 보러 가기',
  },
  {
    eyebrow: '같이 준비하기',
    title: '커뮤니티 둘러보기',
    href: '/community',
    action: '이야기 보러 가기',
  },
];

function cardClassName(tone: 'brand' | 'default') {
  return tone === 'brand'
    ? 'interactive-card interactive-card-featured soft-surface rounded-[1.35rem] border border-[var(--brand-soft-strong)] bg-[var(--public-accent-soft)] p-5'
    : 'interactive-card soft-surface rounded-[1.35rem] border border-black/5 bg-white p-5';
}

export default async function Home() {
  const viewer = await getOptionalViewer();
  const heroPrimaryLink = viewer
    ? { href: '/plan', label: '내 일정 보기' }
    : { href: '/login?next=%2Fplan', label: '로그인하고 시작하기' };
  const heroSecondaryLink = viewer
    ? { href: '/races', label: '접수 중 대회 보기' }
    : { href: '/races', label: '대회 둘러보기' };
  const followUpActions = viewer
    ? viewer.isStaff
      ? [
          ...signedInActions.slice(0, 2),
          {
            eyebrow: '운영 확인',
            title: '관리자 화면',
            href: '/ops',
            action: '관리자 가기',
          },
        ]
      : signedInActions
    : signedOutActions;

  return (
    <PageShell
      title={viewer ? `${viewer.displayName}님, 오늘도 달려볼까요?` : '러닝 홈'}
      description={viewer ? '일정, 대회, 커뮤니티를 바로 이어서 볼 수 있습니다.' : '대회, 계획, 커뮤니티를 한 화면에서 시작합니다.'}
      compactIntro
      viewer={viewer}
    >
      <section>
        <article className="soft-surface rounded-[1.75rem] border border-[var(--brand-soft-strong)] bg-[var(--public-accent-soft)] p-6 sm:p-7">
          <p className="text-sm font-semibold text-[var(--brand-strong)]">
            {viewer ? '오늘 바로 이어서' : '바로 시작'}
          </p>
          <h2 className="text-balance mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            {viewer ? '오늘 일정과 다음 대회로 바로 가세요.' : '대회와 계획을 바로 시작하세요.'}
          </h2>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={heroPrimaryLink.href}
              className="focus-ring pressable inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--brand-strong)]"
            >
              {heroPrimaryLink.label}
            </Link>
            <Link
              href={heroSecondaryLink.href}
              className="focus-ring pressable inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {heroSecondaryLink.label}
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {quickEntryLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="focus-ring pressable inline-flex min-h-11 items-center rounded-full border border-white/70 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </article>
      </section>

      <section className="mt-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-950">많이 찾는 화면</h2>
          </div>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {destinationCards.map((item) => (
            <Link key={item.href} href={item.href} className={`focus-ring block ${cardClassName(item.tone)}`}>
              <p className="text-xs font-semibold text-slate-500">{item.eyebrow}</p>
              <h3 className="text-balance mt-3 text-xl font-semibold tracking-tight text-slate-950">{item.title}</h3>
              <span className="mt-5 inline-flex min-h-11 items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                {item.action}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <article className="soft-surface rounded-[1.5rem] border border-black/5 bg-white p-6">
          <h2 className="text-balance text-2xl font-bold tracking-tight text-slate-950">추천 화면</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {followUpActions.map((item) => (
              <Link key={item.href} href={item.href} className="focus-ring interactive-card soft-surface block rounded-[1.25rem] border border-black/5 bg-slate-50 p-5 hover:bg-white">
                <p className="text-xs font-semibold text-slate-500">{item.eyebrow}</p>
                <h3 className="text-balance mt-3 text-lg font-semibold text-slate-950">{item.title}</h3>
                <span className="mt-5 inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
                  {item.action}
                </span>
              </Link>
            ))}
          </div>
        </article>

        <PartnerInquiryCard sourcePath="/" compact />
      </section>
    </PageShell>
  );
}
