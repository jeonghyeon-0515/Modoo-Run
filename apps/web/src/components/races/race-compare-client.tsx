'use client';

import Link from 'next/link';
import {
  removeRaceCompareItem,
  type RaceCompareItem,
} from '@/lib/races/compare';
import { useRaceCompareItems, writeRaceCompareItems } from './use-race-compare-items';

function CompareField({ label, values }: { label: string; values: Array<string | null> }) {
  return (
    <div className="grid gap-2 border-t border-slate-100 py-4 md:grid-cols-[8rem_1fr]">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {values.map((value, index) => (
          <div key={`${label}-${index}`} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {value || '정보 없음'}
          </div>
        ))}
      </div>
    </div>
  );
}

export function RaceCompareClient() {
  const items = useRaceCompareItems();

  const updateItems = (next: RaceCompareItem[]) => {
    writeRaceCompareItems(next);
  };

  if (items.length === 0) {
    return (
      <section className="rounded-[1.25rem] border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
        <p className="text-base font-semibold text-slate-950">아직 비교할 대회가 없습니다.</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          대회 상세나 목록에서 “비교에 담기”를 누르면 이 화면에서 한 번에 볼 수 있습니다.
        </p>
        <Link
          href="/races"
          className="public-primary-button pressable mt-5 inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold"
        >
          대회 일정 보러가기
        </Link>
      </section>
    );
  }

  return (
    <section className="rounded-[1.25rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tabular-nums text-slate-950">{items.length}개 대회를 비교 중입니다.</p>
          <p className="mt-1 text-sm text-slate-500">최대 4개까지 브라우저에 저장됩니다.</p>
        </div>
        <button
          type="button"
          onClick={() => updateItems([])}
          className="focus-ring pressable inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50"
        >
          모두 비우기
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <article key={item.sourceRaceId} className="soft-surface rounded-[1rem] border border-black/5 bg-slate-50 p-4">
            <p className="text-xs font-semibold text-[var(--brand)]">{item.region ?? '지역 미정'}</p>
            <h2 className="text-balance mt-2 line-clamp-2 text-sm font-semibold text-slate-950">{item.title}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={item.detailPath} className="focus-ring pressable inline-flex min-h-10 items-center text-xs font-semibold text-[var(--brand)]">
                상세 보기
              </Link>
              <button
                type="button"
                onClick={() => updateItems(removeRaceCompareItem(items, item.sourceRaceId))}
                className="focus-ring pressable inline-flex min-h-10 items-center text-xs font-semibold text-slate-500 hover:text-slate-900"
              >
                제거
              </button>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5">
        <CompareField label="일정" values={items.map((item) => item.eventDateLabel ?? item.eventDate)} />
        <CompareField label="접수기간" values={items.map((item) => item.registrationPeriodLabel)} />
        <CompareField label="지역/장소" values={items.map((item) => [item.region, item.location].filter(Boolean).join(' · ') || null)} />
        <CompareField label="종목" values={items.map((item) => item.courseSummary)} />
      </div>
    </section>
  );
}
