import { getOptionalViewer } from '@/lib/auth/session';
import { getRaceBySourceRaceId } from '@/lib/races/repository';
import { recordRaceDetailView } from '@/lib/races/view-events';

type Params = Promise<{ raceId: string }>;

function isNoiseView(headers: Headers) {
  const userAgent = headers.get('user-agent')?.toLowerCase() ?? '';
  const purpose = headers.get('purpose')?.toLowerCase() ?? '';
  const prefetch = headers.get('next-router-prefetch')?.toLowerCase() ?? '';

  if (purpose.includes('prefetch') || prefetch === '1') {
    return true;
  }

  return /(bot|crawler|spider|slurp|preview)/i.test(userAgent);
}

export async function POST(request: Request, { params }: { params: Params }) {
  const { raceId } = await params;

  if (isNoiseView(request.headers)) {
    return Response.json({ ignored: true });
  }

  const race = await getRaceBySourceRaceId(raceId);
  if (!race) {
    return Response.json({ error: 'race_not_found' }, { status: 404 });
  }

  try {
    const viewer = await getOptionalViewer();
    await recordRaceDetailView({
      raceId: race.id,
      sourceRaceId: race.sourceRaceId,
      sourcePath: `/races/${race.sourceRaceId}`,
      viewerId: viewer?.id ?? null,
      viewerRole: viewer?.role ?? 'anon',
      referer: request.headers.get('referer'),
      userAgent: request.headers.get('user-agent'),
    });
  } catch (error) {
    console.error(error);
  }

  return Response.json({ ok: true });
}

