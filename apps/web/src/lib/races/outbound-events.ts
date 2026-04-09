import 'server-only';

import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import type { RaceOutboundTarget } from './outbound';

type AdminInsertClient = {
  from(table: 'race_outbound_click_events'): {
    insert(values: Record<string, string | null>): Promise<{ error: { message: string } | null }>;
  };
};

type RecordRaceOutboundClickInput = {
  raceId: string;
  sourceRaceId: string;
  targetKind: RaceOutboundTarget;
  targetUrl: string;
  sourcePath: string;
  viewerId?: string | null;
  viewerRole?: string | null;
  referer?: string | null;
  userAgent?: string | null;
};

export async function recordRaceOutboundClick(input: RecordRaceOutboundClickInput) {
  const admin = getSupabaseAdminClient() as unknown as AdminInsertClient;
  const { error } = await admin.from('race_outbound_click_events').insert({
    race_id: input.raceId,
    user_id: input.viewerId ?? null,
    source_race_id: input.sourceRaceId,
    target_kind: input.targetKind,
    target_url: input.targetUrl,
    source_path: input.sourcePath,
    viewer_role: input.viewerRole ?? 'anon',
    referer: input.referer ?? null,
    user_agent: input.userAgent ?? null,
  });

  if (error) {
    throw new Error(`외부 링크 클릭 기록 실패: ${error.message}`);
  }
}
