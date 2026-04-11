import 'server-only';

import { getOptionalViewer, requireModerator } from '@/lib/auth/session';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import {
  partnerClickTargets,
  partnerInquiryTypes,
  partnerLeadGuardScopes,
  getPartnerClickTargetLabel,
  getPartnerGuardScopeLabel,
  getPartnerInquiryTypeLabel,
  type PartnerClickTarget,
  type PartnerLeadGuardScope,
  type PartnerInquiryType,
} from './utils';

type PartnerLeadsInsertClient = {
  from(table: 'partner_leads'): {
    insert(values: Record<string, string | null>): Promise<{ error: { message: string } | null }>;
  };
  from(table: 'partner_click_events'): {
    insert(values: Record<string, string | null>): Promise<{ error: { message: string } | null }>;
  };
  from(table: 'partner_lead_guard_events'): {
    insert(values: Record<string, string | number | null>): Promise<{ error: { message: string } | null }>;
  };
};

type RawPartnerLeadRow = {
  id: string;
  name: string;
  email: string;
  organization_name: string;
  inquiry_type: PartnerInquiryType;
  message: string;
  source_path: string | null;
  status: 'new' | 'contacted' | 'closed';
  created_at: string;
};

type RawPartnerLeadGuardRow = {
  id: string;
  blocked_scope: PartnerLeadGuardScope;
  retry_after_seconds: number;
  source_path: string | null;
  email_hash: string;
  ip_hash: string | null;
  created_at: string;
};

type CountResponse = {
  count: number | null;
  error: { message: string } | null;
};

function getSinceIso(days: number) {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);
  return since.toISOString();
}

function normalizeCount(response: CountResponse, label: string) {
  if (response.error) {
    throw new Error(`${label} 조회 실패: ${response.error.message}`);
  }

  return response.count ?? 0;
}

export async function createPartnerLead(input: {
  name: string;
  email: string;
  organizationName: string;
  inquiryType: PartnerInquiryType;
  message: string;
  sourcePath?: string | null;
}) {
  const admin = getSupabaseAdminClient() as unknown as PartnerLeadsInsertClient;
  const { error } = await admin.from('partner_leads').insert({
    name: input.name,
    email: input.email,
    organization_name: input.organizationName,
    inquiry_type: input.inquiryType,
    message: input.message,
    source_path: input.sourcePath ?? null,
  });

  if (error) {
    throw new Error(`문의 저장 실패: ${error.message}`);
  }
}

export async function recordPartnerClick(input: {
  targetKind: PartnerClickTarget;
  targetUrl: string;
  sourcePath: string;
  referer?: string | null;
  userAgent?: string | null;
}) {
  const viewer = await getOptionalViewer();
  const admin = getSupabaseAdminClient() as unknown as PartnerLeadsInsertClient;
  const { error } = await admin.from('partner_click_events').insert({
    user_id: viewer?.id ?? null,
    target_kind: input.targetKind,
    target_url: input.targetUrl,
    source_path: input.sourcePath,
    viewer_role: viewer?.role ?? 'anon',
    referer: input.referer ?? null,
    user_agent: input.userAgent ?? null,
  });

  if (error) {
    throw new Error(`파트너 클릭 기록 실패: ${error.message}`);
  }
}

export async function recordPartnerLeadGuardEvent(input: {
  blockedScope: PartnerLeadGuardScope;
  retryAfterSeconds: number;
  sourcePath?: string | null;
  emailHash: string;
  ipHash?: string | null;
}) {
  const admin = getSupabaseAdminClient() as unknown as PartnerLeadsInsertClient;
  const { error } = await admin.from('partner_lead_guard_events').insert({
    guard_type: 'rate_limit',
    blocked_scope: input.blockedScope,
    retry_after_seconds: input.retryAfterSeconds,
    source_path: input.sourcePath ?? null,
    email_hash: input.emailHash,
    ip_hash: input.ipHash ?? null,
  });

  if (error) {
    throw new Error(`문의 차단 로그 저장 실패: ${error.message}`);
  }
}

export async function getPartnerDashboard(days = 7) {
  await requireModerator('/ops/outbound-clicks');

  const supabase = await getSupabaseServerClient();
  const sinceIso = getSinceIso(days);

  const [
    { data: leads, error: leadsError },
    { data: guardEvents, error: guardEventsError },
    totalLeadCountResponse,
    totalClickCountResponse,
    totalGuardCountResponse,
    ...summaryResponses
  ] = await Promise.all([
    supabase
      .from('partner_leads')
      .select('id, name, email, organization_name, inquiry_type, message, source_path, status, created_at')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('partner_lead_guard_events')
      .select('id, blocked_scope, retry_after_seconds, source_path, email_hash, ip_hash, created_at')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('partner_leads').select('id', { count: 'exact', head: true }).gte('created_at', sinceIso),
    supabase.from('partner_click_events').select('id', { count: 'exact', head: true }).gte('created_at', sinceIso),
    supabase.from('partner_lead_guard_events').select('id', { count: 'exact', head: true }).gte('created_at', sinceIso),
    ...partnerClickTargets.map((targetKind) =>
      supabase
        .from('partner_click_events')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', sinceIso)
        .eq('target_kind', targetKind),
    ),
    ...partnerInquiryTypes.map((inquiryType) =>
      supabase
        .from('partner_leads')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', sinceIso)
        .eq('inquiry_type', inquiryType),
    ),
    ...partnerLeadGuardScopes.map((blockedScope) =>
      supabase
        .from('partner_lead_guard_events')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', sinceIso)
        .eq('blocked_scope', blockedScope),
    ),
  ]);

  if (leadsError) {
    throw new Error(`파트너 문의 조회 실패: ${leadsError.message}`);
  }

  if (guardEventsError) {
    throw new Error(`문의 차단 로그 조회 실패: ${guardEventsError.message}`);
  }

  const clickSummaryResponses = summaryResponses.slice(0, partnerClickTargets.length) as CountResponse[];
  const leadSummaryResponses = summaryResponses.slice(
    partnerClickTargets.length,
    partnerClickTargets.length + partnerInquiryTypes.length,
  ) as CountResponse[];
  const guardSummaryResponses = summaryResponses.slice(
    partnerClickTargets.length + partnerInquiryTypes.length,
  ) as CountResponse[];

  return {
    totalLeadCount: normalizeCount(totalLeadCountResponse as CountResponse, '파트너 문의 수'),
    totalClickCount: normalizeCount(totalClickCountResponse as CountResponse, '파트너 클릭 수'),
    totalGuardCount: normalizeCount(totalGuardCountResponse as CountResponse, '파트너 차단 수'),
    clickSummaries: partnerClickTargets
      .map((targetKind, index) => ({
        targetKind,
        label: getPartnerClickTargetLabel(targetKind),
        count: normalizeCount(clickSummaryResponses[index], `파트너 클릭 요약(${targetKind})`),
      }))
      .filter((item) => item.count > 0),
    leadSummaries: partnerInquiryTypes
      .map((inquiryType, index) => ({
        inquiryType,
        label: getPartnerInquiryTypeLabel(inquiryType),
        count: normalizeCount(leadSummaryResponses[index], `파트너 문의 요약(${inquiryType})`),
      }))
      .filter((item) => item.count > 0),
    guardSummaries: partnerLeadGuardScopes
      .map((blockedScope, index) => ({
        blockedScope,
        label: getPartnerGuardScopeLabel(blockedScope),
        count: normalizeCount(guardSummaryResponses[index], `파트너 차단 요약(${blockedScope})`),
      }))
      .filter((item) => item.count > 0),
    recentLeads: (leads ?? []) as RawPartnerLeadRow[],
    recentGuardEvents: (guardEvents ?? []) as RawPartnerLeadGuardRow[],
  };
}
