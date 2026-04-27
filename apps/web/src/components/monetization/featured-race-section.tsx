import Link from 'next/link';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatRaceDate } from '@/lib/races/formatters';
import type { FeaturedRacePlacement } from '@/lib/monetization/public-catalog';

export function FeaturedRaceSection({
  items,
  variant = 'public',
}: {
  items: FeaturedRacePlacement[];
  variant?: 'public' | 'ops-preview';
}) {
  if (items.length === 0) return null;

  const isOpsPreview = variant === 'ops-preview';

  return (
    <section className="mt-4 rounded-[1.25rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <StatusBadge tone={isOpsPreview ? 'ops-info' : 'featured'}>Featured</StatusBadge>
            <p className="text-lg font-semibold text-slate-950">주목할 대회</p>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            {isOpsPreview
              ? '운영 화면에서 확인하는 featured preview입니다.'
              : '사용자에게 실제로 노출되는 featured listing 시범 영역입니다.'}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {isOpsPreview
              ? '여기서 입력한 라벨과 설명 문구가 공개 화면에 그대로 보이므로 광고·스폰서 여부를 숨기지 않도록 작성해 주세요.'
              : '유료 또는 협업 노출은 카드 라벨과 설명 문구에서 구분해 표기합니다.'}
          </p>
        </div>
        <Link
          href="/advertise"
          className={`focus-ring pressable inline-flex min-h-10 items-center rounded-md px-2 text-sm font-medium ${
            isOpsPreview ? 'text-slate-500 hover:text-slate-900' : 'text-[var(--public-accent-strong)] hover:text-[var(--public-accent-strong)]/90'
          }`}
        >
          노출 문의
        </Link>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {items.map((item) => (
          <Link
            key={item.race.id}
            href={`/races/${item.race.sourceRaceId}`}
            className={`interactive-card soft-surface rounded-[1.1rem] border p-4 ${
              isOpsPreview
                ? 'border-black/5 bg-slate-50'
                : 'border-black/5 bg-white'
            }`}
          >
            <p
              className={`text-[11px] font-semibold uppercase tracking-wide ${
                isOpsPreview ? 'text-slate-500' : 'text-slate-500'
              }`}
            >
              {item.eyebrow}
            </p>
            <h3 className="text-balance mt-2 text-lg font-semibold text-slate-950">{item.race.title}</h3>
            <p className="mt-2 text-sm tabular-nums text-slate-600">
              {formatRaceDate(item.race.eventDate, item.race.eventDateLabel)} · {item.race.region ?? '지역 미정'}
            </p>
            <p className="text-pretty mt-2 text-sm leading-6 text-slate-600">{item.summary}</p>
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
