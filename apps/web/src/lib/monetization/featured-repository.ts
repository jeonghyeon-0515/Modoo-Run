import 'server-only';

import { requireModerator } from '@/lib/auth/session';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { listRaces } from '@/lib/races/repository';
import { getEffectiveRaceStatus } from '@/lib/races/status';
import type { RaceListItem } from '@/lib/races/types';
import { pickFeaturedRaces, type FeaturedRacePlacement } from './public-catalog';

type SlotKey = 'featured_primary' | 'featured_secondary';

export const featuredPlacementLabelOptions = ['Featured Listing', '지역 추천', '스폰서'] as const;

type RawFeaturedPlacement = {
  slot_key: SlotKey;
  race_id: string;
  eyebrow: string;
  summary: string;
  is_active: boolean;
  updated_by_user_id: string | null;
  updated_at: string;
};

type RawRaceListRow = {
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
  registration_status: 'open' | 'closed' | 'unknown';
  registration_period_label: string | null;
  registration_close_at: string | null;
  last_synced_at: string | null;
};

const raceListColumns =
  'id, source_race_id, title, event_date, event_date_label, weekday_label, region, location, course_summary, organizer, registration_status, registration_period_label, registration_close_at, last_synced_at';

function getDefaultPlacementSummaries(): Record<SlotKey, { eyebrow: string; summary: string }> {
  return {
    featured_primary: {
      eyebrow: 'Featured Listing',
      summary: '지금 눈여겨볼 대회로 먼저 보여주는 시범 노출 영역입니다.',
    },
    featured_secondary: {
      eyebrow: '지역 추천',
      summary: '같은 흐름에서 함께 비교하기 좋은 대회를 눈에 띄게 노출합니다.',
    },
  };
}

function mapRaceById(races: RaceListItem[]) {
  return new Map(races.map((race) => [race.id, race]));
}

function mapRace(row: RawRaceListRow): RaceListItem {
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
    registrationStatus: getEffectiveRaceStatus({
      eventDate: row.event_date,
      registrationCloseAt: row.registration_close_at,
      registrationStatus: row.registration_status,
    }),
    registrationPeriodLabel: row.registration_period_label,
    registrationCloseAt: row.registration_close_at,
    lastSyncedAt: row.last_synced_at,
  };
}

export async function listActiveFeaturedRacePlacements(fallbackRaces: RaceListItem[], limit = 2): Promise<FeaturedRacePlacement[]> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data, error } = await supabase
      .from('featured_race_placements')
      .select('slot_key, race_id, eyebrow, summary, is_active, updated_by_user_id, updated_at')
      .eq('is_active', true)
      .order('slot_key', { ascending: true });

    if (error) {
      throw new Error(`featured listing 조회 실패: ${error.message}`);
    }

    const placements = (data ?? []) as RawFeaturedPlacement[];
    if (placements.length === 0) {
      return pickFeaturedRaces(fallbackRaces, limit);
    }

    const raceById = mapRaceById(fallbackRaces);
    const missingIds = placements.map((placement) => placement.race_id).filter((raceId) => !raceById.has(raceId));

    if (missingIds.length > 0) {
      const { data: raceRows, error: raceError } = await supabase
        .from('races')
        .select(raceListColumns)
        .in('id', missingIds);

      if (raceError) {
        throw new Error(`featured 대회 조회 실패: ${raceError.message}`);
      }

      (raceRows ?? []).forEach((row) => {
        const race = mapRace(row as RawRaceListRow);
        raceById.set(race.id, race);
      });
    }

    const mapped = placements
      .map((placement) => {
        const race = raceById.get(placement.race_id);
        if (!race) return null;
        return {
          race,
          eyebrow: placement.eyebrow,
          summary: placement.summary,
        } satisfies FeaturedRacePlacement;
      })
      .filter(Boolean) as FeaturedRacePlacement[];

    return mapped.length > 0 ? mapped.slice(0, limit) : pickFeaturedRaces(fallbackRaces, limit);
  } catch (error) {
    console.warn('featured placement lookup failed, using fallback', error);
    return pickFeaturedRaces(fallbackRaces, limit);
  }
}

export async function listFeaturedPlacementsForOps() {
  const viewer = await requireModerator('/ops/featured');
  const supabase = await getSupabaseServerClient();
  const [races, placementResponse] = await Promise.all([
    listRaces({ registrationStatus: 'open', limit: 120 }),
    supabase
      .from('featured_race_placements')
      .select('slot_key, race_id, eyebrow, summary, is_active, updated_by_user_id, updated_at')
      .order('slot_key', { ascending: true }),
  ]);

  if (placementResponse.error) {
    throw new Error(`featured listing 운영 조회 실패: ${placementResponse.error.message}`);
  }

  const defaults = getDefaultPlacementSummaries();
  const placementMap = new Map(
    ((placementResponse.data ?? []) as RawFeaturedPlacement[]).map((item) => [item.slot_key, item]),
  );

  const slots: Array<{
    slotKey: SlotKey;
    title: string;
    raceId: string;
    eyebrow: string;
    summary: string;
    isActive: boolean;
    updatedAt: string | null;
  }> = [
    {
      slotKey: 'featured_primary',
      title: '메인 featured 슬롯',
      raceId: placementMap.get('featured_primary')?.race_id ?? '',
      eyebrow: placementMap.get('featured_primary')?.eyebrow ?? defaults.featured_primary.eyebrow,
      summary: placementMap.get('featured_primary')?.summary ?? defaults.featured_primary.summary,
      isActive: placementMap.get('featured_primary')?.is_active ?? true,
      updatedAt: placementMap.get('featured_primary')?.updated_at ?? null,
    },
    {
      slotKey: 'featured_secondary',
      title: '보조 featured 슬롯',
      raceId: placementMap.get('featured_secondary')?.race_id ?? '',
      eyebrow: placementMap.get('featured_secondary')?.eyebrow ?? defaults.featured_secondary.eyebrow,
      summary: placementMap.get('featured_secondary')?.summary ?? defaults.featured_secondary.summary,
      isActive: placementMap.get('featured_secondary')?.is_active ?? true,
      updatedAt: placementMap.get('featured_secondary')?.updated_at ?? null,
    },
  ];

  return {
    viewer,
    races,
    slots,
  };
}

export async function saveFeaturedPlacement(input: {
  slotKey: SlotKey;
  raceId: string;
  eyebrow: string;
  summary: string;
  isActive: boolean;
}) {
  const viewer = await requireModerator('/ops/featured');
  const supabase = await getSupabaseServerClient();

  const eyebrow = input.eyebrow.trim();
  const summary = input.summary.trim();

  if (!input.raceId) {
    throw new Error('노출할 대회를 선택해 주세요.');
  }

  if (!eyebrow) {
    throw new Error('노출 라벨을 입력해 주세요.');
  }

  if (!featuredPlacementLabelOptions.includes(eyebrow as (typeof featuredPlacementLabelOptions)[number])) {
    throw new Error('허용된 라벨만 선택해 주세요.');
  }

  if (!summary) {
    throw new Error('노출 설명을 입력해 주세요.');
  }

  const { error } = await supabase.from('featured_race_placements').upsert(
    {
      slot_key: input.slotKey,
      race_id: input.raceId,
      eyebrow,
      summary,
      is_active: input.isActive,
      updated_by_user_id: viewer.id,
    },
    { onConflict: 'slot_key' },
  );

  if (error) {
    throw new Error(`featured listing 저장 실패: ${error.message}`);
  }

  const { error: auditError } = await supabase.from('admin_audit_logs').insert({
    actor_user_id: viewer.id,
    target_table: 'featured_race_placements',
    action: 'upsert',
    details: {
      slotKey: input.slotKey,
      raceId: input.raceId,
      isActive: input.isActive,
    },
  });

  if (auditError) {
    throw new Error(`관리자 로그 기록 실패: ${auditError.message}`);
  }
}

export async function clearFeaturedPlacement(slotKey: SlotKey) {
  const viewer = await requireModerator('/ops/featured');
  const supabase = await getSupabaseServerClient();

  const { error } = await supabase.from('featured_race_placements').delete().eq('slot_key', slotKey);
  if (error) {
    throw new Error(`featured listing 비우기 실패: ${error.message}`);
  }

  const { error: auditError } = await supabase.from('admin_audit_logs').insert({
    actor_user_id: viewer.id,
    target_table: 'featured_race_placements',
    action: 'delete',
    details: { slotKey },
  });

  if (auditError) {
    throw new Error(`관리자 로그 기록 실패: ${auditError.message}`);
  }
}
