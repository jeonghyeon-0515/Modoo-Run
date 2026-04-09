import { getUpstashRedisClient } from '@/lib/cache/upstash';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { applyRaceFilters } from './cache-helpers';
import {
  RaceDetailItem,
  RaceExplorerSummary,
  RaceFilters,
  RaceListItem,
  RaceRegionSummary,
  RaceStatus,
} from './types';

type RawRace = {
  id: string;
  source_race_id: string;
  title: string;
  event_date: string | null;
  event_date_label: string | null;
  weekday_label: string | null;
  region: string | null;
  location: string | null;
  course_summary: string | null;
  organizer: string | null;
  registration_status: RaceStatus;
  registration_period_label: string | null;
  last_synced_at: string | null;
  representative_name?: string | null;
  phone?: string | null;
  homepage_url?: string | null;
  summary?: string | null;
  description?: string | null;
  source_detail_url?: string | null;
  source_list_url?: string | null;
  registration_open_at?: string | null;
  registration_close_at?: string | null;
};

type RaceCacheDataset = {
  version: 'v1';
  warmedAt: string;
  list: RaceListItem[];
  detailsBySourceId: Record<string, RaceDetailItem>;
};

type RaceCacheWarmResult = {
  enabled: boolean;
  refreshed: boolean;
  count?: number;
  warmedAt?: string;
  message?: string;
};

const RACE_CACHE_KEY = 'races:v1:dataset';
const RACE_CACHE_TTL_SECONDS = 60 * 60 * 36;
const RACE_CACHE_MEMORY_TTL_MS = 60 * 1000;
const raceCacheSelectColumns =
  'id, source_race_id, title, event_date, event_date_label, weekday_label, region, location, course_summary, organizer, registration_status, registration_period_label, last_synced_at, representative_name, phone, homepage_url, summary, description, source_detail_url, source_list_url, registration_open_at, registration_close_at';

let memoryDataset: { expiresAt: number; value: RaceCacheDataset } | null = null;

function mapRace(row: RawRace): RaceListItem {
  return {
    id: row.id,
    sourceRaceId: row.source_race_id,
    title: row.title,
    eventDate: row.event_date,
    eventDateLabel: row.event_date_label,
    weekdayLabel: row.weekday_label,
    region: row.region,
    location: row.location,
    courseSummary: row.course_summary,
    organizer: row.organizer,
    registrationStatus: row.registration_status,
    registrationPeriodLabel: row.registration_period_label,
    lastSyncedAt: row.last_synced_at,
  };
}

function mapRaceDetail(row: RawRace): RaceDetailItem {
  return {
    ...mapRace(row),
    representativeName: row.representative_name ?? null,
    phone: row.phone ?? null,
    homepageUrl: row.homepage_url ?? null,
    summary: row.summary ?? null,
    description: row.description ?? null,
    sourceDetailUrl: row.source_detail_url ?? null,
    sourceListUrl: row.source_list_url ?? null,
    registrationOpenAt: row.registration_open_at ?? null,
    registrationCloseAt: row.registration_close_at ?? null,
  };
}

function rememberDataset(dataset: RaceCacheDataset) {
  memoryDataset = {
    expiresAt: Date.now() + RACE_CACHE_MEMORY_TTL_MS,
    value: dataset,
  };
}

function parseDataset(raw: string | null) {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as RaceCacheDataset;
    if (parsed.version !== 'v1' || !Array.isArray(parsed.list) || !parsed.detailsBySourceId) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function readRaceCacheDataset() {
  if (memoryDataset && memoryDataset.expiresAt > Date.now()) {
    return memoryDataset.value;
  }

  const redis = getUpstashRedisClient();
  if (!redis) {
    return null;
  }

  const raw = await redis.get<string>(RACE_CACHE_KEY);
  const parsed = parseDataset(raw);
  if (parsed) {
    rememberDataset(parsed);
  }
  return parsed;
}

export async function getCachedRaceList(filters: RaceFilters = {}) {
  const dataset = await readRaceCacheDataset();
  if (!dataset) return null;
  return applyRaceFilters(dataset.list, filters);
}

export async function getCachedRaceDetail(sourceRaceId: string) {
  const dataset = await readRaceCacheDataset();
  if (!dataset) return null;
  return dataset.detailsBySourceId[sourceRaceId] ?? null;
}

export async function getCachedRecentlySyncedRaces(limit = 6) {
  const dataset = await readRaceCacheDataset();
  if (!dataset) return null;

  return [...dataset.list]
    .sort((a, b) => {
      const left = a.lastSyncedAt ? new Date(a.lastSyncedAt).getTime() : 0;
      const right = b.lastSyncedAt ? new Date(b.lastSyncedAt).getTime() : 0;
      if (right !== left) return right - left;
      return (a.eventDate ?? '9999-12-31').localeCompare(b.eventDate ?? '9999-12-31');
    })
    .slice(0, limit);
}

export async function getCachedRelatedRaces(input: {
  excludeSourceRaceId: string;
  region?: string | null;
  limit?: number;
}) {
  const dataset = await readRaceCacheDataset();
  if (!dataset) return null;

  const limit = input.limit ?? 3;
  const base = dataset.list.filter((item) => item.sourceRaceId !== input.excludeSourceRaceId);

  if (input.region) {
    const regional = base.filter((item) => item.region === input.region).slice(0, limit);
    if (regional.length > 0) {
      return regional;
    }
  }

  return base.slice(0, limit);
}

export async function getCachedRegions() {
  const dataset = await readRaceCacheDataset();
  if (!dataset) return null;

  return [...new Set(dataset.list.map((item) => item.region).filter(Boolean))] as string[];
}

export async function getCachedRaceExplorerSummary(limitRegions = 4) {
  const dataset = await readRaceCacheDataset();
  if (!dataset) return null;

  const regionCounts = new Map<string, number>();
  let latestSyncAt: string | null = null;
  let openCount = 0;
  let closedCount = 0;
  let unknownCount = 0;

  dataset.list.forEach((item) => {
    if (item.registrationStatus === 'open') openCount += 1;
    else if (item.registrationStatus === 'closed') closedCount += 1;
    else unknownCount += 1;

    if (item.region) {
      regionCounts.set(item.region, (regionCounts.get(item.region) ?? 0) + 1);
    }

    if (item.lastSyncedAt && (!latestSyncAt || new Date(item.lastSyncedAt) > new Date(latestSyncAt))) {
      latestSyncAt = item.lastSyncedAt;
    }
  });

  const topRegions: RaceRegionSummary[] = [...regionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limitRegions)
    .map(([region, count]) => ({ region, count }));

  const summary: RaceExplorerSummary = {
    totalCount: dataset.list.length,
    openCount,
    closedCount,
    unknownCount,
    regionCount: regionCounts.size,
    latestSyncAt,
    topRegions,
  };

  return summary;
}

export async function warmRaceCacheFromDatabase(): Promise<RaceCacheWarmResult> {
  const redis = getUpstashRedisClient();
  if (!redis) {
    return {
      enabled: false,
      refreshed: false,
      message: 'UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN 미설정',
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin: any = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('races')
    .select(raceCacheSelectColumns)
    .order('event_date', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });

  if (error) {
    throw new Error(`Redis 캐시용 race 조회 실패: ${error.message}`);
  }

  const rows = (data ?? []) as RawRace[];
  const dataset: RaceCacheDataset = {
    version: 'v1',
    warmedAt: new Date().toISOString(),
    list: rows.map(mapRace),
    detailsBySourceId: Object.fromEntries(rows.map((row) => [row.source_race_id, mapRaceDetail(row)])),
  };

  await redis.set(RACE_CACHE_KEY, JSON.stringify(dataset), { ex: RACE_CACHE_TTL_SECONDS });
  rememberDataset(dataset);

  return {
    enabled: true,
    refreshed: true,
    count: dataset.list.length,
    warmedAt: dataset.warmedAt,
  };
}
