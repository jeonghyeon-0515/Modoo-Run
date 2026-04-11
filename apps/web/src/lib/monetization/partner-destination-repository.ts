import 'server-only';

import { requireModerator } from '@/lib/auth/session';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import {
  publicPartnerDestinationMetas,
  publicPartnerDestinations,
  type PublicPartnerDestinationKey,
} from './public-catalog';
import { normalizePartnerDestinationUrl } from './partner-destination-helpers';

type RawPartnerDestinationRow = {
  destination_key: PublicPartnerDestinationKey;
  destination_url: string;
  updated_by_user_id: string | null;
  updated_at: string;
};

export async function resolvePartnerDestinationUrl(destinationKey: string) {
  const defaultUrl = publicPartnerDestinations[destinationKey as PublicPartnerDestinationKey] ?? null;
  if (!defaultUrl) return null;

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('partner_destination_settings')
    .select('destination_url')
    .eq('destination_key', destinationKey)
    .maybeSingle();

  if (error) {
    console.error('partner destination lookup failed', error);
    return defaultUrl;
  }

  return (data?.destination_url as string | undefined) ?? defaultUrl;
}

export async function listPartnerDestinationSettingsForOps() {
  await requireModerator('/ops/partners');
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from('partner_destination_settings')
    .select('destination_key, destination_url, updated_by_user_id, updated_at')
    .order('destination_key', { ascending: true });

  if (error) {
    throw new Error(`파트너 링크 설정 조회 실패: ${error.message}`);
  }

  const overrides = new Map(
    ((data ?? []) as RawPartnerDestinationRow[]).map((item) => [item.destination_key, item]),
  );

  return publicPartnerDestinationMetas.map((meta) => {
    const override = overrides.get(meta.key);
    return {
      key: meta.key,
      name: meta.name,
      badge: meta.badge,
      description: meta.description,
      defaultUrl: meta.defaultUrl,
      currentUrl: override?.destination_url ?? meta.defaultUrl,
      hasOverride: Boolean(override),
      updatedAt: override?.updated_at ?? null,
    };
  });
}

export async function savePartnerDestinationSetting(input: {
  destinationKey: PublicPartnerDestinationKey;
  destinationUrl: string;
}) {
  const viewer = await requireModerator('/ops/partners');
  const supabase = await getSupabaseServerClient();
  const destinationUrl = normalizePartnerDestinationUrl(input.destinationUrl);

  const { error } = await supabase.from('partner_destination_settings').upsert(
    {
      destination_key: input.destinationKey,
      destination_url: destinationUrl,
      updated_by_user_id: viewer.id,
    },
    { onConflict: 'destination_key' },
  );

  if (error) {
    throw new Error(`파트너 링크 저장 실패: ${error.message}`);
  }

  const { error: auditError } = await supabase.from('admin_audit_logs').insert({
    actor_user_id: viewer.id,
    target_table: 'partner_destination_settings',
    action: 'upsert',
    details: {
      destinationKey: input.destinationKey,
      destinationUrl,
    },
  });

  if (auditError) {
    throw new Error(`관리자 로그 기록 실패: ${auditError.message}`);
  }
}

export async function resetPartnerDestinationSetting(destinationKey: PublicPartnerDestinationKey) {
  const viewer = await requireModerator('/ops/partners');
  const supabase = await getSupabaseServerClient();

  const { error } = await supabase.from('partner_destination_settings').delete().eq('destination_key', destinationKey);
  if (error) {
    throw new Error(`파트너 링크 초기화 실패: ${error.message}`);
  }

  const { error: auditError } = await supabase.from('admin_audit_logs').insert({
    actor_user_id: viewer.id,
    target_table: 'partner_destination_settings',
    action: 'delete',
    details: {
      destinationKey,
    },
  });

  if (auditError) {
    throw new Error(`관리자 로그 기록 실패: ${auditError.message}`);
  }
}
