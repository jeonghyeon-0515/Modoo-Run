import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';
import { FeaturedRaceSection } from '@/components/monetization/featured-race-section';
import { PartnerInquiryCard } from '@/components/monetization/partner-inquiry-card';
import { PromoSlotCard } from '@/components/monetization/promo-slot-card';
import { RaceCompareButton } from '@/components/races/race-compare-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { LinkPendingOverlay } from '@/components/ui/link-pending-overlay';
import { listActiveFeaturedRacePlacements } from '@/lib/monetization/featured-repository';
import { getRacesPagePromoSlots } from '@/lib/monetization/public-catalog';
import {
  formatRaceDate,
  getRaceStatusLabel,
  getRaceStatusTone,
} from '@/lib/races/formatters';
import { summarizeActiveRaceFilters } from '@/lib/races/cache-helpers';
import { raceLandingPages } from '@/lib/races/landing-config';
import { listRaces, listRegions } from '@/lib/races/repository';
import { RaceStatus } from '@/lib/races/types';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const distanceOptions = ['5km', '10km', '하프', '풀'];
const monthOptions = Array.from({ length: 12 }, (_, index) => `${index + 1}월`);
const statusOptions: Array<{ label: string; value: RaceStatus | 'all' }> = [
  { label: '전체 보기', value: 'all' },
  { label: '접수중', value: 'open' },
  { label: '접수마감', value: 'closed' },
];

function readFirstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function readMultiValue(value?: string | string[]) {
  if (!value) return [] as string[];
  return [...new Set((Array.isArray(value) ? value : [value]).map((item) => item.trim()).filter(Boolean))];
}

function createFilterHref(
  current: Record<'registrationStatus', string | undefined> & {
    region: string[];
    month: string[];
    distance: string[];
  },
  key: 'registrationStatus' | 'region' | 'month' | 'distance',
  value: string,
) {
  const next = new URLSearchParams();

  if (current.registrationStatus && key !== 'registrationStatus') {
    next.set('registrationStatus', current.registrationStatus);
  }

  (['region', 'month', 'distance'] as const).forEach((entryKey) => {
    if (entryKey === key || current[entryKey].length === 0) return;
    current[entryKey].forEach((entryValue) => next.append(entryKey, entryValue));
  });

  if (key === 'registrationStatus') {
    if (value && value !== 'all') {
      next.set(key, value);
    }
  } else if (value !== 'all') {
    const existing = current[key];
    const toggled = existing.includes(value)
      ? existing.filter((item) => item !== value)
      : [...existing, value];
    toggled.forEach((entryValue) => next.append(key, entryValue));
  }

  const query = next.toString();
  return query ? `/races?${query}` : '/races';
}

function FilterChip({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`focus-ring inline-flex min-h-11 items-center justify-center rounded-lg border px-3 py-2 text-xs font-medium transition sm:min-h-10 sm:py-1.5 sm:text-sm ${
        active
          ? 'public-chip-active'
          : 'public-chip-idle'
      }`}
    >
      {children}
    </Link>
  );
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-xs font-semibold text-slate-400">{children}</p>;
}

export default async function RacesPage({ searchParams }: { searchParams: SearchParams }) {
  const resolvedSearchParams = await searchParams;
  const filters = {
    registrationStatus:
      (readFirstValue(resolvedSearchParams.registrationStatus) as RaceStatus | 'all' | undefined) ?? 'open',
    region: readMultiValue(resolvedSearchParams.region),
    month: readMultiValue(resolvedSearchParams.month),
    distance: readMultiValue(resolvedSearchParams.distance),
  };

  const normalizedQuery = {
    registrationStatus: filters.registrationStatus === 'all' ? undefined : filters.registrationStatus,
    region: filters.region,
    month: filters.month,
    distance: filters.distance,
  };

  let races = [] as Awaited<ReturnType<typeof listRaces>>;
  let regions = [] as Awaited<ReturnType<typeof listRegions>>;
  let loadError: string | null = null;

  try {
    [races, regions] = await Promise.all([
      listRaces({
        registrationStatus: filters.registrationStatus,
        region: filters.region,
        month: filters.month,
        distance: filters.distance,
      }),
      listRegions(),
    ]);
  } catch (error) {
    loadError = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
  }

  const activeLabels = summarizeActiveRaceFilters(filters);
  const isDefaultOpenView =
    filters.registrationStatus === 'open' &&
    filters.region.length === 0 &&
    filters.month.length === 0 &&
    filters.distance.length === 0;
  const featuredRaces = await listActiveFeaturedRacePlacements(races, 2);
  const featuredRaceIds = new Set(featuredRaces.map((item) => item.race.id));
  const promoSlots = getRacesPagePromoSlots();

  const renderAdvancedFilters = () => (
    <>
      <div>
        <FilterLabel>지역</FilterLabel>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={filters.region.length === 0} href={createFilterHref(normalizedQuery, 'region', 'all')}>
            전체
          </FilterChip>
          {regions.map((region) => (
            <FilterChip
              key={region}
              active={filters.region.includes(region)}
              href={createFilterHref(normalizedQuery, 'region', region)}
            >
              {region}
            </FilterChip>
          ))}
        </div>
      </div>

      <div>
        <FilterLabel>월</FilterLabel>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={filters.month.length === 0} href={createFilterHref(normalizedQuery, 'month', 'all')}>
            전체
          </FilterChip>
          {monthOptions.map((month) => (
            <FilterChip
              key={month}
              active={filters.month.includes(month)}
              href={createFilterHref(normalizedQuery, 'month', month)}
            >
              {month}
            </FilterChip>
          ))}
        </div>
      </div>

      <div>
        <FilterLabel>거리</FilterLabel>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={filters.distance.length === 0} href={createFilterHref(normalizedQuery, 'distance', 'all')}>
            전체
          </FilterChip>
          {distanceOptions.map((distance) => (
            <FilterChip
              key={distance}
              active={filters.distance.includes(distance)}
              href={createFilterHref(normalizedQuery, 'distance', distance)}
            >
              {distance}
            </FilterChip>
          ))}
        </div>
      </div>
    </>
  );

  if (loadError) {
    return (
      <PageShell
        title="대회 일정"
        description="대회 목록을 다시 불러올 수 있도록 안내합니다."
      >
        <article className="rounded-[1.75rem] bg-white p-8 shadow-sm ring-1 ring-black/5">
          <p className="text-base font-semibold text-slate-950">대회 목록을 불러오지 못했습니다.</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{loadError}</p>
          <Link
            href="/races"
            className="mt-5 inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
          >
            다시 시도
          </Link>
        </article>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="대회 일정"
      description="접수 중인 대회를 가까운 일정 순으로 보여줍니다."
      compactIntro
    >
      <section className="mb-5 rounded-[1.25rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-950">빠른 탐색</p>
            <p className="mt-1 text-sm text-slate-500">검색 의도에 맞춰 자주 찾는 대회 묶음을 바로 볼 수 있습니다.</p>
          </div>
          <Link href="/races/closing-soon" className="focus-ring inline-flex min-h-11 items-center rounded-full border border-[var(--brand-soft-strong)] bg-[var(--brand-soft)] px-4 py-2 text-sm font-semibold text-[var(--brand-strong)] transition hover:bg-[#ffe9e2]">
            마감 임박 보기
          </Link>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 text-xs font-medium text-slate-400">
          <span>자주 찾는 필터 묶음</span>
          <span>좌우로 넘겨 더 보기</span>
        </div>
        <div className="relative mt-3">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-white to-transparent" />
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {raceLandingPages.map((item) => (
              <Link
                key={item.key}
                href={item.path}
                className="focus-ring inline-flex min-h-11 items-center whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
              >
                {item.eyebrow}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-1 rounded-[1.1rem] bg-white p-4 shadow-sm ring-1 ring-black/5 sm:rounded-[1.25rem]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {filters.registrationStatus === 'open' ? '접수 중 대회를 우선 표시합니다' : '원하는 상태를 선택해 보세요'}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {isDefaultOpenView
                  ? '날짜가 가까운 순서로 정렬했습니다.'
                  : activeLabels.length > 0
                    ? `${activeLabels.join(' · ')} 조건으로 조금 더 좁혀서 보여드리고 있어요.`
                    : '조건을 바꾸면 지금 찾는 일정만 가볍게 골라볼 수 있어요.'}
              </p>
            </div>

            {!isDefaultOpenView ? (
              <Link href="/races" className="focus-ring public-secondary-button inline-flex min-h-11 items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition">
                조건 초기화
              </Link>
            ) : null}
          </div>

          {!isDefaultOpenView && activeLabels.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-slate-400">현재 적용 중인 조건</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {activeLabels.map((label) => (
                  <span key={label} className="inline-flex min-h-10 items-center rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-[1rem] border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-400">접수 상태</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <FilterChip
                  key={option.value}
                  active={filters.registrationStatus === option.value}
                  href={createFilterHref(normalizedQuery, 'registrationStatus', option.value)}
                >
                  {option.label}
                </FilterChip>
              ))}
            </div>
          </div>

          <div className="rounded-[1rem] border border-slate-200 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">세부 조건</p>
              <p className="text-xs text-slate-500">지역 · 월 · 거리를 함께 조합할 수 있습니다.</p>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">{renderAdvancedFilters()}</div>
          </div>
        </div>
      </section>

      <section className="mt-4 space-y-3">
        <FeaturedRaceSection items={featuredRaces} />

        <div className="grid gap-4 md:grid-cols-2">
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

        {races.length === 0 ? (
          <article className="rounded-[1.25rem] bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
            <p className="text-base font-semibold text-slate-950">조건에 맞는 대회가 없습니다.</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              필터를 조금만 풀어보면 다른 일정도 편하게 살펴볼 수 있어요.
            </p>
            <Link
              href="/races"
              className="public-primary-button mt-5 inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold transition"
            >
              필터 초기화
            </Link>
          </article>
        ) : (
          races.map((race) => (
            <article
              key={race.id}
              className="overflow-hidden rounded-[1rem] border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 sm:rounded-[1.1rem]"
            >
              <Link
                href={`/races/${race.sourceRaceId}`}
                aria-label={`${race.title} 상세 보기`}
                className="group relative block p-3 sm:p-4"
              >
                <LinkPendingOverlay label="대회 여는 중…" />
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[11px] font-semibold text-slate-500 sm:text-xs">
                        {formatRaceDate(race.eventDate, race.eventDateLabel)}
                      </p>
                      {race.region ? <StatusBadge tone="neutral">{race.region}</StatusBadge> : null}
                      {featuredRaceIds.has(race.id) ? <StatusBadge tone="disclosure">Featured</StatusBadge> : null}
                    </div>
                    <h2 className="mt-1 line-clamp-2 text-sm font-semibold text-slate-950 sm:text-lg">
                      {race.title}
                    </h2>

                    <p className="mt-3 line-clamp-1 text-sm font-medium text-slate-700">
                      {race.location ?? '장소 정보는 상세에서 확인해보세요.'}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 sm:text-sm">
                      <span>{race.courseSummary ?? '종목 정보는 상세 페이지에서 확인할 수 있습니다.'}</span>
                      {race.registrationPeriodLabel ? (
                        <>
                          <span className="text-slate-300">·</span>
                          <span>접수 {race.registrationPeriodLabel}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <StatusBadge tone={getRaceStatusTone(race.registrationStatus)}>
                      {getRaceStatusLabel(race.registrationStatus)}
                    </StatusBadge>
                    <span className="inline-flex min-h-10 items-center rounded-full border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 transition group-hover:border-slate-300 group-hover:bg-slate-50 group-hover:text-slate-950 sm:text-xs">
                      자세히 보기
                    </span>
                  </div>
                </div>
              </Link>
              <div className="border-t border-slate-100 px-3 py-3 sm:px-4">
                <RaceCompareButton
                  compact
                  item={{
                    sourceRaceId: race.sourceRaceId,
                    title: race.title,
                    eventDate: race.eventDate,
                    eventDateLabel: race.eventDateLabel,
                    region: race.region,
                    location: race.location,
                    courseSummary: race.courseSummary,
                    registrationPeriodLabel: race.registrationPeriodLabel,
                    detailPath: `/races/${race.sourceRaceId}`,
                  }}
                />
              </div>
            </article>
          ))
        )}
      </section>

      <PartnerInquiryCard sourcePath="/races" />
    </PageShell>
  );
}
