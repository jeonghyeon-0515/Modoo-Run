import { getSupabaseServerClient } from '@/lib/supabase/server';
import {
  RaceDetailItem,
  RaceExplorerSummary,
  RaceFilters,
  RaceListItem,
  RaceRegionSummary,
  RaceStatus,
} from './types';
import { normalizeMonthFilter } from './formatters';

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

const raceListColumns =
  'id, source_race_id, title, event_date, event_date_label, weekday_label, region, location, course_summary, organizer, registration_status, registration_period_label, last_synced_at';

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

export async function listRaces(filters: RaceFilters = {}): Promise<RaceListItem[]> {
  const supabase = await getSupabaseServerClient();
  let query = supabase
    .from('races')
    .select(raceListColumns)
    .order('event_date', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true });

  if (filters.registrationStatus && filters.registrationStatus !== 'all') {
    query = query.eq('registration_status', filters.registrationStatus);
  }

  if (filters.region) {
    query = query.eq('region', filters.region);
  }

  const month = normalizeMonthFilter(filters.month);
  if (month) {
    const currentYear = new Date().getFullYear();
    const start = `${currentYear}-${String(month).padStart(2, '0')}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? currentYear + 1 : currentYear;
    const end = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;
    query = query.gte('event_date', start).lt('event_date', end);
  }

  if (filters.distance) {
    query = query.ilike('course_summary', `%${filters.distance}%`);
  }

  if (filters.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`대회 목록 조회 실패: ${error.message}`);
  }

  return (data ?? []).map((row: RawRace) => mapRace(row));
}

export async function getRaceBySourceRaceId(sourceRaceId: string): Promise<RaceDetailItem | null> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('races')
    .select(
      'id, source_race_id, title, event_date, event_date_label, weekday_label, region, location, course_summary, organizer, registration_status, registration_period_label, last_synced_at, representative_name, phone, homepage_url, summary, description, source_detail_url, source_list_url, registration_open_at, registration_close_at',
    )
    .eq('source_race_id', sourceRaceId)
    .maybeSingle();

  if (error) {
    throw new Error(`대회 상세 조회 실패: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapRaceDetail(data as RawRace);
}

export async function listRecentlySyncedRaces(limit = 6): Promise<RaceListItem[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('races')
    .select(raceListColumns)
    .order('last_synced_at', { ascending: false })
    .order('event_date', { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) {
    throw new Error(`최근 수집 대회 조회 실패: ${error.message}`);
  }

  return (data ?? []).map((row: RawRace) => mapRace(row));
}

export async function listRelatedRaces(input: {
  excludeSourceRaceId: string;
  region?: string | null;
  limit?: number;
}): Promise<RaceListItem[]> {
  const supabase = await getSupabaseServerClient();
  const limit = input.limit ?? 3;

  const buildBaseQuery = () =>
    supabase
      .from('races')
      .select(raceListColumns)
      .neq('source_race_id', input.excludeSourceRaceId)
      .order('event_date', { ascending: true, nullsFirst: false })
      .limit(limit);

  if (input.region) {
    const { data, error } = await buildBaseQuery().eq('region', input.region);

    if (error) {
      throw new Error(`관련 대회 조회 실패: ${error.message}`);
    }

    if ((data ?? []).length > 0) {
      return (data ?? []).map((row: RawRace) => mapRace(row));
    }
  }

  const { data, error } = await buildBaseQuery();

  if (error) {
    throw new Error(`관련 대회 조회 실패: ${error.message}`);
  }

  return (data ?? []).map((row: RawRace) => mapRace(row));
}

export async function getRaceExplorerSummary(limitRegions = 4): Promise<RaceExplorerSummary> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('races')
    .select('region, registration_status, last_synced_at');

  if (error) {
    throw new Error(`대회 요약 조회 실패: ${error.message}`);
  }

  const rows =
    (data as Array<{
      region: string | null;
      registration_status: RaceStatus;
      last_synced_at: string | null;
    }>) ?? [];

  const regionCounts = new Map<string, number>();
  let latestSyncAt: string | null = null;
  let openCount = 0;
  let closedCount = 0;
  let unknownCount = 0;

  rows.forEach((row) => {
    if (row.registration_status === 'open') openCount += 1;
    else if (row.registration_status === 'closed') closedCount += 1;
    else unknownCount += 1;

    if (row.region) {
      regionCounts.set(row.region, (regionCounts.get(row.region) ?? 0) + 1);
    }

    if (row.last_synced_at && (!latestSyncAt || new Date(row.last_synced_at) > new Date(latestSyncAt))) {
      latestSyncAt = row.last_synced_at;
    }
  });

  const topRegions: RaceRegionSummary[] = [...regionCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limitRegions)
    .map(([region, count]) => ({ region, count }));

  return {
    totalCount: rows.length,
    openCount,
    closedCount,
    unknownCount,
    regionCount: regionCounts.size,
    latestSyncAt,
    topRegions,
  };
}

export async function listRegions() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.from('races').select('region').not('region', 'is', null);
  if (error) {
    throw new Error(`지역 목록 조회 실패: ${error.message}`);
  }

  return [...new Set((data ?? []).map((row: { region: string | null }) => row.region).filter(Boolean))] as string[];
}

export async function listBookmarkedRaceIds(userId: string) {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.from('race_bookmarks').select('race_id').eq('user_id', userId);

  if (error) {
    throw new Error(`관심 대회 조회 실패: ${error.message}`);
  }

  return new Set((data ?? []).map((row: { race_id: string }) => row.race_id));
}

export async function setRaceBookmark(userId: string, raceId: string, enabled: boolean) {
  const supabase = await getSupabaseServerClient();

  if (enabled) {
    const { error } = await supabase.from('race_bookmarks').upsert(
      {
        user_id: userId,
        race_id: raceId,
      },
      { onConflict: 'user_id,race_id' },
    );

    if (error) {
      throw new Error(`관심 대회 저장 실패: ${error.message}`);
    }

    return;
  }

  const { error } = await supabase.from('race_bookmarks').delete().eq('user_id', userId).eq('race_id', raceId);
  if (error) {
    throw new Error(`관심 대회 해제 실패: ${error.message}`);
  }
}
