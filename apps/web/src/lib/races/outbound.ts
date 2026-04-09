import type { RaceDetailItem } from './types';

export const raceOutboundTargets = [
  'apply',
  'source_detail',
  'homepage',
  'map',
  'calendar_google',
  'calendar_ics',
] as const;

export type RaceOutboundTarget = (typeof raceOutboundTargets)[number];

const DEFAULT_SITE_URL = 'https://modoo-run.vercel.app';

function buildAbsoluteUrl(pathname = '/') {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : null,
    DEFAULT_SITE_URL,
  ];
  const base = (candidates.find((value) => typeof value === 'string' && value.trim()) as string).replace(/\/$/, '');
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${base}${normalized}`;
}

type RaceOutboundInput = Pick<
  RaceDetailItem,
  | 'sourceRaceId'
  | 'title'
  | 'summary'
  | 'description'
  | 'region'
  | 'location'
  | 'organizer'
  | 'eventDate'
  | 'eventDateLabel'
  | 'registrationPeriodLabel'
  | 'homepageUrl'
  | 'sourceDetailUrl'
>;

function normalizeExternalUrl(url?: string | null) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

function addDays(date: string, days: number) {
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day + days));
  return parsed.toISOString().slice(0, 10);
}

function formatCalendarDate(date: string) {
  return date.replaceAll('-', '');
}

function escapeIcsText(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function toCompactTimestamp(input: Date) {
  return input.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function buildMapQuery(input: { title: string; region?: string | null; location?: string | null }) {
  return [input.region, input.location, input.title].filter(Boolean).join(' ');
}

function buildCalendarDetails(race: RaceOutboundInput, detailUrl: string) {
  return [
    race.summary ?? race.description ?? null,
    race.registrationPeriodLabel ? `접수기간: ${race.registrationPeriodLabel}` : null,
    race.organizer ? `주최: ${race.organizer}` : null,
    race.sourceDetailUrl ? `주최 측 안내: ${race.sourceDetailUrl}` : null,
    race.homepageUrl ? `공식 홈페이지: ${race.homepageUrl}` : null,
    `상세 페이지: ${detailUrl}`,
  ]
    .filter(Boolean)
    .join('\n\n');
}

export function isRaceOutboundTarget(value: string): value is RaceOutboundTarget {
  return (raceOutboundTargets as readonly string[]).includes(value);
}

export function getRacePrimaryApplyUrl(race: Pick<RaceOutboundInput, 'homepageUrl' | 'sourceDetailUrl'>) {
  return normalizeExternalUrl(race.homepageUrl) ?? normalizeExternalUrl(race.sourceDetailUrl);
}

export function getRaceMapLinkUrl(
  race: Pick<RaceOutboundInput, 'title' | 'region' | 'location'>,
) {
  const mapQuery = buildMapQuery(race);
  if (!mapQuery) {
    return null;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;
}

export function getRaceMapEmbedUrl(
  race: Pick<RaceOutboundInput, 'title' | 'region' | 'location'>,
) {
  const mapQuery = buildMapQuery(race);
  if (!mapQuery) {
    return null;
  }

  return `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=17&output=embed`;
}

export function getRaceCalendarDownloadPath(sourceRaceId: string) {
  return `/races/${encodeURIComponent(sourceRaceId)}/calendar.ics`;
}

export function getRaceOutboundPath(sourceRaceId: string, target: Exclude<RaceOutboundTarget, 'calendar_ics'>) {
  return `/races/${encodeURIComponent(sourceRaceId)}/out/${target}`;
}

export function getRaceGoogleCalendarUrl(race: RaceOutboundInput) {
  if (!race.eventDate) {
    return null;
  }

  const detailUrl = buildAbsoluteUrl(`/races/${race.sourceRaceId}`);
  const start = formatCalendarDate(race.eventDate);
  const end = formatCalendarDate(addDays(race.eventDate, 1));
  const details = buildCalendarDetails(race, detailUrl);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(race.title)}&dates=${start}/${end}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(race.location ?? race.region ?? race.title)}`;
}

export function resolveRaceOutboundUrl(
  race: RaceOutboundInput,
  target: Exclude<RaceOutboundTarget, 'calendar_ics'>,
) {
  switch (target) {
    case 'apply':
      return getRacePrimaryApplyUrl(race);
    case 'source_detail':
      return normalizeExternalUrl(race.sourceDetailUrl);
    case 'homepage':
      return normalizeExternalUrl(race.homepageUrl);
    case 'map':
      return getRaceMapLinkUrl(race);
    case 'calendar_google':
      return getRaceGoogleCalendarUrl(race);
    default:
      return null;
  }
}

export function buildRaceCalendarIcs(race: RaceOutboundInput, now = new Date()) {
  if (!race.eventDate) {
    return null;
  }

  const detailUrl = buildAbsoluteUrl(`/races/${race.sourceRaceId}`);
  const summary = escapeIcsText(race.title);
  const description = escapeIcsText(buildCalendarDetails(race, detailUrl));
  const location = escapeIcsText(race.location ?? race.region ?? race.title);
  const startDate = formatCalendarDate(race.eventDate);
  const endDate = formatCalendarDate(addDays(race.eventDate, 1));
  const dtstamp = toCompactTimestamp(now);
  const uid = `${race.sourceRaceId}@modoo-run.vercel.app`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Modoo Run//Race Calendar//KO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    `DTSTART;VALUE=DATE:${startDate}`,
    `DTEND;VALUE=DATE:${endDate}`,
    `URL:${detailUrl}`,
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}
