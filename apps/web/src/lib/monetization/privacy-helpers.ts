import { createHmac } from 'node:crypto';

export function hashPartnerLeadAuditIdentifierWithSecret(
  value: string | null | undefined,
  secret: string,
) {
  const normalized = String(value ?? '').trim();
  if (!normalized) return null;

  return createHmac('sha256', secret).update(normalized.toLowerCase()).digest('hex').slice(0, 24);
}
