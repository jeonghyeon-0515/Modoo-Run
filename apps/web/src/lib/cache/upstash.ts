import { Redis } from '@upstash/redis';
import {
  getUpstashRedisRestToken,
  getUpstashRedisRestUrl,
  hasUpstashRedisEnv,
} from '../supabase/env';

let redisClient: Redis | null | undefined;

export function getUpstashRedisClient() {
  if (redisClient !== undefined) {
    return redisClient;
  }

  if (!hasUpstashRedisEnv()) {
    redisClient = null;
    return redisClient;
  }

  redisClient = new Redis({
    url: getUpstashRedisRestUrl(),
    token: getUpstashRedisRestToken(),
  });

  return redisClient;
}
