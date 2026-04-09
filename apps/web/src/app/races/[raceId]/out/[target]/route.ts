import { NextResponse } from 'next/server';
import { getOptionalViewer } from '@/lib/auth/session';
import { getRaceBySourceRaceId } from '@/lib/races/repository';
import {
  isRaceOutboundTarget,
  resolveRaceOutboundUrl,
} from '@/lib/races/outbound';
import { recordRaceOutboundClick } from '@/lib/races/outbound-events';

type Params = Promise<{ raceId: string; target: string }>;

export async function GET(request: Request, { params }: { params: Params }) {
  const { raceId, target } = await params;
  const detailUrl = new URL(`/races/${encodeURIComponent(raceId)}`, request.url);

  if (!isRaceOutboundTarget(target) || target === 'calendar_ics') {
    return NextResponse.redirect(detailUrl, 307);
  }

  const race = await getRaceBySourceRaceId(raceId);
  if (!race) {
    return NextResponse.redirect(new URL('/races', request.url), 307);
  }

  const destination = resolveRaceOutboundUrl(race, target);
  if (!destination) {
    return NextResponse.redirect(detailUrl, 307);
  }

  try {
    const viewer = await getOptionalViewer();
    await recordRaceOutboundClick({
      raceId: race.id,
      sourceRaceId: race.sourceRaceId,
      targetKind: target,
      targetUrl: destination,
      sourcePath: `/races/${race.sourceRaceId}`,
      viewerId: viewer?.id ?? null,
      viewerRole: viewer?.role ?? 'anon',
      referer: request.headers.get('referer'),
      userAgent: request.headers.get('user-agent'),
    });
  } catch (error) {
    console.error(error);
  }

  return NextResponse.redirect(destination, 307);
}

