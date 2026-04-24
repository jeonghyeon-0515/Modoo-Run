import 'server-only';

import { getSupabaseServerClient } from '@/lib/supabase/server';
import { isRaceOpenForDiscovery } from './status';
import type { RaceLandingKey } from './landing-config';
import type { RaceStatus } from './types';

export type RaceLandingItem = {
  id: string;
  sourceRaceId: string;
  title: string;
  eventDate: string | null;
  eventDateLabel: string | null;
  region: string | null;
  location: string | null;
  courseSummary: string | null;
  registrationStatus: RaceStatus;
  registrationPeriodLabel: string | null;
  registrationCloseAt: string | null;
};

type RawRaceLandingRow = {
  id: string;
  source_race_id: string;
  title: string;
  event_date: string | null;
  event_date_label: string | null;
  region: string | null;
  location: string | null;
  course_summary: string | null;
  registration_status: RaceStatus;
  registration_period_label: string | null;
  registration_close_at: string | null;
};

const landingColumns =
  'id, source_race_id, title, event_date, event_date_label, region, location, course_summary, registration_status, registration_period_label, registration_close_at';

function mapRace(row: RawRaceLandingRow): RaceLandingItem {
  return {
    id: row.id,
    sourceRaceId: row.source_race_id,
    title: row.title,
    eventDate: row.event_date,
    eventDateLabel: row.event_date_label,
    region: row.region,
    location: row.location,
    courseSummary: row.course_summary,
    registrationStatus: row.registration_status,
    registrationPeriodLabel: row.registration_period_label,
    registrationCloseAt: row.registration_close_at,
  };
}

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export async function listRaceLandingItems(key: RaceLandingKey, limit = 48) {
  const supabase = await getSupabaseServerClient();
  let query = supabase
    .from('races')
    .select(landingColumns)
    .eq('registration_status', 'open')
    .order('event_date', { ascending: true, nullsFirst: false })
    .order('title', { ascending: true })
    .limit(limit * 4);

  if (key === 'closing-soon') {
    const now = new Date();
    query = query
      .not('registration_close_at', 'is', null)
      .gte('registration_close_at', toDateOnly(now))
      .lte('registration_close_at', toDateOnly(addDays(now, 7)))
      .order('registration_close_at', { ascending: true, nullsFirst: false });
  } else if (key === 'seoul-metro') {
    query = query.in('region', ['서울', '경기', '인천']);
  } else if (key === 'busan-yeongnam') {
    query = query.in('region', ['부산', '울산', '대구', '경남', '경북']);
  } else if (key === '10k') {
    query = query.ilike('course_summary', '%10%');
  } else if (key === 'half-full') {
    query = query.or('course_summary.ilike.%하프%,course_summary.ilike.%풀%,course_summary.ilike.%half%,course_summary.ilike.%full%');
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`대회 랜딩 목록 조회 실패: ${error.message}`);
  }

  return ((data ?? []) as RawRaceLandingRow[])
    .map(mapRace)
    .filter((race) =>
      isRaceOpenForDiscovery({
        eventDate: race.eventDate,
        registrationCloseAt: race.registrationCloseAt,
        registrationStatus: race.registrationStatus,
      }),
    )
    .slice(0, limit);
}
