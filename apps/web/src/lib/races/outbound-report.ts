export type OutboundClickEventRow = {
  sourceRaceId: string;
  raceTitle: string;
  targetKind: string;
  sourcePath: string;
  viewerRole: string;
  createdAt: string;
};

export type RaceDetailViewEventRow = {
  sourceRaceId: string;
  raceTitle: string;
  sourcePath: string;
  viewerRole: string;
  createdAt: string;
};

export type OutboundTargetSummary = {
  targetKind: string;
  count: number;
};

export type OutboundRaceSummary = {
  sourceRaceId: string;
  raceTitle: string;
  count: number;
};

export type OutboundClickSummary = {
  totalCount: number;
  totalViewCount: number;
  uniqueRaceCount: number;
  applyClickCount: number;
  applyConversionRate: number;
  targetSummaries: OutboundTargetSummary[];
  topRaces: OutboundRaceSummary[];
  topConversionRaces: Array<
    OutboundRaceSummary & {
      viewCount: number;
      applyClickCount: number;
      boundedApplyClickCount: number;
      conversionRate: number;
    }
  >;
  dailyTrend: Array<{
    dateLabel: string;
    viewCount: number;
    applyClickCount: number;
    otherClickCount: number;
  }>;
  recentEvents: OutboundClickEventRow[];
};

export function getOutboundTargetLabel(targetKind: string) {
  if (targetKind === 'apply') return '바로 지원';
  if (targetKind === 'source_detail') return '주최 측 안내';
  if (targetKind === 'homepage') return '공식 홈페이지';
  if (targetKind === 'map') return '지도';
  if (targetKind === 'calendar_google') return 'Google 캘린더';
  if (targetKind === 'calendar_ics') return 'ICS 저장';
  if (targetKind === 'affiliate') return '제휴 클릭';
  if (targetKind === 'sponsored') return '스폰서 클릭';
  if (targetKind === 'partner_inquiry') return '문의 진입';
  return targetKind;
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    timeZone: 'Asia/Seoul',
  }).format(new Date(value));
}

function toDateKey(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

export function summarizeOutboundClicks(
  rows: OutboundClickEventRow[],
  viewRows: RaceDetailViewEventRow[] = [],
  options: { topRaceLimit?: number; recentLimit?: number; trendLimit?: number } = {},
): OutboundClickSummary {
  const targetCounts = new Map<string, number>();
  const raceCounts = new Map<string, { raceTitle: string; count: number }>();
  const raceViewCounts = new Map<string, { raceTitle: string; count: number }>();
  const dailyTrend = new Map<
    string,
    { dateLabel: string; viewCount: number; applyClickCount: number; otherClickCount: number }
  >();
  let applyClickCount = 0;

  rows.forEach((row) => {
    targetCounts.set(row.targetKind, (targetCounts.get(row.targetKind) ?? 0) + 1);
    if (row.targetKind === 'apply') {
      applyClickCount += 1;
    }

    const existing = raceCounts.get(row.sourceRaceId);
    if (existing) {
      existing.count += 1;
    } else {
      raceCounts.set(row.sourceRaceId, {
        raceTitle: row.raceTitle,
        count: 1,
      });
    }

    const dateKey = toDateKey(row.createdAt);
    const trend = dailyTrend.get(dateKey) ?? {
      dateLabel: formatDateLabel(row.createdAt),
      viewCount: 0,
      applyClickCount: 0,
      otherClickCount: 0,
    };
    if (row.targetKind === 'apply') {
      trend.applyClickCount += 1;
    } else {
      trend.otherClickCount += 1;
    }
    dailyTrend.set(dateKey, trend);
  });

  viewRows.forEach((row) => {
    const existing = raceViewCounts.get(row.sourceRaceId);
    if (existing) {
      existing.count += 1;
    } else {
      raceViewCounts.set(row.sourceRaceId, {
        raceTitle: row.raceTitle,
        count: 1,
      });
    }

    const dateKey = toDateKey(row.createdAt);
    const trend = dailyTrend.get(dateKey) ?? {
      dateLabel: formatDateLabel(row.createdAt),
      viewCount: 0,
      applyClickCount: 0,
      otherClickCount: 0,
    };
    trend.viewCount += 1;
    dailyTrend.set(dateKey, trend);
  });

  const targetSummaries = [...targetCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([targetKind, count]) => ({ targetKind, count }));

  const topRaces = [...raceCounts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, options.topRaceLimit ?? 10)
    .map(([sourceRaceId, value]) => ({
      sourceRaceId,
      raceTitle: value.raceTitle,
      count: value.count,
    }));

  const topConversionRaces = [...raceViewCounts.entries()]
    .map(([sourceRaceId, value]) => {
      const applyClicks = rows.filter((row) => row.sourceRaceId === sourceRaceId && row.targetKind === 'apply').length;
      const boundedApplyClicks = Math.min(applyClicks, value.count);
      const conversionRate = value.count > 0 ? (boundedApplyClicks / value.count) * 100 : 0;
      return {
        sourceRaceId,
        raceTitle: value.raceTitle,
        count: applyClicks,
        viewCount: value.count,
        applyClickCount: applyClicks,
        boundedApplyClickCount: boundedApplyClicks,
        conversionRate,
      };
    })
    .sort((a, b) => {
      if (b.conversionRate === a.conversionRate) {
        return b.viewCount - a.viewCount;
      }
      return b.conversionRate - a.conversionRate;
    })
    .slice(0, options.topRaceLimit ?? 10);

  const totalViewCount = viewRows.length;
  const applyConversionRate = totalViewCount > 0 ? (Math.min(applyClickCount, totalViewCount) / totalViewCount) * 100 : 0;
  const sortedTrend = [...dailyTrend.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-(options.trendLimit ?? 14))
    .map(([, value]) => value);

  return {
    totalCount: rows.length,
    totalViewCount,
    uniqueRaceCount: new Set([...raceCounts.keys(), ...raceViewCounts.keys()]).size,
    applyClickCount,
    applyConversionRate,
    targetSummaries,
    topRaces,
    topConversionRaces,
    dailyTrend: sortedTrend,
    recentEvents: rows.slice(0, options.recentLimit ?? 20),
  };
}
