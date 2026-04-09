export type OutboundClickEventRow = {
  sourceRaceId: string;
  raceTitle: string;
  targetKind: string;
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
  uniqueRaceCount: number;
  targetSummaries: OutboundTargetSummary[];
  topRaces: OutboundRaceSummary[];
  recentEvents: OutboundClickEventRow[];
};

export function getOutboundTargetLabel(targetKind: string) {
  if (targetKind === 'apply') return '바로 지원';
  if (targetKind === 'source_detail') return '주최 측 안내';
  if (targetKind === 'homepage') return '공식 홈페이지';
  if (targetKind === 'map') return '지도';
  if (targetKind === 'calendar_google') return 'Google 캘린더';
  if (targetKind === 'calendar_ics') return 'ICS 저장';
  return targetKind;
}

export function summarizeOutboundClicks(
  rows: OutboundClickEventRow[],
  options: { topRaceLimit?: number; recentLimit?: number } = {},
): OutboundClickSummary {
  const targetCounts = new Map<string, number>();
  const raceCounts = new Map<string, { raceTitle: string; count: number }>();

  rows.forEach((row) => {
    targetCounts.set(row.targetKind, (targetCounts.get(row.targetKind) ?? 0) + 1);

    const existing = raceCounts.get(row.sourceRaceId);
    if (existing) {
      existing.count += 1;
    } else {
      raceCounts.set(row.sourceRaceId, {
        raceTitle: row.raceTitle,
        count: 1,
      });
    }
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

  return {
    totalCount: rows.length,
    uniqueRaceCount: raceCounts.size,
    targetSummaries,
    topRaces,
    recentEvents: rows.slice(0, options.recentLimit ?? 20),
  };
}

