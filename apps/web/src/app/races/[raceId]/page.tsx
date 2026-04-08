import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/layout/page-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import { getOptionalViewer } from '@/lib/auth/session';
import { formatLastSyncedAt, formatRaceDate, getRaceStatusLabel, getRaceStatusTone } from '@/lib/races/formatters';
import { getRaceBySourceRaceId, listBookmarkedRaceIds } from '@/lib/races/repository';
import { toggleRaceBookmarkAction } from './actions';

type Params = Promise<{ raceId: string }>;

export default async function RaceDetailPage({ params }: { params: Params }) {
  const { raceId } = await params;
  const viewer = await getOptionalViewer();
  const [race, bookmarkedRaceIds] = await Promise.all([
    getRaceBySourceRaceId(raceId),
    viewer ? listBookmarkedRaceIds(viewer.id) : Promise.resolve(new Set<string>()),
  ]);

  if (!race) {
    notFound();
  }

  const isBookmarked = bookmarkedRaceIds.has(race.id);

  const informationCards = [
    ['일정', formatRaceDate(race.eventDate, race.eventDateLabel)],
    ['접수기간', race.registrationPeriodLabel ?? '접수기간 정보 없음'],
    ['지역', race.region ?? '지역 정보 없음'],
    ['장소', race.location ?? '장소 정보 없음'],
    ['종목', race.courseSummary ?? '종목 정보 없음'],
    ['주최', race.organizer ?? '주최 정보 없음'],
  ];

  return (
    <PageShell
      title={race.title}
      description="핵심 정보는 바로 읽히고, 필요한 상세 설명은 아래에서 차분하게 확인할 수 있는 구조를 목표로 합니다."
    >
      <div className="mb-4">
        <Link href="/races" className="text-sm font-semibold text-[var(--brand)]">
          ← 대회 목록으로 돌아가기
        </Link>
      </div>

      <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">{formatRaceDate(race.eventDate, race.eventDateLabel)}</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{race.title}</h2>
          </div>
          <StatusBadge tone={getRaceStatusTone(race.registrationStatus)}>
            {getRaceStatusLabel(race.registrationStatus)}
          </StatusBadge>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {informationCards.map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h3 className="text-lg font-semibold text-slate-950">대회 소개</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            {race.description ?? race.summary ?? '아직 상세 소개가 수집되지 않았습니다.'}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">대표자</p>
              <p className="mt-2 text-sm text-slate-700">{race.representativeName ?? '정보 없음'}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">전화번호</p>
              <p className="mt-2 text-sm text-slate-700">{race.phone ?? '정보 없음'}</p>
            </div>
          </div>
        </article>

        <aside className="space-y-6">
          <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h3 className="text-lg font-semibold text-slate-950">원문 및 수집 정보</h3>
            <div className="mt-4 space-y-4 text-sm text-slate-600">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">마지막 수집</p>
                <p className="mt-1">{formatLastSyncedAt(race.lastSyncedAt)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">원문 링크</p>
                {race.sourceDetailUrl ? (
                  <a
                    href={race.sourceDetailUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex text-[var(--brand)] underline-offset-4 hover:underline"
                  >
                    원문 페이지 보기
                  </a>
                ) : (
                  <p className="mt-1">원문 링크 없음</p>
                )}
              </div>
              {race.homepageUrl ? (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">공식 홈페이지</p>
                  <a
                    href={race.homepageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex text-[var(--brand)] underline-offset-4 hover:underline"
                  >
                    홈페이지 바로가기
                  </a>
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h3 className="text-lg font-semibold text-slate-950">다음 행동</h3>
            <div className="mt-4 flex flex-col gap-3">
              <Link
                href="/plan"
                className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
              >
                이 대회로 계획 만들기
              </Link>
              {viewer ? (
                <form action={toggleRaceBookmarkAction}>
                  <input type="hidden" name="sourceRaceId" value={race.sourceRaceId} />
                  <input type="hidden" name="raceId" value={race.id} />
                  <input type="hidden" name="enabled" value={isBookmarked ? 'false' : 'true'} />
                  <button
                    type="submit"
                    className="w-full rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {isBookmarked ? '관심 대회 해제' : '관심 대회 저장'}
                  </button>
                </form>
              ) : (
                <Link
                  href={`/login?next=${encodeURIComponent(`/races/${race.sourceRaceId}`)}`}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  로그인하고 관심 대회 저장
                </Link>
              )}
            </div>
          </section>
        </aside>
      </section>
    </PageShell>
  );
}
