import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import { getOptionalViewer } from '@/lib/auth/session';
import { listCommunityPosts } from '@/lib/community/repository';
import { getPlanView } from '@/lib/plans/repository';
import {
  formatRaceDate,
  getRaceStatusLabel,
  getRaceStatusTone,
} from '@/lib/races/formatters';
import { listRaces } from '@/lib/races/repository';

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

export default async function Home() {
  const viewer = await getOptionalViewer();
  const [openRaces, posts, planView] = await Promise.all([
    listRaces({ registrationStatus: 'open', limit: 6 }),
    listCommunityPosts('all'),
    viewer ? getPlanView() : Promise.resolve(null),
  ]);

  const latestPosts = posts.slice(0, 3);
  const categoryLabels: Record<string, string> = {
    free: '자유게시판',
    training: '대회 준비',
    review: '후기',
  };

  return (
    <PageShell
      title="대회 찾기부터 기록까지 한 번에"
      description="지금 신청할 수 있는 대회를 먼저 보고, 마음에 드는 일정은 계획으로 이어서 차근차근 준비해보세요."
    >
      <section className="hero-shell overflow-hidden rounded-[2rem] p-5 text-white sm:p-8">
        <div className="max-w-3xl">
          <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[var(--brand-soft-strong)] ring-1 ring-white/10">
            달리기 준비, 여기서 시작해요
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            가까운 일정부터
            <br className="hidden sm:block" /> 지금 신청할 수 있는 대회를 살펴보세요
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-200 sm:text-base">
            당장 살펴보기 좋은 대회를 날짜 순으로 먼저 보여드려요. 복잡한 요약보다
            참가에 필요한 핵심 정보만 가볍게 담았습니다.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:flex">
          <Link
            href="/races"
            className="col-span-2 inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(255,107,87,0.24)] transition hover:bg-[var(--brand-strong)] sm:col-auto"
          >
            지금 대회 보러 가기
          </Link>
          <Link
            href="/plan"
            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/12"
          >
            이번 달 계획 세우기
          </Link>
          <Link
            href="/community"
            className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/6 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/12"
          >
            러너 이야기 보러 가기
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <article className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-950">
                {openRaces.length > 0 ? '지금 신청 가능한 대회' : '최근 올라온 대회'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {openRaces.length > 0
                  ? '가까운 일정 순으로 모았어요. 카드마다 꼭 필요한 정보만 빠르게 볼 수 있어요.'
                  : '지금 열려 있는 대회가 적을 때는 최근 올라온 대회를 함께 보여드려요.'}
              </p>
            </div>
            <Link href="/races" className="text-sm font-semibold text-[var(--brand)]">
              전체 일정 보기
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {openRaces.length > 0 ? (
              openRaces.map((race) => (
                <Link
                  key={race.id}
                  href={`/races/${race.sourceRaceId}`}
                  className="interactive-card rounded-[1.125rem] border border-slate-200 p-3 sm:rounded-[1.5rem] sm:p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-[var(--brand)] sm:text-xs">
                        {formatRaceDate(race.eventDate, race.eventDateLabel)}
                      </p>
                      <h3 className="mt-1 line-clamp-2 text-sm font-semibold text-slate-950 sm:text-base">
                        {race.title}
                      </h3>
                    </div>
                    <StatusBadge tone={getRaceStatusTone(race.registrationStatus)}>
                      {getRaceStatusLabel(race.registrationStatus)}
                    </StatusBadge>
                  </div>

                  <div className="mt-2 grid gap-1 text-xs text-slate-600 sm:mt-3 sm:text-sm">
                    <p className="line-clamp-1">
                      {race.region ?? '지역 미정'} · {race.location ?? '장소 정보는 상세에서 확인해보세요'}
                    </p>
                    <p className="line-clamp-1">{race.courseSummary ?? '종목 정보는 상세 화면에서 확인할 수 있어요.'}</p>
                    {race.registrationPeriodLabel ? (
                      <p className="line-clamp-1 text-slate-500">접수 {race.registrationPeriodLabel}</p>
                    ) : null}
                  </div>
                </Link>
              ))
            ) : (
              <div className="rounded-[1.25rem] border border-dashed border-slate-300 p-4 text-sm text-slate-600 md:col-span-2">
                지금 바로 신청할 수 있는 대회가 많지 않아요. 전체 일정에서 최근 올라온 대회도 함께 살펴보세요.
              </div>
            )}
          </div>
        </article>

        <div className="space-y-6">
          <article className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">이번 달 러닝 계획</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  이번 달에 어떻게 달릴지 정하고, 달린 날마다 차근차근 체크해보세요.
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
                로그인 후 개인 이번 달 러닝 계획과 달성 현황을 확인할 수 있습니다.
              </div>
            )}
          </article>

          <article className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">러너들의 이야기</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  요즘 올라온 이야기와 바로 써볼 만한 주제를 함께 보여드려요.
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
                    <StatusBadge tone="neutral">{categoryLabels[post.category] ?? post.category}</StatusBadge>
                    <h3 className="mt-3 text-sm font-semibold text-slate-950">{post.title}</h3>
                    <p className="mt-2 text-xs text-slate-500">
                      {post.authorLabel} · 댓글 {post.comment_count} · 신고 {post.report_count}
                    </p>
                  </Link>
                ))
              ) : (
                <div className="rounded-[1.25rem] border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                  아직 올라온 글이 많지 않아요. 아래 주제로 첫 이야기를 시작해보세요.
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
