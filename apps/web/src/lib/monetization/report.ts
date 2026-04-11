import type { PartnerLeadGuardScope } from './utils';

const DAY_MS = 24 * 60 * 60 * 1000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export type PartnerLeadGuardTrendPoint = {
  dateKey: string;
  dateLabel: string;
  totalCount: number;
};

export type PartnerLeadGuardTrendBucket = {
  dateKey: string;
  dateLabel: string;
  startIso: string;
  endIso: string;
};

function toKstCalendarParts(date: Date) {
  const shifted = new Date(date.getTime() + KST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

function formatDateKey(parts: { year: number; month: number; day: number }) {
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
}

function formatDateLabel(parts: { month: number; day: number }) {
  return `${parts.month}/${parts.day}`;
}

function getKstDayStartMs(date: Date) {
  const parts = toKstCalendarParts(date);
  return Date.UTC(parts.year, parts.month - 1, parts.day) - KST_OFFSET_MS;
}

export function buildRecentKstDayBuckets(days: number, now = new Date()): PartnerLeadGuardTrendBucket[] {
  if (days <= 0) return [];

  const todayStartMs = getKstDayStartMs(now);

  return Array.from({ length: days }, (_, index) => {
    const offset = days - 1 - index;
    const startMs = todayStartMs - offset * DAY_MS;
    const endMs = startMs + DAY_MS;
    const parts = toKstCalendarParts(new Date(startMs));

    return {
      dateKey: formatDateKey(parts),
      dateLabel: formatDateLabel(parts),
      startIso: new Date(startMs).toISOString(),
      endIso: new Date(endMs).toISOString(),
    };
  });
}

export function buildPartnerLeadGuardDailyTrend(
  buckets: PartnerLeadGuardTrendBucket[],
  rows: Array<{ dateKey: string; blockedScope?: PartnerLeadGuardScope; count: number }>,
): PartnerLeadGuardTrendPoint[] {
  const countByDate = new Map<string, number>();

  rows.forEach((row) => {
    countByDate.set(row.dateKey, (countByDate.get(row.dateKey) ?? 0) + row.count);
  });

  return buckets.map((bucket) => ({
    dateKey: bucket.dateKey,
    dateLabel: bucket.dateLabel,
    totalCount: countByDate.get(bucket.dateKey) ?? 0,
  }));
}
