import 'server-only';

import { requireModerator } from '@/lib/auth/session';
import { buildRecentKstDayBuckets } from '@/lib/monetization/report';
import { getPartnerDashboard } from '@/lib/monetization/repository';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { OutboundClickEventRow, RaceDetailViewEventRow, summarizeOutboundClicks } from './outbound-report';

type RawOutboundClickEvent = {
  source_race_id: string;
  target_kind: string;
  source_path: string;
  viewer_role: string;
  created_at: string;
  races: { title: string } | { title: string }[] | null;
};

type RawRaceDetailViewEvent = {
  source_race_id: string;
  source_path: string;
  viewer_role: string;
  created_at: string;
  races: { title: string } | { title: string }[] | null;
};

function mapRaceTitle(value: RawOutboundClickEvent['races']) {
  if (!value) return '대회 이름 없음';
  if (Array.isArray(value)) {
    return value[0]?.title ?? '대회 이름 없음';
  }

  return value.title ?? '대회 이름 없음';
}

function mapOutboundClickEvent(row: RawOutboundClickEvent): OutboundClickEventRow {
  return {
    sourceRaceId: row.source_race_id,
    raceTitle: mapRaceTitle(row.races),
    targetKind: row.target_kind,
    sourcePath: row.source_path,
    viewerRole: row.viewer_role,
    createdAt: row.created_at,
  };
}

function mapRaceDetailViewEvent(row: RawRaceDetailViewEvent): RaceDetailViewEventRow {
  return {
    sourceRaceId: row.source_race_id,
    raceTitle: mapRaceTitle(row.races),
    sourcePath: row.source_path,
    viewerRole: row.viewer_role,
    createdAt: row.created_at,
  };
}

export async function getOutboundClickDashboard(days = 7) {
  await requireModerator('/ops/outbound-clicks');

  const supabase = await getSupabaseServerClient();
  const dateBuckets = buildRecentKstDayBuckets(days);
  const firstBucket = dateBuckets[0];
  const lastBucket = dateBuckets.at(-1);
  const sinceIso = firstBucket?.startIso ?? new Date().toISOString();
  const untilIso = lastBucket?.endIso ?? new Date().toISOString();
  const [{ data: clickData, error: clickError }, { data: viewData, error: viewError }] = await Promise.all([
    supabase
      .from('race_outbound_click_events')
      .select('source_race_id, target_kind, source_path, viewer_role, created_at, races(title)')
      .gte('created_at', sinceIso)
      .lt('created_at', untilIso)
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('race_detail_view_events')
      .select('source_race_id, source_path, viewer_role, created_at, races(title)')
      .gte('created_at', sinceIso)
      .lt('created_at', untilIso)
      .order('created_at', { ascending: false })
      .limit(1000),
  ]);

  if (clickError) {
    throw new Error(`외부 클릭 로그 조회 실패: ${clickError.message}`);
  }

  if (viewError) {
    throw new Error(`대회 상세 조회 로그 조회 실패: ${viewError.message}`);
  }

  const clickRows = ((clickData ?? []) as RawOutboundClickEvent[]).map(mapOutboundClickEvent);
  const viewRows = ((viewData ?? []) as RawRaceDetailViewEvent[]).map(mapRaceDetailViewEvent);
  const partner = await getPartnerDashboard(days);

  return {
    outbound: summarizeOutboundClicks(clickRows, viewRows),
    partner,
  };
}
