import Link from 'next/link';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatRaceDate } from '@/lib/races/formatters';
import type { FeaturedRacePlacement } from '@/lib/monetization/public-catalog';

export function FeaturedRaceSection({ items }: { items: FeaturedRacePlacement[] }) {
  if (items.length === 0) return null;

  return (
    <section className="mt-4 rounded-[1.25rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <StatusBadge tone="info">Featured</StatusBadge>
            <p className="text-lg font-semibold text-slate-950">주목할 대회</p>
          </div>
          <p className="mt-2 text-sm text-slate-600">사용자에게 실제로 노출되는 featured listing 시범 영역입니다.</p>
        </div>
        <Link href="/advertise" className="text-sm font-medium text-slate-500 hover:text-slate-900">
          노출 문의
        </Link>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <Link
            key={item.race.id}
            href={`/races/${item.race.sourceRaceId}`}
            className="rounded-[1.1rem] border border-[var(--brand-soft-strong)] bg-[var(--brand-soft)]/60 p-4 transition hover:border-[var(--brand)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--brand-strong)]">{item.eyebrow}</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-950">{item.race.title}</h3>
            <p className="mt-2 text-sm text-slate-600">
              {formatRaceDate(item.race.eventDate, item.race.eventDateLabel)} · {item.race.region ?? '지역 미정'}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{item.summary}</p>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
              {item.race.courseSummary ? <span>{item.race.courseSummary}</span> : null}
              {item.race.location ? <span>· {item.race.location}</span> : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
