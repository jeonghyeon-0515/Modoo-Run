export const RACE_COMPARE_STORAGE_KEY = 'modoo-run:race-compare:v1';
export const MAX_RACE_COMPARE_ITEMS = 4;

export type RaceCompareItem = {
  sourceRaceId: string;
  title: string;
  eventDate: string | null;
  eventDateLabel: string | null;
  region: string | null;
  location: string | null;
  courseSummary: string | null;
  registrationPeriodLabel: string | null;
  detailPath: string;
};

export function normalizeRaceCompareItems(items: RaceCompareItem[]) {
  const seen = new Set<string>();
  const normalized: RaceCompareItem[] = [];

  items.forEach((item) => {
    const sourceRaceId = item.sourceRaceId.trim();
    if (!sourceRaceId || seen.has(sourceRaceId)) return;
    seen.add(sourceRaceId);
    normalized.push({
      ...item,
      sourceRaceId,
      title: item.title.trim() || sourceRaceId,
      detailPath: item.detailPath.startsWith('/') ? item.detailPath : `/races/${sourceRaceId}`,
    });
  });

  return normalized.slice(0, MAX_RACE_COMPARE_ITEMS);
}

export function upsertRaceCompareItem(items: RaceCompareItem[], item: RaceCompareItem) {
  return normalizeRaceCompareItems([item, ...items.filter((entry) => entry.sourceRaceId !== item.sourceRaceId)]);
}

export function removeRaceCompareItem(items: RaceCompareItem[], sourceRaceId: string) {
  return items.filter((item) => item.sourceRaceId !== sourceRaceId);
}
