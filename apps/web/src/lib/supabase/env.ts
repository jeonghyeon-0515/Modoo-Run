function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} 환경변수가 설정되지 않았습니다.`);
  }

  return value;
}

export const publicEnv = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
};

export function hasSupabasePublicEnv() {
  return Boolean(publicEnv.url && publicEnv.anonKey);
}

export function getSupabaseServiceRoleKey() {
  return requireEnv('SUPABASE_SERVICE_ROLE_KEY');
}

export function getRaceSyncSharedSecret() {
  return requireEnv('RACE_SYNC_SHARED_SECRET');
}
