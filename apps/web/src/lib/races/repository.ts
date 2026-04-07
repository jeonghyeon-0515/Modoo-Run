import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { RaceDetailItem, RaceFilters, RaceListItem, RaceStatus } from './types';
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin: any = getSupabaseAdminClient();
  let query = admin
    .from('races')
    .select(
      'id, source_race_id, title, event_date, event_date_label, weekday_label, region, location, course_summary, organizer, registration_status, registration_period_label, last_synced_at',
    )
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin: any = getSupabaseAdminClient();
  const { data, error } = await admin
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

export async function listRegions() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin: any = getSupabaseAdminClient();
  const { data, error } = await admin.from('races').select('region').not('region', 'is', null);
  if (error) {
    throw new Error(`지역 목록 조회 실패: ${error.message}`);
  }

  return [...new Set((data ?? []).map((row: { region: string | null }) => row.region).filter(Boolean))] as string[];
}
