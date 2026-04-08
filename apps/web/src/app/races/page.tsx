import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  formatLastSyncedAt,
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
  { label: '전체', value: 'all' },
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
      className={`rounded-full px-3 py-2 text-sm font-medium transition ${
        active
          ? 'bg-[var(--brand)] text-white'
          : 'bg-[var(--surface-muted)] text-slate-700 hover:bg-[var(--brand-soft)]'
      }`}
    >
      {children}
    </Link>
  );
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

    return (
      <PageShell
        title="대회 둘러보기"
        description="지금 열려 있는 대회부터 지역별 대회까지, 필요한 정보만 골라 편하게 둘러보세요."
      >
        <section className="mt-2 rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold text-slate-500">지금 보고 있는 조건</p>
              <p className="mt-1 text-sm text-slate-700">
                {activeLabels.length > 0 ? activeLabels.join(' · ') : '전체 대회를 넓게 보고 있어요.'}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                가까운 일정 순으로 정리했어요. 지금 {races.length}개의 대회를 볼 수 있어요.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">접수 상태</p>
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

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">지역</p>
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
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">월</p>
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
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">거리</p>
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
            </div>
          </div>
        </section>

        <section className="mt-6 space-y-3 sm:space-y-4">
          {races.length === 0 ? (
            <article className="rounded-[1.75rem] bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
              <p className="text-base font-semibold text-slate-950">조건에 맞는 대회가 없습니다.</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                필터를 조금 넓히거나, 접수 상태를 전체로 바꿔 다른 대회도 함께 살펴보세요.
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
                className="block rounded-[1.25rem] bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:ring-blue-200 sm:rounded-[1.75rem] sm:p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-semibold text-slate-950 sm:text-lg">{race.title}</h2>
                      {race.region ? <StatusBadge tone="neutral">{race.region}</StatusBadge> : null}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                      {formatRaceDate(race.eventDate, race.eventDateLabel)}
                    </p>
                  </div>
                  <StatusBadge tone={getRaceStatusTone(race.registrationStatus)}>
                    {getRaceStatusLabel(race.registrationStatus)}
                  </StatusBadge>
                </div>

                <div className="mt-3 space-y-2 sm:hidden">
                  <p className="text-sm text-slate-700">
                    {race.location ?? '장소 정보 없음'}
                  </p>
                  <p className="text-sm text-slate-600">
                    {race.courseSummary ?? '종목 정보 없음'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {race.organizer ?? '주최 정보 없음'} · 최근 업데이트 {formatLastSyncedAt(race.lastSyncedAt)}
                  </p>
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

                <div className="mt-3 hidden flex-col gap-2 text-sm text-slate-600 sm:flex sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p>{race.organizer ?? '주최 정보 없음'}</p>
                    <p>최근 업데이트: {formatLastSyncedAt(race.lastSyncedAt)}</p>
                  </div>
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
        title="대회 둘러보기"
        description="대회 목록을 불러오지 못했을 때도 다음 행동이 바로 보이도록 안내합니다."
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
