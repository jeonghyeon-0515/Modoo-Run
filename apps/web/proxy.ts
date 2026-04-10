import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';
import { hasIndexNowKey, getIndexNowKey } from '@/lib/supabase/env';

export async function proxy(request: NextRequest) {
  if (hasIndexNowKey()) {
    const pathname = request.nextUrl.pathname;
    const expected = `/${getIndexNowKey()}.txt`;

    if (pathname === expected) {
      const url = request.nextUrl.clone();
      url.pathname = '/api/indexnow-key';
      return NextResponse.rewrite(url);
    }
  }

  return updateSession(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
