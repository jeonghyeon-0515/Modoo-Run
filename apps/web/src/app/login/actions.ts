'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { normalizeNextPath } from '@/lib/auth/session';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { resolveDisplayName } from '@/lib/auth/utils';
import { buildAbsoluteUrl } from '@/lib/site';

function readRequiredString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? '').trim();
  if (!value) {
    throw new Error(`${key} 값이 비어 있습니다.`);
  }
  return value;
}

function readNextPath(formData: FormData) {
  return normalizeNextPath(String(formData.get('next') ?? '/'));
}

async function upsertProfile(options: { userId: string; email?: string | null; displayName?: string | null }) {
  const supabase = await createSupabaseServerClient();
  const displayName = resolveDisplayName({
    email: options.email ?? null,
    profileName: options.displayName ?? null,
  });

  const { error } = await supabase.from('profiles').upsert(
    {
      id: options.userId,
      display_name: displayName,
    },
    { onConflict: 'id' },
  );

  if (error) {
    throw new Error(`프로필 저장 실패: ${error.message}`);
  }
}

export async function loginAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const email = readRequiredString(formData, 'email');
  const password = readRequiredString(formData, 'password');
  const nextPath = readNextPath(formData);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}&message=${encodeURIComponent(error.message)}`);
  }

  if (data.user) {
    await upsertProfile({
      userId: data.user.id,
      email: data.user.email,
      displayName: typeof data.user.user_metadata?.display_name === 'string' ? data.user.user_metadata.display_name : null,
    });
  }

  revalidatePath('/', 'layout');
  redirect(nextPath);
}

export async function signupAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const email = readRequiredString(formData, 'email');
  const password = readRequiredString(formData, 'password');
  const passwordConfirm = readRequiredString(formData, 'passwordConfirm');
  const displayName = String(formData.get('displayName') ?? '').trim();
  const nextPath = readNextPath(formData);

  if (password !== passwordConfirm) {
    redirect(
      `/signup?next=${encodeURIComponent(nextPath)}&message=${encodeURIComponent('비밀번호 확인이 일치하지 않아요.')}`,
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName || email.split('@')[0],
      },
    },
  });

  if (error) {
    redirect(`/signup?next=${encodeURIComponent(nextPath)}&message=${encodeURIComponent(error.message)}`);
  }

  if (data.session && data.user) {
    await upsertProfile({
      userId: data.user.id,
      email: data.user.email,
      displayName: displayName || null,
    });
    revalidatePath('/', 'layout');
    redirect(nextPath);
  }

  redirect(
    `/signup?next=${encodeURIComponent(nextPath)}&message=${encodeURIComponent(
      '회원가입은 완료됐지만 자동 로그인은 되지 않았습니다. Supabase Confirm Email 설정을 확인해 주세요.',
    )}`,
  );
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function requestPasswordResetAction(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const email = readRequiredString(formData, 'email');
  const redirectTo = buildAbsoluteUrl('/reset-password');

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    redirect(`/forgot-password?message=${encodeURIComponent(error.message)}`);
  }

  redirect(
    `/forgot-password?message=${encodeURIComponent('재설정 메일을 보냈습니다. 받은 편지함과 스팸함을 확인해 주세요.')}`,
  );
}
