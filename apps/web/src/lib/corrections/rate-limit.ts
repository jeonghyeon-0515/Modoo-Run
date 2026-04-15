import { getUpstashRedisClient } from '@/lib/cache/upstash';
import { extractClientIp, formatRetryAfterSeconds, type HeaderSource } from '@/lib/monetization/rate-limit-helpers';
import { createHash } from 'node:crypto';

type RateLimitStore = {
  multi(): RateLimitTransaction;
};

type RateLimitTransaction = {
    incr(key: string): RateLimitTransaction;
    expire(key: string, seconds: number, option?: 'NX'): RateLimitTransaction;
    ttl(key: string): RateLimitTransaction;
    exec<T extends unknown[]>(): Promise<T>;
};

type CorrectionRateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number; scope: 'ip' | 'email' };

const RATE_LIMIT_PREFIX = 'rate-limit:race-corrections:v1';
const IP_LIMIT = 5;
const IP_WINDOW_SECONDS = 15 * 60;
const EMAIL_LIMIT = 3;
const EMAIL_WINDOW_SECONDS = 6 * 60 * 60;

function hashIdentifier(value: string) {
  return createHash('sha256').update(value).digest('hex').slice(0, 24);
}

async function consumeRule(
  store: RateLimitStore,
  rule: { key: string; limit: number; windowSeconds: number; scope: 'ip' | 'email' },
): Promise<CorrectionRateLimitResult> {
  const [count, , ttl] = await store
    .multi()
    .incr(rule.key)
    .expire(rule.key, rule.windowSeconds, 'NX')
    .ttl(rule.key)
    .exec<[number, 0 | 1, number]>();

  if (count > rule.limit) {
    return {
      allowed: false,
      retryAfterSeconds: ttl > 0 ? ttl : rule.windowSeconds,
      scope: rule.scope,
    };
  }

  return { allowed: true };
}

export function getRaceCorrectionRateLimitMessage(retryAfterSeconds: number) {
  return `짧은 시간에 수정 요청을 여러 번 보내셨어요. ${formatRetryAfterSeconds(retryAfterSeconds)} 후 다시 시도해 주세요.`;
}

export async function enforceRaceCorrectionRateLimit(input: {
  email: string;
  headers: HeaderSource;
}): Promise<CorrectionRateLimitResult> {
  const redis = getUpstashRedisClient();
  if (!redis) {
    return { allowed: true };
  }

  const rules = [
    extractClientIp(input.headers)
      ? {
          key: `${RATE_LIMIT_PREFIX}:ip:${hashIdentifier(extractClientIp(input.headers) as string)}`,
          limit: IP_LIMIT,
          windowSeconds: IP_WINDOW_SECONDS,
          scope: 'ip' as const,
        }
      : null,
    {
      key: `${RATE_LIMIT_PREFIX}:email:${hashIdentifier(input.email.toLowerCase())}`,
      limit: EMAIL_LIMIT,
      windowSeconds: EMAIL_WINDOW_SECONDS,
      scope: 'email' as const,
    },
  ].filter(Boolean) as Array<{ key: string; limit: number; windowSeconds: number; scope: 'ip' | 'email' }>;

  try {
    for (const rule of rules) {
      const result = await consumeRule(redis as unknown as RateLimitStore, rule);
      if (!result.allowed) {
        return result;
      }
    }
  } catch (error) {
    console.error('race correction rate limit check failed', error);
  }

  return { allowed: true };
}
