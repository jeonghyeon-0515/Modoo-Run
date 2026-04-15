import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';
import { PromoSlotCard } from '@/components/monetization/promo-slot-card';
import { RaceDetailViewTracker } from '@/components/races/race-detail-view-tracker';
import { LinkPendingOverlay } from '@/components/ui/link-pending-overlay';
import { StatusBadge } from '@/components/ui/status-badge';
import { LinkPendingCue } from '@/components/ui/link-pending-cue';
import { getOptionalViewer } from '@/lib/auth/session';
import { getRaceDetailPromoSlots } from '@/lib/monetization/public-catalog';
import {
  formatRaceDate,
  getRaceStatusLabel,
  getRaceStatusTone,
} from '@/lib/races/formatters';
import {
  getRaceCalendarDownloadPath,
  getRaceGoogleCalendarUrl,
  getRaceMapEmbedUrl,
  getRaceMapLinkUrl,
  getRaceOutboundPath,
  getRacePrimaryApplyUrl,
} from '@/lib/races/outbound';
import {
  getRaceBySourceRaceId,
  listBookmarkedRaceIds,
  listRelatedRaces,
} from '@/lib/races/repository';
import { buildBreadcrumbSchema, serializeJsonLd } from '@/lib/seo/schema';
import { buildAbsoluteUrl, getSiteUrl } from '@/lib/site';

type Params = Promise<{ raceId: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { raceId } = await params;
  const race = await getRaceBySourceRaceId(raceId);

  if (!race) {
    return {
      title: '대회를 찾을 수 없습니다 | 모두의 러닝',
      description: '요청한 대회 정보를 찾을 수 없습니다.',
    };
  }

  const description =
    race.summary ??
    `${race.title} · ${race.region ?? '지역 미정'} · ${race.location ?? '장소 정보 없음'} · ${race.courseSummary ?? '종목 정보 없음'} · ${race.registrationPeriodLabel ?? '접수기간 정보 없음'}`;

  return {
    title: `${race.title} | 모두의 러닝`,
    description,
    alternates: {
      canonical: `/races/${race.sourceRaceId}`,
    },
    openGraph: {
      title: race.title,
      description,
      url: `/races/${race.sourceRaceId}`,
      type: 'article',
      locale: 'ko_KR',
      siteName: '모두의 러닝',
    },
    twitter: {
      card: 'summary_large_image',
      title: race.title,
      description,
    },
  };
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
  const mapEmbedUrl = getRaceMapEmbedUrl(race);
  const primaryApplyUrl = getRacePrimaryApplyUrl(race);
  const mapLinkUrl = getRaceMapLinkUrl(race);
  const googleCalendarUrl = getRaceGoogleCalendarUrl(race);
  const calendarDownloadPath = race.eventDate ? getRaceCalendarDownloadPath(race.sourceRaceId) : null;
  const promoSlots = getRaceDetailPromoSlots(race);

  const informationCards = [
    ['일정', formatRaceDate(race.eventDate, race.eventDateLabel)],
    ['접수기간', race.registrationPeriodLabel ?? '접수기간 정보 없음'],
    ['장소', race.location ?? '장소 정보 없음'],
    ['종목', race.courseSummary ?? '종목 정보 없음'],
  ];
  const detailUrl = buildAbsoluteUrl(`/races/${race.sourceRaceId}`);
  const eventSchema = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: race.title,
    startDate: race.eventDate ? `${race.eventDate}T09:00:00+09:00` : undefined,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    description: race.summary ?? race.description ?? undefined,
    url: detailUrl,
    location: {
      '@type': 'Place',
      name: race.location ?? race.title,
      address: {
        '@type': 'PostalAddress',
        addressRegion: race.region ?? undefined,
        streetAddress: race.location ?? undefined,
        addressCountry: 'KR',
      },
    },
    organizer: race.organizer
      ? {
          '@type': 'Organization',
          name: race.organizer,
        }
      : undefined,
    offers: primaryApplyUrl
      ? {
          '@type': 'Offer',
          url: primaryApplyUrl,
          availability:
            race.registrationStatus === 'open'
              ? 'https://schema.org/InStock'
              : 'https://schema.org/SoldOut',
          validFrom: race.registrationOpenAt
            ? `${race.registrationOpenAt}T00:00:00+09:00`
            : undefined,
        }
      : undefined,
  };
  const siteUrl = getSiteUrl();
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: '홈', path: '/' },
    { name: '대회 일정', path: '/races' },
    { name: race.title, path: `/races/${race.sourceRaceId}` },
  ], siteUrl);

  return (
    <PageShell
      title={race.title}
      description="참가 전에 확인할 핵심 정보를 먼저 정리했습니다."
      compactIntro
    >
      <RaceDetailViewTracker sourceRaceId={race.sourceRaceId} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(eventSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbSchema) }}
      />
      <div className="mb-4">
        <Link
          href="/races"
          className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-soft-strong)] bg-white px-5 py-3 text-base font-semibold text-slate-900 shadow-sm transition hover:border-[var(--brand)] hover:text-[var(--brand-strong)]"
        >
          <span aria-hidden="true">←</span>
          대회 목록으로 돌아가기
          <LinkPendingCue mode="badge" label="이동" />
        </Link>
      </div>

      <section className="hero-shell overflow-hidden rounded-[1.75rem] p-6 text-white sm:rounded-[2rem] sm:p-8">
        <div className="max-w-4xl">
          <p className="inline-flex rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-[#ffd9cc] ring-1 ring-white/12">
            참가 전에 핵심 정보 먼저 보기
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusBadge tone={getRaceStatusTone(race.registrationStatus)}>
              {getRaceStatusLabel(race.registrationStatus)}
            </StatusBadge>
            {race.region ? <StatusBadge tone="neutral">{race.region}</StatusBadge> : null}
            {isBookmarked ? <StatusBadge tone="success">찜한 대회</StatusBadge> : null}
          </div>
          <p className="mt-5 text-sm font-semibold text-[#ffd9cc]">
            {formatRaceDate(race.eventDate, race.eventDateLabel)}
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-5xl">{race.title}</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">
            {race.summary ?? race.description ?? '대회 소개 문구가 아직 등록되지 않았습니다.'}
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
                href={getRaceOutboundPath(race.sourceRaceId, 'apply')}
                target="_blank"
                rel="noreferrer"
                className="public-primary-button inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition"
              >
                바로 지원하기
              </a>
            ) : null}
            {race.sourceDetailUrl ? (
              <a
                href={getRaceOutboundPath(race.sourceRaceId, 'source_detail')}
                target="_blank"
                rel="noreferrer"
                className="underline-offset-4 hover:underline"
              >
                주최 측 안내 보기
              </a>
            ) : null}
            {race.homepageUrl ? (
              <a
                href={getRaceOutboundPath(race.sourceRaceId, 'homepage')}
                target="_blank"
                rel="noreferrer"
                className="underline-offset-4 hover:underline"
              >
                공식 홈페이지 바로가기
              </a>
            ) : null}
            {mapLinkUrl ? (
              <a
                href={getRaceOutboundPath(race.sourceRaceId, 'map')}
                target="_blank"
                rel="noreferrer"
                className="underline-offset-4 hover:underline"
              >
                지도에서 보기
              </a>
            ) : null}
            {googleCalendarUrl ? (
              <a
                href={getRaceOutboundPath(race.sourceRaceId, 'calendar_google')}
                target="_blank"
                rel="noreferrer"
                className="underline-offset-4 hover:underline"
              >
                Google 캘린더 담기
              </a>
            ) : null}
            {calendarDownloadPath ? (
              <a href={calendarDownloadPath} className="underline-offset-4 hover:underline">
                ICS 저장
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mt-6 space-y-6">
        <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">정보가 다르게 보이나요?</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                일정, 접수기간, 장소, 공식 링크가 실제 안내와 다르면 운영팀에 알려주세요.
              </p>
            </div>
            <Link
              href={`/races/${race.sourceRaceId}/correction`}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
            >
              정보 수정 요청
            </Link>
          </div>
        </section>

        <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-950">스폰서 · 제휴 안내</h3>
              <p className="mt-1 text-sm text-slate-500">참가 준비 흐름 안에서 볼 수 있는 공개 가이드와 스폰서형 정보를 함께 정리했습니다.</p>
            </div>
            <Link href="/gear" className="text-sm font-semibold text-[var(--brand)]">
              준비물 가이드
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {promoSlots.map((slot) => (
              <PromoSlotCard
                key={slot.id}
                badge={slot.badge}
                title={slot.title}
                description={slot.description}
                href={slot.href}
                ctaLabel={slot.ctaLabel}
                external={slot.external}
                disclosure={slot.disclosure}
              />
            ))}
          </div>
        </section>

        <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-semibold text-slate-950">대회 장소</h3>
              {race.location ? <StatusBadge tone="neutral">{race.location}</StatusBadge> : null}
            </div>
            {mapLinkUrl ? (
              <a
                href={getRaceOutboundPath(race.sourceRaceId, 'map')}
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
              ? `${race.location} 기준 지도를 보여줍니다. 현장 집결 위치는 주최 측 안내에서 다시 확인해 주세요.`
              : '장소 정보가 부족해 지도를 표시할 수 없습니다.'}
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
              <p className="mt-1 text-sm text-slate-500">현재 접수 중인 일정만 모았습니다.</p>
            </div>
            <Link href="/races" className="text-sm font-semibold text-[var(--brand)]">
              <span className="inline-flex items-center gap-2">
                전체 보기
                <LinkPendingCue mode="badge" label="이동" />
              </span>
            </Link>
          </div>

          {relatedRaces.length > 0 ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {relatedRaces.map((item) => (
                <Link
                  key={item.id}
                  href={`/races/${item.sourceRaceId}`}
                  className="interactive-card group relative overflow-hidden rounded-[1.25rem] border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:border-slate-300"
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
                      <LinkPendingCue mode="badge" label="열기" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
              현재 같은 지역의 접수 중 대회가 없습니다.
            </div>
          )}
        </section>
      </section>
    </PageShell>
  );
}
