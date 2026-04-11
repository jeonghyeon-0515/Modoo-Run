import 'server-only';

import { getOptionalViewer, requireModerator } from '@/lib/auth/session';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import {
  getPartnerClickTargetLabel,
  getPartnerInquiryTypeLabel,
  type PartnerClickTarget,
  type PartnerInquiryType,
} from './utils';

type PartnerLeadsInsertClient = {
  from(table: 'partner_leads'): {
    insert(values: Record<string, string | null>): Promise<{ error: { message: string } | null }>;
  };
  from(table: 'partner_click_events'): {
    insert(values: Record<string, string | null>): Promise<{ error: { message: string } | null }>;
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

type RawPartnerClickRow = {
  target_kind: PartnerClickTarget;
  source_path: string;
  viewer_role: string;
  created_at: string;
};

function getSinceIso(days: number) {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - days);
  return since.toISOString();
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

export async function getPartnerDashboard(days = 7) {
  await requireModerator('/ops/outbound-clicks');

  const supabase = await getSupabaseServerClient();
  const sinceIso = getSinceIso(days);

  const [{ data: leads, error: leadsError }, { data: clicks, error: clicksError }] = await Promise.all([
    supabase
      .from('partner_leads')
      .select('id, name, email, organization_name, inquiry_type, message, source_path, status, created_at')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('partner_click_events')
      .select('target_kind, source_path, viewer_role, created_at')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  if (leadsError) {
    throw new Error(`파트너 문의 조회 실패: ${leadsError.message}`);
  }

  if (clicksError) {
    throw new Error(`파트너 클릭 조회 실패: ${clicksError.message}`);
  }

  const clickCounts = new Map<string, number>();
  (clicks ?? []).forEach((item: RawPartnerClickRow) => {
    clickCounts.set(item.target_kind, (clickCounts.get(item.target_kind) ?? 0) + 1);
  });

  const leadCounts = new Map<string, number>();
  (leads ?? []).forEach((item: RawPartnerLeadRow) => {
    leadCounts.set(item.inquiry_type, (leadCounts.get(item.inquiry_type) ?? 0) + 1);
  });

  return {
    totalLeadCount: (leads ?? []).length,
    totalClickCount: (clicks ?? []).length,
    clickSummaries: [...clickCounts.entries()].map(([targetKind, count]) => ({
      targetKind,
      label: getPartnerClickTargetLabel(targetKind),
      count,
    })),
    leadSummaries: [...leadCounts.entries()].map(([inquiryType, count]) => ({
      inquiryType,
      label: getPartnerInquiryTypeLabel(inquiryType),
      count,
    })),
    recentLeads: (leads ?? []) as RawPartnerLeadRow[],
  };
}
