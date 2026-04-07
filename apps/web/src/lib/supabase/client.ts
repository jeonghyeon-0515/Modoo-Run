import { createBrowserClient } from '@supabase/ssr';
import { hasSupabasePublicEnv, publicEnv } from './env';

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!hasSupabasePublicEnv()) {
    throw new Error('Supabase 공개 환경변수가 설정되지 않았습니다.');
  }

  if (!browserClient) {
    browserClient = createBrowserClient(publicEnv.url, publicEnv.anonKey);
  }

  return browserClient;
}
