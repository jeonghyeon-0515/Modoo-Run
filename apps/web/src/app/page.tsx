import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import { getOptionalViewer } from '@/lib/auth/session';
import { listCommunityPosts } from '@/lib/community/repository';
import { getPlanView } from '@/lib/plans/repository';
import {
  formatLastSyncedAt,
  formatRaceDate,
  getRaceStatusLabel,
  getRaceStatusTone,
} from '@/lib/races/formatters';
import {
  getRaceExplorerSummary,
  listRaces,
  listRecentlySyncedRaces,
} from '@/lib/races/repository';

export const dynamic = 'force-dynamic';

const starterPrompts = [
  {
    title: '첫 10km 준비 루틴 공유',
    description: '훈련 빈도, 회복 방법, 장비 팁처럼 초보 러너가 바로 참고할 수 있는 이야기를 시작해보세요.',
  },
  {
    title: '대회 전날 체크리스트',
    description: '번호표, 아침 식사, 이동 계획, 보관 짐처럼 실전 준비 팁을 커뮤니티에 정리해둘 수 있습니다.',
  },
  {
    title: '완주 후기와 코스 메모',
    description: '업힐 구간, 급수 타이밍, 날씨 같은 실제 경험은 다음 러너에게 가장 도움이 됩니다.',
  },
];

function formatStatValue(value: number) {
  return `${value.toLocaleString('ko-KR')}개`;
}

export default async function Home() {
  const viewer = await getOptionalViewer();
  const [raceSummary, openRaces, recentRaces, posts, planView] = await Promise.all([
    getRaceExplorerSummary(),
    listRaces({ registrationStatus: 'open', limit: 6 }),
    listRecentlySyncedRaces(4),
    listCommunityPosts('all'),
    viewer ? getPlanView() : Promise.resolve(null),
  ]);

  const featuredRaces = openRaces.length > 0 ? openRaces : recentRaces;
  const latestPosts = posts.slice(0, 3);
  const summaryStats = [
    {
      label: '현재 접수중',
      value: formatStatValue(raceSummary.openCount),
      tone: 'info' as const,
      caption: '지금 바로 확인할 수 있는 대회 수',
    },
    {
      label: '누적 대회',
      value: formatStatValue(raceSummary.totalCount),
      tone: 'neutral' as const,
      caption: '수집해 둔 아카이브 전체 규모',
    },
    {
      label: '지역 커버리지',
      value: `${raceSummary.regionCount}개`,
      tone: 'success' as const,
      caption: '대회가 분포한 주요 지역 수',
    },
    {
      label: '커뮤니티 글',
      value: formatStatValue(latestPosts.length),
      tone: 'warning' as const,
      caption: '홈에서 바로 볼 수 있는 최신 글',
    },
  ];

  return (
    <PageShell
      title="대회 탐색부터 월간 플랜까지"
      description="접수중인 마라톤 대회를 더 보기 쉽게 찾고, 목표 대회를 기준으로 계획을 세우고, 매일의 달성을 기록하며, 다른 러너와 준비 과정을 나누는 흐름을 하나로 연결합니다."
    >
      <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <article className="hero-shell overflow-hidden rounded-[2rem] p-6 text-white sm:p-8">
          <div className="max-w-3xl">
            <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[var(--brand-soft-strong)] ring-1 ring-white/10">
              모바일 우선 러닝 허브
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              오늘 볼 대회와
              <br className="hidden sm:block" /> 이번 달 실행 계획을 한 화면에
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-200 sm:text-base">
              지금은 실제 대회 데이터를 더 넓게 수집해 아카이브를 키웠고, 홈에서는 접수중 대회와 최근 수집
              대회를 함께 보여줘 정보 공백을 줄였습니다.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/races"
              className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(255,107,87,0.24)] transition hover:bg-[var(--brand-strong)]"
            >
              접수중 대회 보기
            </Link>
            <Link
              href="/plan"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/12"
            >
              월간 플랜으로 이동
            </Link>
            <Link
              href="/community"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/12"
            >
              러너 이야기 보기
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {summaryStats.map((item) => (
              <article
                key={item.label}
                className="rounded-[1.5rem] bg-white/8 p-4 ring-1 ring-white/10 backdrop-blur"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-slate-200">{item.label}</p>
                  <StatusBadge tone={item.tone}>{item.label}</StatusBadge>
                </div>
                <p className="mt-3 text-2xl font-bold text-white">{item.value}</p>
                <p className="mt-2 text-xs leading-5 text-slate-300">{item.caption}</p>
              </article>
            ))}
          </div>
        </article>

        <aside className="space-y-6">
          <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-500">최근 동기화</p>
                <h3 className="mt-1 text-xl font-semibold text-slate-950">
                  {formatLastSyncedAt(raceSummary.latestSyncAt)}
                </h3>
              </div>
              <StatusBadge tone={raceSummary.openCount > 0 ? 'success' : 'warning'}>
                {raceSummary.openCount > 0 ? '데이터 확장됨' : '최근 수집 중심'}
              </StatusBadge>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              접수중 대회가 없는 시점에도 최근 수집한 대회를 함께 보여줘 첫 화면이 비지 않도록 구성했습니다.
            </p>
          </section>

          <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-950">지역별 분포</h3>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Top {raceSummary.topRegions.length}
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {raceSummary.topRegions.map((item) => (
                <div key={item.region} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-slate-900">{item.region}</p>
                    <p className="text-sm text-slate-500">{item.count.toLocaleString('ko-KR')}개</p>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-[var(--brand)]"
                      style={{
                        width: `${Math.max(12, Math.round((item.count / Math.max(raceSummary.totalCount, 1)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <article className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                {openRaces.length > 0 ? '지금 접수 가능한 대회' : '최근 수집한 대회'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {openRaces.length > 0
                  ? '이번 시즌에 바로 검토할 수 있는 접수중 대회를 우선 노출합니다.'
                  : '접수중 대회가 적을 때는 최근 수집한 대회를 함께 보여줘 탐색 밀도를 유지합니다.'}
              </p>
            </div>
            <Link href="/races" className="text-sm font-semibold text-[var(--brand)]">
              전체 대회 보기
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {featuredRaces.map((race) => (
              <Link
                key={race.id}
                href={`/races/${race.sourceRaceId}`}
                className="interactive-card rounded-[1.5rem] border border-slate-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-950">{race.title}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatRaceDate(race.eventDate, race.eventDateLabel)}
                    </p>
                  </div>
                  <StatusBadge tone={getRaceStatusTone(race.registrationStatus)}>
                    {getRaceStatusLabel(race.registrationStatus)}
                  </StatusBadge>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-slate-600">
                  <p>{race.region ?? '지역 정보 없음'} · {race.location ?? '장소 정보 없음'}</p>
                  <p>{race.courseSummary ?? '종목 정보 없음'}</p>
                  <p>마지막 수집 {formatLastSyncedAt(race.lastSyncedAt)}</p>
                </div>
              </Link>
            ))}
          </div>
        </article>

        <div className="space-y-6">
          <article className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">월간 플랜</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  목표 대회를 정하고 계획을 세운 뒤, 실행률과 연속 달성까지 한 화면에서 봅니다.
                </p>
              </div>
              <Link href="/plan" className="text-sm font-semibold text-[var(--brand)]">
                보기
              </Link>
            </div>

            {planView ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.25rem] border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">이번 달 완료율</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">{planView.stats.completionRate}%</p>
                </div>
                <div className="rounded-[1.25rem] border border-slate-200 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">연속 달성</p>
                  <p className="mt-2 text-2xl font-bold text-slate-950">{planView.stats.streak}일</p>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-[1.25rem] border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                로그인 후 개인 월간 플랜과 달성 현황을 확인할 수 있습니다.
              </div>
            )}
          </article>

          <article className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">러너 커뮤니티</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  실제 게시글이 적을 때도 바로 참여할 수 있는 주제를 함께 노출합니다.
                </p>
              </div>
              <Link href="/community" className="text-sm font-semibold text-[var(--brand)]">
                더 보기
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {latestPosts.length > 0 ? (
                latestPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/community/${post.id}`}
                    className="interactive-card block rounded-[1.25rem] border border-slate-200 p-4"
                  >
                    <StatusBadge tone="neutral">{post.category}</StatusBadge>
                    <h3 className="mt-3 text-sm font-semibold text-slate-950">{post.title}</h3>
                    <p className="mt-2 text-xs text-slate-500">
                      {post.authorLabel} · 댓글 {post.comment_count} · 신고 {post.report_count}
                    </p>
                  </Link>
                ))
              ) : (
                <div className="rounded-[1.25rem] border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                  아직 게시글이 없습니다. 아래 제안 주제로 첫 글을 시작해보세요.
                </div>
              )}

              {latestPosts.length < 3 && (
                <div className="grid gap-3">
                  {starterPrompts.slice(0, 3 - latestPosts.length).map((item) => (
                    <div key={item.title} className="rounded-[1.25rem] bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </article>
        </div>
      </section>
    </PageShell>
  );
}
