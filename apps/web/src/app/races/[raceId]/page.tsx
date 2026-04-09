import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/layout/page-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import { getOptionalViewer } from '@/lib/auth/session';
import {
  formatRaceDate,
  getRaceStatusLabel,
  getRaceStatusTone,
} from '@/lib/races/formatters';
import {
  getRaceBySourceRaceId,
  listBookmarkedRaceIds,
  listRelatedRaces,
} from '@/lib/races/repository';
import { toggleRaceBookmarkAction } from './actions';

type Params = Promise<{ raceId: string }>;

export default async function RaceDetailPage({ params }: { params: Params }) {
  const { raceId } = await params;
  const viewer = await getOptionalViewer();
  const race = await getRaceBySourceRaceId(raceId);

  if (!race) {
    notFound();
  }

  const [bookmarkedRaceIds, relatedRaces] = await Promise.all([
    viewer ? listBookmarkedRaceIds(viewer.id) : Promise.resolve(new Set<string>()),
    listRelatedRaces({
      excludeSourceRaceId: race.sourceRaceId,
      region: race.region,
      limit: 3,
    }),
  ]);

  const isBookmarked = bookmarkedRaceIds.has(race.id);

  const informationCards = [
    ['일정', formatRaceDate(race.eventDate, race.eventDateLabel)],
    ['접수기간', race.registrationPeriodLabel ?? '접수기간 정보 없음'],
    ['장소', race.location ?? '장소 정보 없음'],
    ['종목', race.courseSummary ?? '종목 정보 없음'],
  ];

  return (
    <PageShell
      title={race.title}
      description="참가 전에 필요한 일정과 장소부터 먼저 볼 수 있게 정리했어요."
      compactIntro
    >
      <div className="mb-4">
        <Link href="/races" className="text-sm font-semibold text-[var(--brand)]">
          ← 대회 목록으로 돌아가기
        </Link>
      </div>

      <section className="rounded-[1.6rem] bg-white p-5 shadow-sm ring-1 ring-black/5 sm:rounded-[1.9rem] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={getRaceStatusTone(race.registrationStatus)}>
                {getRaceStatusLabel(race.registrationStatus)}
              </StatusBadge>
              {race.region ? <StatusBadge tone="neutral">{race.region}</StatusBadge> : null}
              {isBookmarked ? <StatusBadge tone="success">찜한 대회</StatusBadge> : null}
            </div>
            <p className="mt-4 text-sm font-semibold text-[var(--brand)]">
              {formatRaceDate(race.eventDate, race.eventDateLabel)}
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{race.title}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {race.summary ?? race.description ?? '대회 이야기가 아직 충분히 들어오지 않았어요.'}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {informationCards.map(([label, value]) => (
                <div key={label} className="rounded-[1.1rem] bg-slate-50 px-4 py-3">
                  <p className="text-[11px] font-semibold text-slate-400">{label}</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-900">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex min-w-56 flex-col gap-3 sm:min-w-72">
            <Link
              href="/plan"
              className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
            >
              이 대회로 계획 세우기
            </Link>
            {race.sourceDetailUrl ? (
              <a
                href={race.sourceDetailUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                주최 측 안내 보기
              </a>
            ) : null}
            {race.homepageUrl ? (
              <a
                href={race.homepageUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                공식 홈페이지 바로가기
              </a>
            ) : null}
            {viewer ? (
              <form action={toggleRaceBookmarkAction}>
                <input type="hidden" name="sourceRaceId" value={race.sourceRaceId} />
                <input type="hidden" name="raceId" value={race.id} />
                <input type="hidden" name="enabled" value={isBookmarked ? 'false' : 'true'} />
                <button
                  type="submit"
                  className="w-full rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {isBookmarked ? '찜한 대회 해제' : '찜한 대회 저장'}
                </button>
              </form>
            ) : (
              <Link
                href={`/login?next=${encodeURIComponent(`/races/${race.sourceRaceId}`)}`}
                className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                로그인하고 저장하기
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="space-y-6">
          <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-950">대회 소개</h3>
                <p className="mt-1 text-sm text-slate-500">참가 전에 읽어두면 좋은 핵심 안내를 먼저 정리했어요.</p>
              </div>
              <StatusBadge tone={getRaceStatusTone(race.registrationStatus)}>
                {getRaceStatusLabel(race.registrationStatus)}
              </StatusBadge>
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {race.description ?? race.summary ?? '대회 이야기가 아직 충분히 들어오지 않았어요.'}
            </p>

            {race.organizer || race.representativeName || race.phone ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold text-slate-400">주최</p>
                  <p className="mt-2 text-sm text-slate-700">{race.organizer ?? '정보 없음'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-semibold text-slate-400">문의</p>
                  <p className="mt-2 text-sm text-slate-700">
                    {[race.representativeName, race.phone].filter(Boolean).join(' · ') || '정보 없음'}
                  </p>
                </div>
              </div>
            ) : null}
          </section>

          <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-950">비슷한 지역의 다른 대회</h3>
              <Link href="/races" className="text-sm font-semibold text-[var(--brand)]">
                전체 보기
              </Link>
            </div>

            {relatedRaces.length > 0 ? (
              <div className="mt-4 grid gap-3">
                {relatedRaces.map((item) => (
                  <Link
                    key={item.id}
                    href={`/races/${item.sourceRaceId}`}
                    className="interactive-card group rounded-[1.25rem] border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-[var(--brand-soft)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-950">{item.title}</h4>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatRaceDate(item.eventDate, item.eventDateLabel)}
                        </p>
                      </div>
                      <StatusBadge tone={getRaceStatusTone(item.registrationStatus)}>
                        {getRaceStatusLabel(item.registrationStatus)}
                      </StatusBadge>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                      {item.location ?? '장소 정보 없음'} · {item.courseSummary ?? '종목 정보 없음'}
                    </p>
                    <div className="mt-3 text-right text-xs font-semibold text-[var(--brand)] transition group-hover:translate-x-0.5">
                      이 대회 보기 →
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                같이 둘러보기 좋은 대회 데이터를 아직 충분히 찾지 못했습니다.
              </div>
            )}
          </section>
        </article>

        <aside className="space-y-6">
          <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h3 className="text-lg font-semibold text-slate-950">빠르게 확인할 것</h3>
            <div className="mt-4 space-y-4 text-sm text-slate-600">
              <div>
                <p className="text-xs font-semibold text-slate-400">체크 포인트</p>
                <p className="mt-1">
                  {race.registrationStatus === 'open'
                    ? '접수 마감 전인지 확인하고, 바로 계획에 담아두세요.'
                    : '접수 상태를 먼저 확인한 뒤 비슷한 다른 대회도 함께 살펴보세요.'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400">주최 측 안내</p>
                <p className="mt-1">
                  {race.sourceDetailUrl ? '아래 링크에서 모집 요강과 준비물을 바로 확인할 수 있어요.' : '주최 측 링크가 아직 정리되지 않았어요.'}
                </p>
              </div>
              {race.sourceDetailUrl ? (
                <div>
                  <a
                    href={race.sourceDetailUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex text-[var(--brand)] underline-offset-4 hover:underline"
                  >
                    주최 측 안내 바로가기
                  </a>
                </div>
              ) : null}
              {race.homepageUrl ? (
                <div>
                  <p className="text-xs font-semibold text-slate-400">대회 홈페이지</p>
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

          {race.organizer || race.representativeName || race.phone ? (
            <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
              <h3 className="text-lg font-semibold text-slate-950">주최 정보</h3>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                {race.organizer ? (
                  <div>
                    <p className="text-xs font-semibold text-slate-400">주최</p>
                    <p className="mt-1">{race.organizer}</p>
                  </div>
                ) : null}
                {race.representativeName ? (
                  <div>
                    <p className="text-xs font-semibold text-slate-400">대표자</p>
                    <p className="mt-1">{race.representativeName}</p>
                  </div>
                ) : null}
                {race.phone ? (
                  <div>
                    <p className="text-xs font-semibold text-slate-400">전화번호</p>
                    <p className="mt-1">{race.phone}</p>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}
        </aside>
      </section>
    </PageShell>
  );
}
