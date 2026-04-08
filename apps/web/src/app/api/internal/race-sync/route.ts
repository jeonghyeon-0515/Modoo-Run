import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedInternalRequest } from '@/lib/internal/request-auth';
import { runRoadrunSync } from '@/lib/races/sync';
import { getRaceSyncSecrets } from '@/lib/supabase/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SyncRequestBody = {
  years?: number[];
  sourceRaceIds?: string[];
  detailLimit?: number;
  triggerType?: 'cron' | 'manual' | 'backfill';
};

function isAuthorized(request: NextRequest) {
  return isAuthorizedInternalRequest({
    authorizationHeader: request.headers.get('authorization'),
    sharedSecretHeader: request.headers.get('x-race-sync-secret'),
    allowedSecrets: getRaceSyncSecrets(),
  });
}

function parseCsvNumbers(value: string | null) {
  if (!value) return undefined;
  const parsed = value
    .split(',')
    .map((entry) => Number(entry.trim()))
    .filter((entry) => Number.isFinite(entry));

  return parsed.length > 0 ? parsed : undefined;
}

function parseCsvStrings(value: string | null) {
  if (!value) return undefined;
  const parsed = value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  return parsed.length > 0 ? parsed : undefined;
}

function parseGetRequest(request: NextRequest): SyncRequestBody {
  const detailLimit = request.nextUrl.searchParams.get('detailLimit');

  return {
    years: parseCsvNumbers(request.nextUrl.searchParams.get('years')),
    sourceRaceIds: parseCsvStrings(request.nextUrl.searchParams.get('sourceRaceIds')),
    detailLimit: detailLimit ? Number(detailLimit) : undefined,
    triggerType: 'cron',
  };
}

async function runSync(body: SyncRequestBody) {
  return runRoadrunSync({
    years: body.years,
    sourceRaceIds: body.sourceRaceIds,
    detailLimit: body.detailLimit,
    triggerType: body.triggerType,
  });
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runSync(parseGetRequest(request));
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
    const result = await runSync(body);

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
