import { NextRequest, NextResponse } from 'next/server';
import { isAuthorizedInternalRequest } from '@/lib/internal/request-auth';
import { setRaceSourceDisabled } from '@/lib/races/sync';
import { getRaceSyncSecrets } from '@/lib/supabase/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAuthorized(request: NextRequest) {
  return isAuthorizedInternalRequest({
    authorizationHeader: request.headers.get('authorization'),
    sharedSecretHeader: request.headers.get('x-race-sync-secret'),
    allowedSecrets: getRaceSyncSecrets(),
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sourceRaceId: string }> },
) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { sourceRaceId } = await params;
  let disabled = true;

  try {
    const body = (await request.json()) as { disabled?: boolean };
    if (typeof body.disabled === 'boolean') {
      disabled = body.disabled;
    }
  } catch {
    disabled = true;
  }

  try {
    const result = await setRaceSourceDisabled(sourceRaceId, disabled);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        message: 'source 상태 변경에 실패했습니다.',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 400 },
    );
  }
}
