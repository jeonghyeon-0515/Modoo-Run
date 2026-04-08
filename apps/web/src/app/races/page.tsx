import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  formatLastSyncedAt,
  formatRaceDate,
  getRaceStatusLabel,
  getRaceStatusTone,
} from '@/lib/races/formatters';
import {
  getRaceExplorerSummary,
  listRaces,
  listRecentlySyncedRaces,
  listRegions,
} from '@/lib/races/repository';
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
        active ? 'bg-[var(--brand)] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
    const [races, regions, summary, recentRaces] = await Promise.all([
      listRaces({
        registrationStatus: filters.registrationStatus,
        region: filters.region || undefined,
        month: filters.month || undefined,
        distance: filters.distance || undefined,
      }),
      listRegions(),
      getRaceExplorerSummary(),
      listRecentlySyncedRaces(3),
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
        title="대회 탐색"
        description="접수 상태, 지역, 월, 거리 기준으로 대회를 빠르게 훑고, 필요한 상세 정보로 바로 이어질 수 있는 모바일 우선 목록을 제공합니다."
      >
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
            <p className="text-sm font-medium text-slate-500">접수중 대회</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">{summary.openCount.toLocaleString('ko-KR')}개</p>
            <p className="mt-2 text-sm text-slate-500">기본 필터도 접수중 기준으로 시작합니다.</p>
          </article>
          <article className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
            <p className="text-sm font-medium text-slate-500">접수마감 포함</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">{summary.totalCount.toLocaleString('ko-KR')}개</p>
            <p className="mt-2 text-sm text-slate-500">과거 대회도 함께 살펴볼 수 있습니다.</p>
          </article>
          <article className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
            <p className="text-sm font-medium text-slate-500">지역 커버리지</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">{summary.regionCount}개</p>
            <p className="mt-2 text-sm text-slate-500">전국 주요 지역별로 빠르게 좁힐 수 있습니다.</p>
          </article>
          <article className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
            <p className="text-sm font-medium text-slate-500">최근 동기화</p>
            <p className="mt-3 text-lg font-bold text-slate-950">{formatLastSyncedAt(summary.latestSyncAt)}</p>
            <p className="mt-2 text-sm text-slate-500">최신 수집 순으로도 확인할 수 있습니다.</p>
          </article>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold text-slate-500">현재 조건</p>
                <p className="mt-1 text-sm text-slate-700">
                  {activeLabels.length > 0 ? activeLabels.join(' · ') : '조건 없이 전체 대회를 보고 있습니다.'}
                </p>
                <p className="mt-1 text-sm text-slate-500">총 {races.length}개의 대회를 불러왔습니다.</p>
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
          </div>

          <aside className="space-y-6">
            <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
              <h2 className="text-lg font-semibold text-slate-950">최근 수집된 대회</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                데이터가 늘어난 만큼 최근 들어온 대회도 함께 빠르게 훑어볼 수 있습니다.
              </p>
              <div className="mt-4 space-y-3">
                {recentRaces.map((race) => (
                  <Link
                    key={race.id}
                    href={`/races/${race.sourceRaceId}`}
                    className="block rounded-[1.25rem] border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-950">{race.title}</h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatRaceDate(race.eventDate, race.eventDateLabel)}
                        </p>
                      </div>
                      <StatusBadge tone={getRaceStatusTone(race.registrationStatus)}>
                        {getRaceStatusLabel(race.registrationStatus)}
                      </StatusBadge>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
              <h2 className="text-lg font-semibold text-slate-950">지역별 상위 분포</h2>
              <div className="mt-4 space-y-3">
                {summary.topRegions.map((item) => (
                  <div key={item.region} className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900">{item.region}</p>
                      <p className="text-sm text-slate-500">{item.count.toLocaleString('ko-KR')}개</p>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-slate-200">
                      <div
                        className="h-2 rounded-full bg-[var(--brand)]"
                        style={{
                          width: `${Math.max(14, Math.round((item.count / Math.max(summary.totalCount, 1)) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </section>

        <section className="mt-6 space-y-4">
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
                className="block rounded-[1.75rem] bg-white p-5 shadow-sm ring-1 ring-black/5 transition hover:ring-blue-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-slate-950">{race.title}</h2>
                      {race.region ? <StatusBadge tone="neutral">{race.region}</StatusBadge> : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatRaceDate(race.eventDate, race.eventDateLabel)}
                    </p>
                  </div>
                  <StatusBadge tone={getRaceStatusTone(race.registrationStatus)}>
                    {getRaceStatusLabel(race.registrationStatus)}
                  </StatusBadge>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
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

                <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p>{race.organizer ?? '주최 정보 없음'}</p>
                    <p>마지막 수집: {formatLastSyncedAt(race.lastSyncedAt)}</p>
                  </div>
                  <span className="font-semibold text-[var(--brand)]">상세 보기</span>
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
        title="대회 탐색"
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
