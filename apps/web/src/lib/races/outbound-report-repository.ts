import 'server-only';

import { requireModerator } from '@/lib/auth/session';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { OutboundClickEventRow, summarizeOutboundClicks } from './outbound-report';

type RawOutboundClickEvent = {
  source_race_id: string;
  target_kind: string;
  source_path: string;
  viewer_role: string;
  created_at: string;
  races: { title: string } | { title: string }[] | null;
};

function getSinceIso(days: number) {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);
  return since.toISOString();
}

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

export async function getOutboundClickDashboard(days = 7) {
  await requireModerator('/ops/outbound-clicks');

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('race_outbound_click_events')
    .select('source_race_id, target_kind, source_path, viewer_role, created_at, races(title)')
    .gte('created_at', getSinceIso(days))
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    throw new Error(`외부 클릭 로그 조회 실패: ${error.message}`);
  }

  const rows = ((data ?? []) as RawOutboundClickEvent[]).map(mapOutboundClickEvent);
  return summarizeOutboundClicks(rows);
}

