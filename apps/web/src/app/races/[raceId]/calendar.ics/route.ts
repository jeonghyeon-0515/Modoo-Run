import { getOptionalViewer } from '@/lib/auth/session';
import { getRaceBySourceRaceId } from '@/lib/races/repository';
import { buildRaceCalendarIcs } from '@/lib/races/outbound';
import { recordRaceOutboundClick } from '@/lib/races/outbound-events';

type Params = Promise<{ raceId: string }>;

function buildFileName(title: string) {
  return `${title.replace(/[\\/:*?"<>|]/g, '').trim() || 'modoo-run-race'}.ics`;
}

export async function GET(request: Request, { params }: { params: Params }) {
  const { raceId } = await params;
  const race = await getRaceBySourceRaceId(raceId);

  if (!race) {
    return new Response('대회를 찾을 수 없습니다.', { status: 404 });
  }

  const ics = buildRaceCalendarIcs(race);
  if (!ics) {
    return new Response('캘린더로 내보낼 일정 정보가 부족합니다.', { status: 400 });
  }

  try {
    const viewer = await getOptionalViewer();
    await recordRaceOutboundClick({
      raceId: race.id,
      sourceRaceId: race.sourceRaceId,
      targetKind: 'calendar_ics',
      targetUrl: request.url,
      sourcePath: `/races/${race.sourceRaceId}`,
      viewerId: viewer?.id ?? null,
      viewerRole: viewer?.role ?? 'anon',
      referer: request.headers.get('referer'),
      userAgent: request.headers.get('user-agent'),
    });
  } catch (error) {
    console.error(error);
  }

  const fileName = encodeURIComponent(buildFileName(race.title));

  return new Response(ics, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename*=UTF-8''${fileName}`,
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

