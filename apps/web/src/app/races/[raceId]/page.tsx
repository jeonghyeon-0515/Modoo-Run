import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/layout/page-shell';
import { LinkPendingOverlay } from '@/components/ui/link-pending-overlay';
import { StatusBadge } from '@/components/ui/status-badge';
import { LinkPendingCue } from '@/components/ui/link-pending-cue';
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

type Params = Promise<{ raceId: string }>;

function buildMapQuery(input: { title: string; region?: string | null; location?: string | null }) {
  return [input.region, input.location, input.title].filter(Boolean).join(' ');
}

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
  const mapQuery = buildMapQuery({
    title: race.title,
    region: race.region,
    location: race.location,
  });
  const mapEmbedUrl = mapQuery
    ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=17&output=embed`
    : null;
  const mapLinkUrl = mapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`
    : null;
  const primaryApplyUrl = race.homepageUrl ?? race.sourceDetailUrl ?? null;

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
        <Link
          href="/races"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-soft-strong)] bg-white px-5 py-3 text-base font-semibold text-slate-900 shadow-sm transition hover:border-[var(--brand)] hover:text-[var(--brand-strong)]"
        >
          <span aria-hidden="true">←</span>
          대회 목록으로 돌아가기
          <LinkPendingCue mode="badge" label="돌아가는 중" />
        </Link>
      </div>

      <section className="hero-shell overflow-hidden rounded-[1.75rem] p-6 text-white sm:rounded-[2rem] sm:p-8">
        <div className="max-w-4xl">
          <p className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[var(--brand-soft-strong)] ring-1 ring-white/10">
            참가 전에 핵심 정보 먼저 보기
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusBadge tone={getRaceStatusTone(race.registrationStatus)}>
              {getRaceStatusLabel(race.registrationStatus)}
            </StatusBadge>
            {race.region ? <StatusBadge tone="neutral">{race.region}</StatusBadge> : null}
            {isBookmarked ? <StatusBadge tone="success">찜한 대회</StatusBadge> : null}
          </div>
          <p className="mt-5 text-sm font-semibold text-[var(--brand-soft-strong)]">
            {formatRaceDate(race.eventDate, race.eventDateLabel)}
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-5xl">{race.title}</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">
            {race.summary ?? race.description ?? '대회 이야기가 아직 충분히 들어오지 않았어요.'}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {informationCards.map(([label, value]) => (
              <div key={label} className="rounded-[1.1rem] bg-white/10 px-4 py-4 ring-1 ring-white/10 backdrop-blur">
                <p className="text-[11px] font-semibold text-slate-300">{label}</p>
                <p className="mt-2 text-base font-semibold leading-6 text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-semibold text-slate-100">
            {primaryApplyUrl ? (
              <a
                href={primaryApplyUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_38px_rgba(255,107,87,0.28)] transition hover:bg-[var(--brand-strong)]"
              >
                바로 지원하기
              </a>
            ) : null}
            {race.sourceDetailUrl ? (
              <a href={race.sourceDetailUrl} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                주최 측 안내 보기
              </a>
            ) : null}
            {race.homepageUrl ? (
              <a href={race.homepageUrl} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                공식 홈페이지 바로가기
              </a>
            ) : null}
            {mapLinkUrl ? (
              <a href={mapLinkUrl} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                지도에서 보기
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-6 space-y-6">
        <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-semibold text-slate-950">대회 장소</h3>
              {race.location ? <StatusBadge tone="neutral">{race.location}</StatusBadge> : null}
            </div>
            {mapLinkUrl ? (
              <a
                href={mapLinkUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-semibold text-[var(--brand)] underline-offset-4 hover:underline"
              >
                지도 앱으로 열기
              </a>
            ) : null}
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {race.location
              ? `${race.location} 기준으로 지도를 보여드려요. 현장 집결 위치는 주최 측 안내에서 한 번 더 확인해주세요.`
              : '장소 정보가 부족해서 지도를 바로 보여주기 어렵습니다.'}
          </p>
          {mapEmbedUrl ? (
            <div className="mt-5 overflow-hidden rounded-[1.5rem] ring-1 ring-slate-200">
              <iframe
                title={`${race.title} 장소 지도`}
                src={mapEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[320px] w-full border-0"
              />
            </div>
          ) : (
            <div className="mt-5 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              지도에 표시할 수 있을 만큼 장소 정보가 충분하지 않아요.
            </div>
          )}
        </section>

        <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">비슷한 지역의 다른 접수중 대회</h3>
              <p className="mt-1 text-sm text-slate-500">지금 바로 함께 살펴볼 수 있는 일정만 모았어요.</p>
            </div>
            <Link href="/races" className="text-sm font-semibold text-[var(--brand)]">
              <span className="inline-flex items-center gap-2">
                전체 보기
                <LinkPendingCue mode="badge" label="이동 중" />
              </span>
            </Link>
          </div>

          {relatedRaces.length > 0 ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {relatedRaces.map((item) => (
                <Link
                  key={item.id}
                  href={`/races/${item.sourceRaceId}`}
                  className="interactive-card group relative overflow-hidden rounded-[1.25rem] border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-[var(--brand-soft)]"
                >
                  <LinkPendingOverlay label="추천 대회 여는 중…" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-[var(--brand)]">
                        {formatRaceDate(item.eventDate, item.eventDateLabel)}
                      </p>
                      <h4 className="mt-1 line-clamp-2 text-sm font-semibold text-slate-950">{item.title}</h4>
                    </div>
                    <StatusBadge tone={getRaceStatusTone(item.registrationStatus)}>
                      {getRaceStatusLabel(item.registrationStatus)}
                    </StatusBadge>
                  </div>
                  <p className="mt-3 line-clamp-1 text-sm text-slate-600">
                    {item.location ?? '장소 정보 없음'} · {item.courseSummary ?? '종목 정보 없음'}
                  </p>
                  <div className="mt-3 text-right text-xs font-semibold text-[var(--brand)] transition group-hover:translate-x-0.5">
                    <span className="inline-flex items-center gap-2">
                      이 대회 보기 →
                      <LinkPendingCue mode="badge" label="여는 중" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              지금 추천할 수 있는 같은 지역의 접수중 대회를 아직 충분히 찾지 못했습니다.
            </div>
          )}
        </section>
      </section>
    </PageShell>
  );
}
