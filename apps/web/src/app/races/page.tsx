import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';
import { FeaturedRaceSection } from '@/components/monetization/featured-race-section';
import { RaceCompareButton } from '@/components/races/race-compare-button';
import { StatusBadge } from '@/components/ui/status-badge';
import { LinkPendingOverlay } from '@/components/ui/link-pending-overlay';
import { getOptionalViewer } from '@/lib/auth/session';
import { listActiveFeaturedRacePlacements } from '@/lib/monetization/featured-repository';
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
      className={`focus-ring pressable inline-flex min-h-11 items-center justify-center rounded-lg border px-3 py-2 text-xs font-medium sm:min-h-10 sm:py-1.5 sm:text-sm ${
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
  const viewer = await getOptionalViewer();
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
  let featuredItems: Awaited<ReturnType<typeof listActiveFeaturedRacePlacements>> = [];
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
    featuredItems = await listActiveFeaturedRacePlacements(races);
  } catch (error) {
    loadError = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
  }

  const activeLabels = summarizeActiveRaceFilters(filters);
  const isDefaultOpenView =
    filters.registrationStatus === 'open' &&
    filters.region.length === 0 &&
    filters.month.length === 0 &&
    filters.distance.length === 0;

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
        viewer={viewer}
      >
        <article className="rounded-[1.75rem] bg-white p-8 shadow-sm ring-1 ring-black/5">
          <p className="text-base font-semibold text-slate-950">대회 목록을 불러오지 못했습니다.</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{loadError}</p>
          <Link
            href="/races"
            className="pressable mt-5 inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--brand-strong)]"
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
      viewer={viewer}
    >
      <section className="mb-5 rounded-[1.25rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-950">자주 찾는 대회 묶음</p>
          <Link href="/races/closing-soon" className="focus-ring pressable inline-flex min-h-11 items-center rounded-full border border-[var(--brand-soft-strong)] bg-[var(--brand-soft)] px-4 py-2 text-sm font-semibold text-[var(--brand-strong)] hover:bg-[#ffe9e2]">
            마감 임박 보기
          </Link>
        </div>
        <div className="relative mt-3">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-white to-transparent" />
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {raceLandingPages.map((item) => (
              <Link
                key={item.key}
                href={item.path}
                className="focus-ring pressable inline-flex min-h-11 items-center whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-white"
              >
                {item.eyebrow}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <FeaturedRaceSection items={featuredItems} />

      <section className="mt-5 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
        <aside className="space-y-4 lg:sticky lg:top-28">
          <section className="rounded-[1.5rem] border border-[var(--line)] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[var(--secondary)]">
              {filters.registrationStatus === 'open' ? '접수 중 대회' : '대회 상태'}
            </p>
            {activeLabels.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {activeLabels.map((label) => (
                  <span key={label} className="inline-flex min-h-10 items-center rounded-full bg-[#fff1ec] px-3 py-2 text-xs font-semibold text-[var(--brand-strong)]">
                    {label}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {isDefaultOpenView ? '가까운 일정부터 보고 있습니다.' : '조건을 조합해 원하는 일정만 좁혀보세요.'}
              </p>
            )}
            {!isDefaultOpenView ? (
              <Link href="/races" className="focus-ring public-secondary-button pressable mt-4 inline-flex min-h-11 items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold">
                조건 초기화
              </Link>
            ) : null}
          </section>

          <section className="rounded-[1.5rem] border border-[var(--line)] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[var(--secondary)]">접수 상태</p>
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
            <div className="mt-5 space-y-5">
              {renderAdvancedFilters()}
            </div>
          </section>
        </aside>

        <div className="space-y-3">
          {races.length === 0 ? (
            <article className="rounded-[1.5rem] bg-white p-8 text-center shadow-sm ring-1 ring-[var(--line)]">
              <p className="text-base font-semibold text-[var(--secondary)]">조건에 맞는 대회가 없습니다.</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                필터를 조금만 풀어보면 다른 일정도 편하게 살펴볼 수 있어요.
              </p>
              <Link
                href="/races"
                className="public-primary-button pressable mt-5 inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold"
              >
                필터 초기화
              </Link>
            </article>
          ) : (
            races.map((race) => (
              <article
                key={race.id}
                className="interactive-card soft-surface overflow-hidden rounded-[1.25rem] border border-[var(--line)] bg-white"
              >
                <Link
                  href={`/races/${race.sourceRaceId}`}
                  aria-label={`${race.title} 상세 보기`}
                  className="group relative block p-4 sm:p-5"
                >
                  <LinkPendingOverlay label="대회 여는 중…" />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="tabular-nums text-[11px] font-semibold text-slate-500 sm:text-xs">
                          {formatRaceDate(race.eventDate, race.eventDateLabel)}
                        </p>
                        {race.region ? <StatusBadge tone="neutral">{race.region}</StatusBadge> : null}
                      </div>
                      <h2 className="text-balance mt-2 line-clamp-2 text-base font-semibold text-[var(--secondary)] sm:text-xl">
                        {race.title}
                      </h2>

                      {race.location ? (
                        <p className="mt-3 line-clamp-1 text-sm font-medium text-slate-700">{race.location}</p>
                      ) : null}
                      {(race.courseSummary || race.registrationPeriodLabel) ? (
                        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 sm:text-sm">
                          {race.courseSummary ? <span>{race.courseSummary}</span> : null}
                          {race.courseSummary && race.registrationPeriodLabel ? <span className="text-slate-300">·</span> : null}
                          {race.registrationPeriodLabel ? <span>접수 {race.registrationPeriodLabel}</span> : null}
                        </div>
                      ) : null}
                    </div>
                    <StatusBadge tone={getRaceStatusTone(race.registrationStatus)}>
                      {getRaceStatusLabel(race.registrationStatus)}
                    </StatusBadge>
                  </div>
                </Link>
                <div className="border-t border-[var(--line)] px-4 py-3 sm:px-5">
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
        </div>
      </section>
    </PageShell>
  );
}
