import { NextRequest, NextResponse } from 'next/server';
import { getRaceSyncSharedSecret } from '@/lib/supabase/env';
import { runRoadrunSync } from '@/lib/races/sync';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SyncRequestBody = {
  years?: number[];
  sourceRaceIds?: string[];
  detailLimit?: number;
  triggerType?: 'cron' | 'manual' | 'backfill';
};

function isAuthorized(request: NextRequest) {
  const headerSecret = request.headers.get('x-race-sync-secret');
  return headerSecret === getRaceSyncSharedSecret();
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  let body: SyncRequestBody = {};
  try {
    body = (await request.json()) as SyncRequestBody;
  } catch {
    body = {};
  }

  try {
    const result = await runRoadrunSync({
      years: body.years,
      sourceRaceIds: body.sourceRaceIds,
      detailLimit: body.detailLimit,
      triggerType: body.triggerType,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        message: '대회 동기화에 실패했습니다.',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
