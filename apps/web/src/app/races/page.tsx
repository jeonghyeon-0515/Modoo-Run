import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';
import { FeaturedRaceSection } from '@/components/monetization/featured-race-section';
import { PartnerInquiryCard } from '@/components/monetization/partner-inquiry-card';
import { PromoSlotCard } from '@/components/monetization/promo-slot-card';
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
      className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
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
      <section className="mt-1 rounded-[1.1rem] bg-white p-4 shadow-sm ring-1 ring-black/5 sm:rounded-[1.25rem]">
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
            <Link href="/races" className="text-sm font-medium text-slate-500 transition hover:text-slate-900">
              조건 초기화
            </Link>
          ) : null}
        </div>

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

        <details className="mt-3 rounded-[1rem] border border-slate-200 bg-slate-50 p-3">
          <summary className="cursor-pointer list-none text-sm font-semibold text-slate-800">
            지역 · 월 · 거리 더 고르기
          </summary>
          <p className="mt-3 text-xs text-slate-500">여러 조건을 동시에 적용할 수 있습니다.</p>
          <div className="mt-4 space-y-4">{renderAdvancedFilters()}</div>
        </details>
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
            <Link
              key={race.id}
              href={`/races/${race.sourceRaceId}`}
              aria-label={`${race.title} 상세 보기`}
              className="group relative block overflow-hidden rounded-[1rem] border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300 sm:rounded-[1.1rem] sm:p-4"
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

                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 sm:text-sm">
                    <span className="line-clamp-1">{race.location ?? '장소 정보는 상세에서 확인해보세요.'}</span>
                    <span className="text-slate-300">·</span>
                    <span className="line-clamp-1">{race.courseSummary ?? '종목 정보는 상세 페이지에서 확인할 수 있습니다.'}</span>
                  </div>
                  {race.registrationPeriodLabel ? (
                    <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">접수 {race.registrationPeriodLabel}</p>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge tone={getRaceStatusTone(race.registrationStatus)}>
                    {getRaceStatusLabel(race.registrationStatus)}
                  </StatusBadge>
                  <span className="inline-flex items-center gap-2 text-[11px] font-medium text-slate-500 transition group-hover:text-slate-900 sm:text-xs">
                    자세히 보기 →
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </section>

      <PartnerInquiryCard sourcePath="/races" />
    </PageShell>
  );
}
