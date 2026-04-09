import { getUpstashRedisClient } from '@/lib/cache/upstash';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { applyRaceFilters, getRaceCacheTtlSeconds } from './cache-helpers';
import {
  RaceDetailItem,
  RaceFilters,
  RaceListItem,
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

type OpenRaceIndex = {
  version: 'v2';
  warmedAt: string;
  sourceRaceIds: string[];
};

type RaceCacheWarmResult = {
  enabled: boolean;
  refreshed: boolean;
  count?: number;
  warmedAt?: string;
  message?: string;
};

const OPEN_RACE_INDEX_KEY = 'races:v2:open:ids';
const OPEN_RACE_DETAIL_PREFIX = 'races:v2:detail:';
const LEGACY_DATASET_KEY = 'races:v1:dataset';
const MEMORY_TTL_MS = 60 * 1000;
const raceCacheSelectColumns =
  'id, source_race_id, title, event_date, event_date_label, weekday_label, region, location, course_summary, organizer, registration_status, registration_period_label, last_synced_at, representative_name, phone, homepage_url, summary, description, source_detail_url, source_list_url, registration_open_at, registration_close_at';

let memoryOpenIndex: { expiresAt: number; value: OpenRaceIndex } | null = null;
const memoryOpenDetails = new Map<string, { expiresAt: number; value: RaceDetailItem }>();

function detailKey(sourceRaceId: string) {
  return `${OPEN_RACE_DETAIL_PREFIX}${sourceRaceId}`;
}

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

function mapDetailToList(detail: RaceDetailItem): RaceListItem {
  return {
    id: detail.id,
    sourceRaceId: detail.sourceRaceId,
    title: detail.title,
    eventDate: detail.eventDate,
    eventDateLabel: detail.eventDateLabel,
    weekdayLabel: detail.weekdayLabel,
    region: detail.region,
    location: detail.location,
    courseSummary: detail.courseSummary,
    organizer: detail.organizer,
    registrationStatus: detail.registrationStatus,
    registrationPeriodLabel: detail.registrationPeriodLabel,
    lastSyncedAt: detail.lastSyncedAt,
  };
}

function readJson<T>(raw: unknown): T | null {
  if (raw == null) return null;

  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  return raw as T;
}

function rememberOpenIndex(index: OpenRaceIndex) {
  memoryOpenIndex = {
    expiresAt: Date.now() + MEMORY_TTL_MS,
    value: index,
  };
}

function rememberDetail(detail: RaceDetailItem) {
  memoryOpenDetails.set(detail.sourceRaceId, {
    expiresAt: Date.now() + MEMORY_TTL_MS,
    value: detail,
  });
}

function getRememberedDetail(sourceRaceId: string) {
  const cached = memoryOpenDetails.get(sourceRaceId);
  if (!cached) return null;
  if (cached.expiresAt <= Date.now()) {
    memoryOpenDetails.delete(sourceRaceId);
    return null;
  }
  return cached.value;
}

async function readOpenIndexFromRedis() {
  const redis = getUpstashRedisClient();
  if (!redis) return null;

  const raw = await redis.get(OPEN_RACE_INDEX_KEY);
  return readJson<OpenRaceIndex>(raw);
}

async function readOpenIndex() {
  if (memoryOpenIndex && memoryOpenIndex.expiresAt > Date.now()) {
    return memoryOpenIndex.value;
  }

  const parsed = await readOpenIndexFromRedis();
  if (parsed) {
    rememberOpenIndex(parsed);
  }

  return parsed;
}

async function readOpenRaceDetails(sourceRaceIds: string[]) {
  if (sourceRaceIds.length === 0) return [] as RaceDetailItem[];

  const details = new Map<string, RaceDetailItem>();
  const missingIds: string[] = [];

  sourceRaceIds.forEach((sourceRaceId) => {
    const cached = getRememberedDetail(sourceRaceId);
    if (cached) {
      details.set(sourceRaceId, cached);
    } else {
      missingIds.push(sourceRaceId);
    }
  });

  if (missingIds.length > 0) {
    const redis = getUpstashRedisClient();
    if (!redis) return [...details.values()];

    const values = await redis.mget(missingIds.map(detailKey));
    missingIds.forEach((sourceRaceId, index) => {
      const parsed = readJson<RaceDetailItem>(values[index]);
      if (!parsed) return;
      details.set(sourceRaceId, parsed);
      rememberDetail(parsed);
    });
  }

  return sourceRaceIds
    .map((sourceRaceId) => details.get(sourceRaceId))
    .filter(Boolean) as RaceDetailItem[];
}

export async function getCachedRaceList(filters: RaceFilters = {}) {
  if (filters.registrationStatus !== 'open') {
    return null;
  }

  const index = await readOpenIndex();
  if (!index) return null;

  const details = await readOpenRaceDetails(index.sourceRaceIds);
  if (details.length === 0) return null;

  return applyRaceFilters(details.map(mapDetailToList), filters);
}

export async function getCachedRaceDetail(sourceRaceId: string) {
  const remembered = getRememberedDetail(sourceRaceId);
  if (remembered) {
    return remembered;
  }

  const redis = getUpstashRedisClient();
  if (!redis) return null;

  const raw = await redis.get(detailKey(sourceRaceId));
  const parsed = readJson<RaceDetailItem>(raw);
  if (!parsed) return null;

  rememberDetail(parsed);
  return parsed;
}

export async function getCachedRelatedRaces(input: {
  excludeSourceRaceId: string;
  region?: string | null;
  limit?: number;
}) {
  const index = await readOpenIndex();
  if (!index) return null;

  const limit = input.limit ?? 3;
  const details = await readOpenRaceDetails(index.sourceRaceIds);
  const base = details
    .map(mapDetailToList)
    .filter((item) => item.sourceRaceId !== input.excludeSourceRaceId);

  if (input.region) {
    const regional = base.filter((item) => item.region === input.region).slice(0, limit);
    if (regional.length > 0) {
      return regional;
    }
  }

  if (base.length === 0) return null;
  return base.slice(0, limit);
}

export async function getCachedRegions() {
  const index = await readOpenIndex();
  if (!index) return null;

  const details = await readOpenRaceDetails(index.sourceRaceIds);
  if (details.length === 0) return null;

  return [...new Set(details.map((item) => item.region).filter(Boolean))] as string[];
}

export async function getCachedRecentlySyncedRaces() {
  return null;
}

export async function getCachedRaceExplorerSummary() {
  return null;
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
    .eq('registration_status', 'open')
    .order('event_date', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });

  if (error) {
    throw new Error(`Redis 캐시용 진행중 race 조회 실패: ${error.message}`);
  }

  const rows = (data ?? []) as RawRace[];
  const warmedAt = new Date().toISOString();
  const index: OpenRaceIndex = {
    version: 'v2',
    warmedAt,
    sourceRaceIds: rows.map((row) => row.source_race_id),
  };

  const previousIndex = await readOpenIndexFromRedis();
  const previousIds = previousIndex?.sourceRaceIds ?? [];
  const nextIds = new Set(index.sourceRaceIds);
  const staleIds = previousIds.filter((sourceRaceId) => !nextIds.has(sourceRaceId));
  const expireAtCandidates: number[] = [];
  const pipeline = redis.pipeline();

  pipeline.del(LEGACY_DATASET_KEY);

  rows.forEach((row) => {
    const detail = mapRaceDetail(row);
    const ttlSeconds = getRaceCacheTtlSeconds(detail.registrationCloseAt);
    expireAtCandidates.push(ttlSeconds);
    pipeline.set(detailKey(detail.sourceRaceId), JSON.stringify(detail), { ex: ttlSeconds });
    rememberDetail(detail);
  });

  if (staleIds.length > 0) {
    pipeline.del(...staleIds.map(detailKey));
    staleIds.forEach((sourceRaceId) => memoryOpenDetails.delete(sourceRaceId));
  }

  if (index.sourceRaceIds.length > 0) {
    const indexTtlSeconds = Math.min(...expireAtCandidates);
    pipeline.set(OPEN_RACE_INDEX_KEY, JSON.stringify(index), { ex: indexTtlSeconds });
    rememberOpenIndex(index);
  } else {
    pipeline.del(OPEN_RACE_INDEX_KEY);
    memoryOpenIndex = null;
  }

  await pipeline.exec({ keepErrors: true });

  return {
    enabled: true,
    refreshed: true,
    count: index.sourceRaceIds.length,
    warmedAt,
  };
}
