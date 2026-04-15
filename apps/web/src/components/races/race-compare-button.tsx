'use client';

import {
  MAX_RACE_COMPARE_ITEMS,
  removeRaceCompareItem,
  upsertRaceCompareItem,
  type RaceCompareItem,
} from '@/lib/races/compare';
import { useRaceCompareItems, writeRaceCompareItems } from './use-race-compare-items';

export function RaceCompareButton({
  item,
  compact = false,
}: {
  item: RaceCompareItem;
  compact?: boolean;
}) {
  const items = useRaceCompareItems();

  const selected = items.some((entry) => entry.sourceRaceId === item.sourceRaceId);
  const disabled = !selected && items.length >= MAX_RACE_COMPARE_ITEMS;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        const next = selected ? removeRaceCompareItem(items, item.sourceRaceId) : upsertRaceCompareItem(items, item);
        writeRaceCompareItems(next);
      }}
      className={`inline-flex items-center justify-center rounded-full border text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        compact ? 'px-3 py-2 text-xs' : 'px-5 py-3'
      } ${
        selected
          ? 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800'
          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      {selected ? '비교에서 빼기' : disabled ? '비교 4개 가득' : '비교에 담기'}
    </button>
  );
}
