import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { normalizeNextPath } from '@/lib/auth/session';
import { resolveAuthMetadataDisplayName, resolveDisplayName } from '@/lib/auth/utils';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const providerError = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');
  const nextPath = normalizeNextPath(requestUrl.searchParams.get('next') ?? '/');

  if (providerError) {
    const message = errorDescription
      ? `소셜 로그인에 실패했습니다. ${errorDescription} (${providerError})`
      : `소셜 로그인에 실패했습니다. (${providerError})`;

    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent(nextPath)}&message=${encodeURIComponent(message)}`, request.url),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(
        `/login?next=${encodeURIComponent(nextPath)}&message=${encodeURIComponent('소셜 로그인 코드가 없습니다.')}`,
        request.url,
      ),
    );
  }

  const response = NextResponse.redirect(new URL(nextPath, request.url));

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.headers.get('cookie')
          ? request.headers
              .get('cookie')!
              .split(';')
              .map((cookie) => {
                const [name, ...rest] = cookie.trim().split('=');
                return { name, value: rest.join('=') };
              })
          : [];
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/login?next=${encodeURIComponent(nextPath)}&message=${encodeURIComponent('소셜 로그인에 실패했습니다. 설정을 다시 확인해 주세요.')}`,
        request.url,
      ),
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const displayName = resolveDisplayName({
      email: user.email,
      profileName: resolveAuthMetadataDisplayName(user.user_metadata),
    });

    const { error: profileError } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        display_name: displayName,
      },
      { onConflict: 'id' },
    );

    if (profileError) {
      return NextResponse.redirect(
        new URL(
          `/login?next=${encodeURIComponent(nextPath)}&message=${encodeURIComponent(`프로필 저장 실패: ${profileError.message}`)}`,
          request.url,
        ),
      );
    }
  }

  revalidatePath('/', 'layout');

  return response;
}
