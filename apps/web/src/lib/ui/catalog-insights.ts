type RaceInsightInput = {
  id: string;
  sourceRaceId: string;
  title: string;
  eventDate: string | null;
  eventDateLabel: string | null;
  region: string | null;
  courseSummary: string | null;
  registrationStatus: 'open' | 'closed' | 'unknown';
  lastSyncedAt: string | null;
};

function normalizeMonth(value?: string | null) {
  if (!value) return null;
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return Number(match[2]);
  }
  return null;
}

function sortEntriesByCount(entries: Map<string, number>) {
  return [...entries.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko'))
    .map(([label, count]) => ({ label, count }));
}

export function buildRaceCatalogInsights(races: RaceInsightInput[]) {
  const regionCounts = new Map<string, number>();
  const monthCounts = new Map<string, number>();

  for (const race of races) {
    if (race.region) {
      regionCounts.set(race.region, (regionCounts.get(race.region) ?? 0) + 1);
    }

    const monthNumber = normalizeMonth(race.eventDate);
    if (monthNumber) {
      const label = `${monthNumber}월`;
      monthCounts.set(label, (monthCounts.get(label) ?? 0) + 1);
    }
  }

  const latestSyncedAt = races
    .map((race) => race.lastSyncedAt)
    .filter(Boolean)
    .sort()
    .at(-1) ?? null;

  const regions = sortEntriesByCount(regionCounts);
  const months = sortEntriesByCount(monthCounts);

  return {
    totalCount: races.length,
    openCount: races.filter((race) => race.registrationStatus === 'open').length,
    closedCount: races.filter((race) => race.registrationStatus === 'closed').length,
    regionCount: regions.length,
    topRegions: regions.slice(0, 4),
    busiestMonth: months[0]?.label ?? null,
    latestSyncedAt,
  };
}

export function buildCommunityTopicSuggestions(races: RaceInsightInput[]) {
  return races.slice(0, 4).map((race, index) => ({
    id: `topic-${race.sourceRaceId}-${index}`,
    href: `/races/${race.sourceRaceId}`,
    badge: race.region ?? '러닝 토픽',
    title: `${race.title} 준비 같이 해요`,
    description: `${race.courseSummary ?? '종목 정보'} · ${race.eventDateLabel ?? '일정 확인'} · 체크리스트와 훈련 팁을 나눠보세요.`,
  }));
}

export function buildPlanStarterTemplates(races: RaceInsightInput[]) {
  const highlightedRace = races[0];

  return [
    {
      id: 'starter-10k',
      title: '주 3회 10K 준비 템플릿',
      description: '이지런 · 템포 · 롱런 3축으로 부담 없이 시작하는 기본 루틴',
      accent: '부담 적음',
    },
    {
      id: 'starter-half',
      title: '하프 대비 주 4회 템플릿',
      description: '주간 강도 분배와 회복일을 함께 보여주는 중간 난이도 루틴',
      accent: highlightedRace ? `${highlightedRace.title} 대비` : '추천 루틴',
    },
    {
      id: 'starter-checklist',
      title: '첫 달 체크리스트',
      description: '목표 대회 선택 → 주간 빈도 설정 → 완료 체크까지 빠르게 시작',
      accent: '바로 시작',
    },
  ];
}

export function buildRelatedRaces(races: RaceInsightInput[], currentRaceId: string, region?: string | null) {
  return races
    .filter((race) => race.id !== currentRaceId)
    .sort((a, b) => {
      const regionScoreA = region && a.region === region ? 0 : 1;
      const regionScoreB = region && b.region === region ? 0 : 1;
      if (regionScoreA !== regionScoreB) return regionScoreA - regionScoreB;
      return (a.eventDate ?? '').localeCompare(b.eventDate ?? '') || a.title.localeCompare(b.title, 'ko');
    })
    .slice(0, 3);
}
