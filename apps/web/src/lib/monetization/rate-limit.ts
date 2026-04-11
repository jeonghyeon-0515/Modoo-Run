import { getUpstashRedisClient } from '@/lib/cache/upstash';
import {
  type HeaderSource,
  type PartnerLeadRateLimitResult,
  type RateLimitStore,
  enforcePartnerLeadRateLimitWithStore,
  extractClientIp,
} from './rate-limit-helpers';

export { getPartnerLeadRateLimitMessage } from './rate-limit-helpers';

export async function enforcePartnerLeadRateLimit(input: {
  email: string;
  headers: HeaderSource;
}): Promise<PartnerLeadRateLimitResult> {
  const redis = getUpstashRedisClient();
  if (!redis) {
    return { allowed: true };
  }

  try {
    return await enforcePartnerLeadRateLimitWithStore(redis as unknown as RateLimitStore, {
      email: input.email,
      ip: extractClientIp(input.headers),
    });
  } catch (error) {
    console.error('partner lead rate limit check failed', error);
    return { allowed: true };
  }
}
