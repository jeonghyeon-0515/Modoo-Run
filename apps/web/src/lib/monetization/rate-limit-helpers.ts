import { createHash } from 'node:crypto';

export type HeaderSource = {
  get(name: string): string | null;
};

export type RateLimitTransaction = {
  incr(key: string): RateLimitTransaction;
  expire(key: string, seconds: number, option?: 'NX' | 'nx' | 'XX' | 'xx' | 'GT' | 'gt' | 'LT' | 'lt'): RateLimitTransaction;
  ttl(key: string): RateLimitTransaction;
  exec<T extends unknown[]>(): Promise<T>;
};

export type RateLimitStore = {
  multi(): RateLimitTransaction;
};

type RateLimitRule = {
  key: string;
  limit: number;
  windowSeconds: number;
  scope: 'ip' | 'email';
};

export type PartnerLeadRateLimitResult =
  | {
      allowed: true;
    }
  | {
      allowed: false;
      retryAfterSeconds: number;
      scope: 'ip' | 'email';
      limit: number;
      windowSeconds: number;
    };

const PARTNER_LEAD_RATE_LIMIT_PREFIX = 'rate-limit:partner-leads:v1';
const PARTNER_LEAD_IP_LIMIT = 5;
const PARTNER_LEAD_IP_WINDOW_SECONDS = 15 * 60;
const PARTNER_LEAD_EMAIL_LIMIT = 3;
const PARTNER_LEAD_EMAIL_WINDOW_SECONDS = 6 * 60 * 60;

function hashIdentifier(value: string) {
  return createHash('sha256').update(value).digest('hex').slice(0, 24);
}

export function extractClientIp(headers: HeaderSource) {
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstHop = forwardedFor
      .split(',')
      .map((item) => item.trim())
      .find(Boolean);

    if (firstHop) {
      return firstHop;
    }
  }

  const realIp = headers.get('x-real-ip')?.trim();
  return realIp || null;
}

function buildPartnerLeadRateLimitRules(input: { email: string; ip: string | null }) {
  const rules: RateLimitRule[] = [];

  if (input.ip) {
    rules.push({
      key: `${PARTNER_LEAD_RATE_LIMIT_PREFIX}:ip:${hashIdentifier(input.ip)}`,
      limit: PARTNER_LEAD_IP_LIMIT,
      windowSeconds: PARTNER_LEAD_IP_WINDOW_SECONDS,
      scope: 'ip',
    });
  }

  rules.push({
    key: `${PARTNER_LEAD_RATE_LIMIT_PREFIX}:email:${hashIdentifier(input.email.toLowerCase())}`,
    limit: PARTNER_LEAD_EMAIL_LIMIT,
    windowSeconds: PARTNER_LEAD_EMAIL_WINDOW_SECONDS,
    scope: 'email',
  });

  return rules;
}

export function formatRetryAfterSeconds(seconds: number) {
  const normalizedSeconds = Math.max(1, Math.ceil(seconds));

  if (normalizedSeconds < 60) {
    return `약 ${normalizedSeconds}초`;
  }

  const minutes = Math.ceil(normalizedSeconds / 60);
  if (minutes < 60) {
    return `약 ${minutes}분`;
  }

  const hours = Math.ceil(minutes / 60);
  if (hours < 24) {
    return `약 ${hours}시간`;
  }

  const days = Math.ceil(hours / 24);
  return `약 ${days}일`;
}

export function getPartnerLeadRateLimitMessage(retryAfterSeconds: number) {
  return `짧은 시간에 문의를 여러 번 보내셨어요. ${formatRetryAfterSeconds(retryAfterSeconds)} 후 다시 시도해 주세요.`;
}

export async function consumeRateLimitRule(store: RateLimitStore, rule: RateLimitRule): Promise<PartnerLeadRateLimitResult> {
  const [count, , ttl] = await store
    .multi()
    .incr(rule.key)
    .expire(rule.key, rule.windowSeconds, 'NX')
    .ttl(rule.key)
    .exec<[number, 0 | 1, number]>();

  const retryAfterSeconds = ttl > 0 ? ttl : rule.windowSeconds;

  if (count > rule.limit) {
    return {
      allowed: false,
      retryAfterSeconds,
      scope: rule.scope,
      limit: rule.limit,
      windowSeconds: rule.windowSeconds,
    };
  }

  return { allowed: true };
}

export async function enforcePartnerLeadRateLimitWithStore(
  store: RateLimitStore,
  input: { email: string; ip: string | null },
): Promise<PartnerLeadRateLimitResult> {
  const rules = buildPartnerLeadRateLimitRules(input);

  for (const rule of rules) {
    const result = await consumeRateLimitRule(store, rule);
    if (!result.allowed) {
      return result;
    }
  }

  return { allowed: true };
}
