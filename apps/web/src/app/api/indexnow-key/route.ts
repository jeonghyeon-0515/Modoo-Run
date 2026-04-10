import { getIndexNowKey } from '@/lib/supabase/env';

export const runtime = 'nodejs';

export function GET() {
  const key = getIndexNowKey();

  return new Response(key, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
