import { getSupabaseAdminClient } from '@/lib/supabase/admin';

const DEMO_USER_EMAIL = 'demo@modoo.run';
const DEMO_USER_PASSWORD = 'ModooRun!2026';
const DEMO_USER_NAME = '데모 러너';

let cachedUserId: string | null = null;

async function findDemoUserId() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin: any = getSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });

  if (error) {
    throw new Error(`데모 사용자 조회 실패: ${error.message}`);
  }

  const foundUser = (data?.users ?? []).find((user: { email?: string }) => user.email === DEMO_USER_EMAIL);
  return foundUser?.id ?? null;
}

async function createDemoUser() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin: any = getSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: DEMO_USER_EMAIL,
    password: DEMO_USER_PASSWORD,
    email_confirm: true,
    user_metadata: {
      display_name: DEMO_USER_NAME,
    },
  });

  if (error || !data.user) {
    throw new Error(`데모 사용자 생성 실패: ${error?.message ?? 'unknown'}`);
  }

  return data.user.id as string;
}

async function upsertDemoProfile(userId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin: any = getSupabaseAdminClient();
  const { error } = await admin.from('profiles').upsert(
    {
      id: userId,
      display_name: DEMO_USER_NAME,
      bio: '개발 및 검증을 위한 기본 데모 사용자입니다.',
    },
    { onConflict: 'id' },
  );

  if (error) {
    throw new Error(`데모 프로필 생성 실패: ${error.message}`);
  }
}

export async function getOrCreateDemoUserId() {
  if (cachedUserId) {
    return cachedUserId;
  }

  let userId = await findDemoUserId();

  if (!userId) {
    userId = await createDemoUser();
  }

  await upsertDemoProfile(userId);
  cachedUserId = userId;
  return userId;
}
