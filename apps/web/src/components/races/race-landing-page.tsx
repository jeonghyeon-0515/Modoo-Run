import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';
import { LinkPendingOverlay } from '@/components/ui/link-pending-overlay';
import { StatusBadge } from '@/components/ui/status-badge';
import { getRaceStatusLabel, getRaceStatusTone, formatRaceDate } from '@/lib/races/formatters';
import { getRaceLandingConfig, raceLandingPages, type RaceLandingKey } from '@/lib/races/landing-config';
import { listRaceLandingItems, type RaceLandingItem } from '@/lib/races/landing-repository';

function RaceLandingCard({ race }: { race: RaceLandingItem }) {
  return (
    <Link
      href={`/races/${race.sourceRaceId}`}
      className="interactive-card group relative overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300"
    >
      <LinkPendingOverlay label="대회 정보 여는 중…" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-[var(--brand)]">
            {formatRaceDate(race.eventDate, race.eventDateLabel)}
          </p>
          <h2 className="mt-2 line-clamp-2 text-base font-semibold text-slate-950">{race.title}</h2>
        </div>
        <StatusBadge tone={getRaceStatusTone(race.registrationStatus)}>
          {getRaceStatusLabel(race.registrationStatus)}
        </StatusBadge>
      </div>
      <p className="mt-3 line-clamp-1 text-sm text-slate-600">
        {race.region ?? '지역 미정'} · {race.location ?? '장소 정보 없음'}
      </p>
      <p className="mt-2 line-clamp-1 text-sm text-slate-500">
        {race.courseSummary ?? '종목 정보 없음'}
      </p>
      {race.registrationCloseAt || race.registrationPeriodLabel ? (
        <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
          접수 {race.registrationCloseAt ? `${race.registrationCloseAt} 마감` : race.registrationPeriodLabel}
        </p>
      ) : null}
    </Link>
  );
}

export async function RaceLandingPage({ landingKey }: { landingKey: RaceLandingKey }) {
  const config = getRaceLandingConfig(landingKey);
  let races: RaceLandingItem[] = [];
  let loadError: string | null = null;

  try {
    races = await listRaceLandingItems(landingKey);
  } catch (error) {
    loadError = error instanceof Error ? error.message : '대회 목록을 불러오지 못했습니다.';
  }

  return (
    <PageShell title={config.title} description={config.description} compactIntro>
      <section className="hero-shell rounded-[1.75rem] p-6 text-white shadow-sm sm:p-8">
        <StatusBadge tone="disclosure">{config.eyebrow}</StatusBadge>
        <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">{config.title}</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">{config.helperText}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {raceLandingPages.map((item) => (
            <Link
              key={item.key}
              href={item.path}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${
                item.key === landingKey
                  ? 'bg-white text-slate-950 ring-white'
                  : 'bg-white/10 text-white ring-white/15 hover:bg-white/15'
              }`}
            >
              {item.eyebrow}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-[1.25rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-950">{config.listTitle}</h3>
            <p className="mt-1 text-sm text-slate-500">{races.length}개 대회를 찾았습니다.</p>
          </div>
          <Link href="/races" className="text-sm font-semibold text-[var(--brand)]">
            전체 대회 보기
          </Link>
        </div>
      </section>

      {loadError ? (
        <section className="mt-5 rounded-[1.25rem] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
          {loadError}
        </section>
      ) : null}

      <section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {races.length > 0 ? (
          races.map((race) => <RaceLandingCard key={race.id} race={race} />)
        ) : (
          <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500 md:col-span-2 xl:col-span-3">
            {config.emptyMessage}
          </div>
        )}
      </section>
    </PageShell>
  );
}
