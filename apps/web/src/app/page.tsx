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
  description: string;
  href: string;
  action: string;
  tone: 'brand' | 'default';
}> = [
  {
    eyebrow: '탐색 시작',
    title: '대회 일정 둘러보기',
    description: '지역과 거리별로 접수 중인 대회를 빠르게 찾아볼 수 있습니다.',
    href: '/races',
    action: '대회 보러 가기',
    tone: 'brand',
  },
  {
    eyebrow: '놓치기 쉬운 일정',
    title: '마감 임박 대회 확인',
    description: '신청 마감이 가까운 대회만 따로 모아 바로 확인합니다.',
    href: '/races/closing-soon',
    action: '마감 일정 보기',
    tone: 'default',
  },
  {
    eyebrow: '계획 세우기',
    title: '이번 달 러닝 캘린더',
    description: '훈련 계획과 실행 기록을 한 달 단위로 정리할 수 있습니다.',
    href: '/plan',
    action: '캘린더 열기',
    tone: 'default',
  },
  {
    eyebrow: '비교해서 고르기',
    title: '대회 비교하기',
    description: '코스와 일정이 비슷한 대회를 한 화면에서 비교해 결정합니다.',
    href: '/compare',
    action: '비교 화면 열기',
    tone: 'default',
  },
  {
    eyebrow: '러너들의 이야기',
    title: '커뮤니티 읽고 남기기',
    description: '대회 준비 팁, 훈련 기록, 완주 후기를 읽고 직접 남길 수 있습니다.',
    href: '/community',
    action: '커뮤니티 보기',
    tone: 'default',
  },
];

const signedOutActions = [
  {
    eyebrow: '로그인하면',
    title: '내 일정과 기록 저장',
    description: '이번 달 계획과 실행 기록을 계정에 저장해 이어서 관리할 수 있습니다.',
    href: '/login?next=%2Fplan',
    action: '로그인하고 계획 보기',
  },
  {
    eyebrow: '먼저 둘러보기',
    title: '대회부터 가볍게 탐색',
    description: '회원가입 없이도 대회 일정과 마감 임박 목록을 바로 확인할 수 있습니다.',
    href: '/races',
    action: '대회 둘러보기',
  },
  {
    eyebrow: '정보 모으기',
    title: '커뮤니티 후기 읽기',
    description: '실제 참가자 후기와 준비 팁을 읽고 대회 선택에 참고할 수 있습니다.',
    href: '/community',
    action: '후기 읽기',
  },
];

const signedInActions = [
  {
    eyebrow: '이어서 하기',
    title: '이번 달 일정 캘린더',
    description: '계획을 정리하고 완료 상태를 바로 업데이트할 수 있습니다.',
    href: '/plan',
    action: '내 일정 보기',
  },
  {
    eyebrow: '놓치지 않기',
    title: '알림 확인하기',
    description: '대회 업데이트와 필요한 안내를 한곳에서 빠르게 확인합니다.',
    href: '/notifications',
    action: '알림 보러 가기',
  },
  {
    eyebrow: '같이 준비하기',
    title: '커뮤니티 둘러보기',
    description: '질문을 남기거나 다른 러너의 경험을 읽으며 다음 일정을 준비합니다.',
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
    : { href: '/races', label: '대회 일정 둘러보기' };
  const followUpActions = viewer
    ? viewer.isStaff
      ? [
          ...signedInActions.slice(0, 2),
          {
            eyebrow: '운영 확인',
            title: '관리자 화면 열기',
            description: '제휴, 보정 요청, 운영 현황을 확인해야 할 때 바로 이동합니다.',
            href: '/ops',
            action: '관리자 가기',
          },
        ]
      : signedInActions
    : signedOutActions;

  return (
    <PageShell
      title={viewer ? `${viewer.displayName}님, 오늘도 달려볼까요?` : '러닝 홈'}
      description={
        viewer
          ? '대회 탐색, 일정 관리, 러너 커뮤니티를 한 번에 이어서 시작할 수 있습니다.'
          : '대회 탐색, 일정 관리, 커뮤니티까지 한 화면에서 시작할 수 있는 러너 홈입니다.'
      }
      compactIntro
      viewer={viewer}
    >
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)] lg:items-stretch">
        <article className="soft-surface rounded-[1.75rem] border border-[var(--brand-soft-strong)] bg-[var(--public-accent-soft)] p-6 sm:p-7">
          <p className="text-sm font-semibold text-[var(--brand-strong)]">
            {viewer ? '오늘 이어서 달리기' : '처음 들어와도 바로 시작'}
          </p>
          <h2 className="text-balance mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
            {viewer ? '내 일정과 다음 대회를 바로 이어서 관리해보세요.' : '대회 찾기부터 계획 세우기까지 한 번에 시작해보세요.'}
          </h2>
          <p className="text-pretty mt-4 max-w-2xl text-sm leading-7 text-slate-700 sm:text-base">
            {viewer
              ? '이번 달 캘린더를 열고, 알림을 확인하고, 커뮤니티에서 필요한 정보를 바로 확인할 수 있습니다.'
              : '회원가입 전에도 대회 일정과 커뮤니티를 둘러볼 수 있고, 로그인하면 일정과 기록을 내 계정에 저장할 수 있습니다.'}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
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
          <div className="mt-6 flex flex-wrap gap-2">
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

        <section className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <article className="soft-surface rounded-[1.25rem] border border-black/5 bg-white p-5">
            <p className="text-sm font-medium text-slate-500">대회 탐색</p>
            <p className="text-balance mt-3 text-xl font-semibold text-slate-950">접수 중 일정과 마감 임박 대회를 빠르게 확인합니다.</p>
          </article>
          <article className="soft-surface rounded-[1.25rem] border border-black/5 bg-white p-5">
            <p className="text-sm font-medium text-slate-500">일정 관리</p>
            <p className="text-balance mt-3 text-xl font-semibold text-slate-950">이번 달 계획과 실행 기록을 한곳에서 이어서 관리합니다.</p>
          </article>
          <article className="soft-surface rounded-[1.25rem] border border-black/5 bg-white p-5">
            <p className="text-sm font-medium text-slate-500">커뮤니티</p>
            <p className="text-balance mt-3 text-xl font-semibold text-slate-950">준비 팁과 완주 후기를 읽고 직접 질문을 남길 수 있습니다.</p>
          </article>
        </section>
      </section>

      <section className="mt-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-500">바로 가기</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">지금 가장 많이 찾는 화면</h2>
          </div>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {destinationCards.map((item) => (
            <Link key={item.href} href={item.href} className={`focus-ring block ${cardClassName(item.tone)}`}>
              <p className="text-xs font-semibold text-slate-500">{item.eyebrow}</p>
              <h3 className="text-balance mt-3 text-xl font-semibold tracking-tight text-slate-950">{item.title}</h3>
              <p className="text-pretty mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
              <span className="mt-5 inline-flex min-h-11 items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                {item.action}
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <article className="soft-surface rounded-[1.5rem] border border-black/5 bg-white p-6">
          <p className="text-sm font-semibold text-slate-500">{viewer ? '상태에 맞는 다음 행동' : '로그인 전에도 할 수 있는 것'}</p>
          <h2 className="text-balance mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {viewer ? '지금 이어서 하기 좋은 화면' : '시작 흐름을 더 짧게'}
          </h2>
          <p className="text-pretty mt-3 text-sm leading-6 text-slate-600">
            {viewer
              ? '가장 자주 이어서 보는 화면을 모았습니다. 오늘 필요한 동선부터 바로 열어보세요.'
              : '로그인 전에는 탐색부터, 로그인 후에는 일정 저장과 알림 확인까지 자연스럽게 이어집니다.'}
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {followUpActions.map((item) => (
              <Link key={item.href} href={item.href} className="focus-ring interactive-card soft-surface block rounded-[1.25rem] border border-black/5 bg-slate-50 p-5 hover:bg-white">
                <p className="text-xs font-semibold text-slate-500">{item.eyebrow}</p>
                <h3 className="text-balance mt-3 text-lg font-semibold text-slate-950">{item.title}</h3>
                <p className="text-pretty mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
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
