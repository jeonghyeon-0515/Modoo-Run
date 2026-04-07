import { createClient } from '@supabase/supabase-js';
import { getSupabaseServiceRoleKey, hasSupabasePublicEnv, publicEnv } from './env';

let adminClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseAdminClient() {
  if (!hasSupabasePublicEnv()) {
    throw new Error('Supabase URL 환경변수가 설정되지 않았습니다.');
  }

  if (!adminClient) {
    adminClient = createClient(publicEnv.url, getSupabaseServiceRoleKey(), {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}
