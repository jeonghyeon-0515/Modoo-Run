import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import { LinkPendingCue } from '@/components/ui/link-pending-cue';
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
      title="지금 달릴 대회부터 골라보세요"
      description="접수중인 대회를 먼저 보고, 마음에 드는 일정은 저장하거나 계획으로 이어가세요."
      compactIntro
    >
      <section className="hero-shell overflow-hidden rounded-[1.6rem] p-4 text-white sm:rounded-[2rem] sm:p-6">
        <div className="max-w-3xl">
          <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[var(--brand-soft-strong)] ring-1 ring-white/10">
            접수중 대회 먼저 보기
          </p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
            가까운 일정부터
            <br className="hidden sm:block" /> 빠르게 훑어보세요
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-200 sm:text-base">
            러너가 바로 판단할 수 있도록 일정, 장소, 종목, 접수기간만 먼저 보여드려요.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link
            href="/races"
            className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(255,107,87,0.24)] transition hover:bg-[var(--brand-strong)]"
          >
            <span className="inline-flex items-center gap-2">
              지금 대회 보러 가기
              <LinkPendingCue mode="pill" label="여는 중…" />
            </span>
          </Link>
          <Link
            href="/plan"
            className="text-sm font-semibold text-slate-100 underline-offset-4 hover:underline"
          >
            <span className="inline-flex items-center gap-2">
              이번 달 계획 세우기
              <LinkPendingCue mode="dot" />
            </span>
          </Link>
          <Link
            href="/community"
            className="text-sm font-semibold text-slate-100 underline-offset-4 hover:underline"
          >
            <span className="inline-flex items-center gap-2">
              러너 이야기 보러 가기
              <LinkPendingCue mode="dot" />
            </span>
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
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {openRaces.length > 0
                  ? '가까운 일정 순으로 정리했어요.'
                  : '지금 열려 있는 대회가 적을 때는 최근 올라온 대회를 함께 보여드려요.'}
              </p>
            </div>
            <Link href="/races" className="text-sm font-semibold text-[var(--brand)]">
              <span className="inline-flex items-center gap-2">
                전체 일정 보기
                <LinkPendingCue mode="dot" />
              </span>
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {openRaces.length > 0 ? (
              openRaces.map((race) => (
                <Link
                  key={race.id}
                  href={`/races/${race.sourceRaceId}`}
                  aria-label={`${race.title} 상세 보기`}
                  className="interactive-card group rounded-[1.125rem] border border-slate-200 p-3 transition hover:-translate-y-0.5 hover:border-[var(--brand-soft)] sm:rounded-[1.5rem] sm:p-4"
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

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] font-semibold text-slate-500 sm:text-xs">
                    <span>카드 어디를 눌러도 상세로 이동해요</span>
                    <span className="inline-flex items-center gap-2 text-[var(--brand)] transition group-hover:translate-x-0.5">
                      상세 보기 →
                      <LinkPendingCue mode="dot" />
                    </span>
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
                <h2 className="text-xl font-semibold text-slate-950">이번 달 계획</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">달릴 날짜를 정하고, 완료한 날만 체크해보세요.</p>
              </div>
              <Link href="/plan" className="text-sm font-semibold text-[var(--brand)]">
                <span className="inline-flex items-center gap-2">
                  보기
                  <LinkPendingCue mode="dot" />
                </span>
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
                <p className="mt-1 text-sm leading-6 text-slate-600">후기와 준비 팁만 가볍게 둘러보세요.</p>
              </div>
              <Link href="/community" className="text-sm font-semibold text-[var(--brand)]">
                <span className="inline-flex items-center gap-2">
                  더 보기
                  <LinkPendingCue mode="dot" />
                </span>
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
