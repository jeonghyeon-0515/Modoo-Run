import 'server-only';

import { requireModerator } from '@/lib/auth/session';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import {
  correctionStatuses,
  getCorrectionFieldKindLabel,
  getCorrectionRequesterRoleLabel,
  getCorrectionStatusLabel,
  isCorrectionStatus,
  type CorrectionStatus,
} from './utils';

type RawCorrectionRow = {
  id: string;
  race_id: string;
  source_race_id: string;
  requester_name: string;
  requester_email: string;
  requester_role: string;
  field_kind: string;
  current_value: string | null;
  suggested_value: string;
  message: string | null;
  source_path: string;
  status: CorrectionStatus;
  admin_note: string | null;
  reviewed_at: string | null;
  created_at: string;
  race:
    | {
        title: string;
        source_race_id: string;
        region: string | null;
        event_date_label: string | null;
      }
    | Array<{
        title: string;
        source_race_id: string;
        region: string | null;
        event_date_label: string | null;
      }>
    | null;
};

type CorrectionInsertClient = {
  from(table: 'race_correction_requests'): {
    insert(values: Record<string, string | null>): Promise<{ error: { message: string } | null }>;
  };
};

function mapCorrection(row: RawCorrectionRow) {
  const race = Array.isArray(row.race) ? row.race[0] : row.race;

  return {
    id: row.id,
    raceId: row.race_id,
    sourceRaceId: row.source_race_id,
    requesterName: row.requester_name,
    requesterEmail: row.requester_email,
    requesterRole: row.requester_role,
    requesterRoleLabel: getCorrectionRequesterRoleLabel(row.requester_role),
    fieldKind: row.field_kind,
    fieldKindLabel: getCorrectionFieldKindLabel(row.field_kind),
    currentValue: row.current_value,
    suggestedValue: row.suggested_value,
    message: row.message,
    sourcePath: row.source_path,
    status: row.status,
    statusLabel: getCorrectionStatusLabel(row.status),
    adminNote: row.admin_note,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    raceTitle: race?.title ?? row.source_race_id,
    raceRegion: race?.region ?? null,
    raceEventDateLabel: race?.event_date_label ?? null,
  };
}

export async function createRaceCorrectionRequest(input: {
  raceId: string;
  sourceRaceId: string;
  requesterName: string;
  requesterEmail: string;
  requesterRole: string;
  fieldKind: string;
  currentValue?: string | null;
  suggestedValue: string;
  message?: string | null;
  sourcePath: string;
}) {
  const admin = getSupabaseAdminClient() as unknown as CorrectionInsertClient;
  const { error } = await admin.from('race_correction_requests').insert({
    race_id: input.raceId,
    source_race_id: input.sourceRaceId,
    requester_name: input.requesterName,
    requester_email: input.requesterEmail,
    requester_role: input.requesterRole,
    field_kind: input.fieldKind,
    current_value: input.currentValue ?? null,
    suggested_value: input.suggestedValue,
    message: input.message ?? null,
    source_path: input.sourcePath,
  });

  if (error) {
    throw new Error(`수정 요청 저장 실패: ${error.message}`);
  }
}

export async function listRaceCorrectionRequestsForOps(status: CorrectionStatus | 'all' = 'new') {
  await requireModerator('/ops/corrections');
  const supabase = await getSupabaseServerClient();

  let query = supabase
    .from('race_correction_requests')
    .select(
      'id, race_id, source_race_id, requester_name, requester_email, requester_role, field_kind, current_value, suggested_value, message, source_path, status, admin_note, reviewed_at, created_at, race:race_id (title, source_race_id, region, event_date_label)',
    )
    .order('created_at', { ascending: false })
    .limit(100);

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`수정 요청 조회 실패: ${error.message}`);
  }

  return {
    statuses: correctionStatuses.map((value) => ({ value, label: getCorrectionStatusLabel(value) })),
    items: ((data ?? []) as unknown as RawCorrectionRow[]).map(mapCorrection),
  };
}

export async function updateRaceCorrectionRequest(input: {
  id: string;
  status: string;
  adminNote: string;
}) {
  const viewer = await requireModerator('/ops/corrections');
  const supabase = await getSupabaseServerClient();
  const status = input.status.trim();
  const adminNote = input.adminNote.trim().slice(0, 1200);

  if (!isCorrectionStatus(status)) {
    throw new Error('처리 상태를 다시 선택해 주세요.');
  }

  const { error } = await supabase
    .from('race_correction_requests')
    .update({
      status,
      admin_note: adminNote || null,
      reviewed_by_user_id: viewer.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', input.id);

  if (error) {
    throw new Error(`수정 요청 처리 실패: ${error.message}`);
  }

  const { error: auditError } = await supabase.from('admin_audit_logs').insert({
    actor_user_id: viewer.id,
    target_table: 'race_correction_requests',
    target_id: input.id,
    action: 'update_status',
    details: {
      status,
      hasAdminNote: Boolean(adminNote),
    },
  });

  if (auditError) {
    throw new Error(`관리자 로그 기록 실패: ${auditError.message}`);
  }
}
