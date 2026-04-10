import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env';

const LOGOUT_MESSAGE = '로그아웃되었습니다.';

function buildLogoutRedirect(request: NextRequest) {
  return new URL(`/login?message=${encodeURIComponent(LOGOUT_MESSAGE)}`, request.url);
}

function clearSupabaseAuthCookies(request: NextRequest, response: NextResponse) {
  request.cookies.getAll().forEach(({ name }) => {
    if (name.startsWith('sb-')) {
      response.cookies.delete(name);
    }
  });
}

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(buildLogoutRedirect(request), { status: 303 });

  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.signOut();
  clearSupabaseAuthCookies(request, response);

  return response;
}
