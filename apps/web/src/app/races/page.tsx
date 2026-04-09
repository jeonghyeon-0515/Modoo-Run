import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  formatRaceDate,
  getRaceStatusLabel,
  getRaceStatusTone,
} from '@/lib/races/formatters';
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

function createFilterHref(
  current: Record<string, string | undefined>,
  key: 'registrationStatus' | 'region' | 'month' | 'distance',
  value: string,
) {
  const next = new URLSearchParams();

  Object.entries(current).forEach(([entryKey, entryValue]) => {
    if (!entryValue || entryKey === key) return;
    next.set(entryKey, entryValue);
  });

  if (value && value !== 'all') {
    next.set(key, value);
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
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
        active
          ? 'bg-[var(--brand)] text-white'
          : 'bg-[var(--surface-muted)] text-slate-700 hover:bg-[var(--brand-soft)]'
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
    region: readFirstValue(resolvedSearchParams.region) ?? '',
    month: readFirstValue(resolvedSearchParams.month) ?? '',
    distance: readFirstValue(resolvedSearchParams.distance) ?? '',
  };

  const normalizedQuery = {
    registrationStatus: filters.registrationStatus === 'all' ? undefined : filters.registrationStatus,
    region: filters.region || undefined,
    month: filters.month || undefined,
    distance: filters.distance || undefined,
  };

  try {
    const [races, regions] = await Promise.all([
      listRaces({
        registrationStatus: filters.registrationStatus,
        region: filters.region || undefined,
        month: filters.month || undefined,
        distance: filters.distance || undefined,
      }),
      listRegions(),
    ]);

    const activeLabels = [
      filters.registrationStatus === 'all'
        ? '전체 상태'
        : statusOptions.find((item) => item.value === filters.registrationStatus)?.label,
      filters.region || null,
      filters.month || null,
      filters.distance || null,
    ].filter(Boolean);

    const renderAdvancedFilters = () => (
      <>
        <div>
          <FilterLabel>지역</FilterLabel>
          <div className="flex flex-wrap gap-2">
            <FilterChip active={!filters.region} href={createFilterHref(normalizedQuery, 'region', 'all')}>
              전체
            </FilterChip>
            {regions.map((region) => (
              <FilterChip
                key={region}
                active={filters.region === region}
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
            <FilterChip active={!filters.month} href={createFilterHref(normalizedQuery, 'month', 'all')}>
              전체
            </FilterChip>
            {monthOptions.map((month) => (
              <FilterChip
                key={month}
                active={filters.month === month}
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
            <FilterChip active={!filters.distance} href={createFilterHref(normalizedQuery, 'distance', 'all')}>
              전체
            </FilterChip>
            {distanceOptions.map((distance) => (
              <FilterChip
                key={distance}
                active={filters.distance === distance}
                href={createFilterHref(normalizedQuery, 'distance', distance)}
              >
                {distance}
              </FilterChip>
            ))}
          </div>
        </div>
      </>
    );

    return (
      <PageShell
        title="대회 일정"
        description="지금 신청 가능한 대회를 가까운 일정부터 보여드려요. 필요한 조건만 골라 편하게 살펴보세요."
      >
        <section className="mt-2 rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-black/5 sm:rounded-[1.75rem] sm:p-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {filters.registrationStatus === 'open'
                  ? '접수중인 대회를 먼저 보여드려요'
                  : '원하는 조건으로 대회를 골라보세요'}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {activeLabels.length > 0
                  ? `${activeLabels.join(' · ')} 조건으로 가까운 일정부터 정리했어요.`
                  : '지역과 거리만 고르면 가까운 일정부터 바로 볼 수 있어요.'}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <FilterLabel>접수 상태</FilterLabel>
                <div className="flex flex-wrap gap-2">
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

              <div className="hidden space-y-4 sm:block">{renderAdvancedFilters()}</div>

              <details className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-3 sm:hidden">
                <summary className="cursor-pointer list-none text-sm font-semibold text-slate-800">
                  지역 · 월 · 거리 더 고르기
                </summary>
                <div className="mt-4 space-y-4">{renderAdvancedFilters()}</div>
              </details>
            </div>
          </div>
        </section>

        <section className="mt-6 space-y-3 sm:space-y-4">
          {races.length === 0 ? (
            <article className="rounded-[1.75rem] bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
              <p className="text-base font-semibold text-slate-950">조건에 맞는 대회가 없습니다.</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                필터를 조금 넓히거나 접수 상태를 전체 보기로 바꿔 다른 일정도 함께 살펴보세요.
              </p>
              <Link
                href="/races"
                className="mt-5 inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
              >
                필터 초기화
              </Link>
            </article>
          ) : (
            races.map((race) => (
              <Link
                key={race.id}
                href={`/races/${race.sourceRaceId}`}
                className="block rounded-[1rem] bg-white p-3 shadow-sm ring-1 ring-black/5 transition hover:ring-blue-200 sm:rounded-[1.75rem] sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[11px] font-semibold text-[var(--brand)] sm:text-xs">
                        {formatRaceDate(race.eventDate, race.eventDateLabel)}
                      </p>
                      {race.region ? <StatusBadge tone="neutral">{race.region}</StatusBadge> : null}
                    </div>
                    <h2 className="mt-1 line-clamp-2 text-sm font-semibold text-slate-950 sm:text-lg">
                      {race.title}
                    </h2>
                  </div>
                  <StatusBadge tone={getRaceStatusTone(race.registrationStatus)}>
                    {getRaceStatusLabel(race.registrationStatus)}
                  </StatusBadge>
                </div>

                <div className="mt-2 grid gap-1 sm:hidden">
                  <p className="line-clamp-1 text-xs text-slate-700">{race.location ?? '장소 정보는 상세에서 확인해보세요.'}</p>
                  <p className="line-clamp-1 text-xs text-slate-600">
                    {race.courseSummary ?? '종목 정보는 상세 화면에서 확인할 수 있어요.'}
                  </p>
                  {race.registrationPeriodLabel ? (
                    <p className="line-clamp-1 text-[11px] text-slate-500">접수 {race.registrationPeriodLabel}</p>
                  ) : null}
                </div>

                <div className="mt-4 hidden gap-3 sm:grid sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">장소</p>
                    <p className="mt-2 text-sm text-slate-700">{race.location ?? '장소 정보 없음'}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">종목</p>
                    <p className="mt-2 text-sm text-slate-700">{race.courseSummary ?? '종목 정보 없음'}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">접수기간</p>
                    <p className="mt-2 text-sm text-slate-700">
                      {race.registrationPeriodLabel ?? '접수기간 정보 없음'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 hidden items-center justify-between text-sm text-slate-600 sm:flex">
                  <p>{race.organizer ?? '주최 정보는 상세 화면에서 확인할 수 있어요.'}</p>
                  <span className="font-semibold text-[var(--brand)]">자세히 보기</span>
                </div>

                <div className="mt-3 flex items-center justify-end sm:hidden">
                  <span className="text-xs font-semibold text-[var(--brand)]">자세히 보기</span>
                </div>
              </Link>
            ))
          )}
        </section>
      </PageShell>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    return (
      <PageShell
        title="대회 일정"
        description="대회 목록을 바로 다시 살펴볼 수 있도록 간단히 안내합니다."
      >
        <article className="rounded-[1.75rem] bg-white p-8 shadow-sm ring-1 ring-black/5">
          <p className="text-base font-semibold text-slate-950">대회 목록을 불러오지 못했습니다.</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>
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
}
