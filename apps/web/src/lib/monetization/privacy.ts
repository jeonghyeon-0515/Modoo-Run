import 'server-only';

import { getSupabaseServiceRoleKey } from '@/lib/supabase/env';
import { hashPartnerLeadAuditIdentifierWithSecret } from './privacy-helpers';

function getPartnerLeadAuditHashSecret() {
  const customSecret = process.env.PARTNER_GUARD_HASH_SECRET?.trim();
  return customSecret || getSupabaseServiceRoleKey();
}

export function hashPartnerLeadAuditIdentifier(value: string | null | undefined) {
  return hashPartnerLeadAuditIdentifierWithSecret(value, getPartnerLeadAuditHashSecret());
}
