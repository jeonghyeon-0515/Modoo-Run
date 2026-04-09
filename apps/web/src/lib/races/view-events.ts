import 'server-only';

import { getSupabaseAdminClient } from '@/lib/supabase/admin';

type AdminInsertClient = {
  from(table: 'race_detail_view_events'): {
    insert(values: Record<string, string | null>): Promise<{ error: { message: string } | null }>;
  };
};

type RecordRaceDetailViewInput = {
  raceId: string;
  sourceRaceId: string;
  sourcePath: string;
  viewerId?: string | null;
  viewerRole?: string | null;
  referer?: string | null;
  userAgent?: string | null;
};

export async function recordRaceDetailView(input: RecordRaceDetailViewInput) {
  const admin = getSupabaseAdminClient() as unknown as AdminInsertClient;
  const { error } = await admin.from('race_detail_view_events').insert({
    race_id: input.raceId,
    user_id: input.viewerId ?? null,
    source_race_id: input.sourceRaceId,
    source_path: input.sourcePath,
    viewer_role: input.viewerRole ?? 'anon',
    referer: input.referer ?? null,
    user_agent: input.userAgent ?? null,
  });

  if (error) {
    throw new Error(`대회 상세 조회 기록 실패: ${error.message}`);
  }
}

