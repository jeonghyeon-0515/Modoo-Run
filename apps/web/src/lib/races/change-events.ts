import { createHash } from 'node:crypto';

export type RaceChangeField =
  | 'title'
  | 'eventDate'
  | 'eventDateLabel'
  | 'region'
  | 'location'
  | 'courseSummary'
  | 'registrationOpenAt'
  | 'registrationCloseAt'
  | 'registrationPeriodLabel'
  | 'registrationStatus'
  | 'homepageUrl';

export type RaceChangeSnapshot = {
  title: string | null;
  eventDate: string | null;
  eventDateLabel: string | null;
  region: string | null;
  location: string | null;
  courseSummary: string | null;
  registrationOpenAt: string | null;
  registrationCloseAt: string | null;
  registrationPeriodLabel: string | null;
  registrationStatus: string | null;
  homepageUrl: string | null;
};

export type RaceChangeSummaryItem = {
  field: RaceChangeField;
  label: string;
  before: string | null;
  after: string | null;
};

export type ImportantRaceChange = {
  changedFields: RaceChangeField[];
  beforePayload: RaceChangeSnapshot;
  afterPayload: RaceChangeSnapshot;
  summaryItems: RaceChangeSummaryItem[];
};

const raceChangeFieldLabels: Record<RaceChangeField, string> = {
  title: '대회명',
  eventDate: '대회 날짜',
  eventDateLabel: '대회 날짜',
  region: '지역',
  location: '장소',
  courseSummary: '코스 정보',
  registrationOpenAt: '접수 시작일',
  registrationCloseAt: '접수 마감일',
  registrationPeriodLabel: '접수 기간',
  registrationStatus: '접수 상태',
  homepageUrl: '공식 홈페이지',
};

const importantFields: RaceChangeField[] = [
  'title',
  'eventDate',
  'eventDateLabel',
  'region',
  'location',
  'courseSummary',
  'registrationOpenAt',
  'registrationCloseAt',
  'registrationPeriodLabel',
  'registrationStatus',
  'homepageUrl',
];

function normalizeValue(value: unknown) {
  const text = String(value ?? '').trim().replace(/\s+/g, ' ');
  return text || null;
}

export function pickRaceChangeSnapshot(input: Partial<RaceChangeSnapshot>) {
  return {
    title: normalizeValue(input.title),
    eventDate: normalizeValue(input.eventDate),
    eventDateLabel: normalizeValue(input.eventDateLabel),
    region: normalizeValue(input.region),
    location: normalizeValue(input.location),
    courseSummary: normalizeValue(input.courseSummary),
    registrationOpenAt: normalizeValue(input.registrationOpenAt),
    registrationCloseAt: normalizeValue(input.registrationCloseAt),
    registrationPeriodLabel: normalizeValue(input.registrationPeriodLabel),
    registrationStatus: normalizeValue(input.registrationStatus),
    homepageUrl: normalizeValue(input.homepageUrl),
  } satisfies RaceChangeSnapshot;
}

export function getRaceChangeFieldLabel(field: RaceChangeField) {
  return raceChangeFieldLabels[field];
}

export function detectImportantRaceChanges(
  previous: RaceChangeSnapshot | null | undefined,
  next: RaceChangeSnapshot,
): ImportantRaceChange | null {
  if (!previous) {
    return null;
  }

  const changedFields = importantFields
    .filter((field) => previous[field] !== next[field])
    .filter((field, _, fields) => !(field === 'eventDate' && fields.includes('eventDateLabel')));
  if (changedFields.length === 0) {
    return null;
  }

  return {
    changedFields,
    beforePayload: previous,
    afterPayload: next,
    summaryItems: changedFields.map((field) => ({
      field,
      label: getRaceChangeFieldLabel(field),
      before: previous[field],
      after: next[field],
    })),
  };
}

export function buildRaceChangeKey(raceId: string, change: ImportantRaceChange) {
  return createHash('sha256')
    .update(
      JSON.stringify({
        raceId,
        changedFields: change.changedFields,
        beforePayload: change.beforePayload,
        afterPayload: change.afterPayload,
      }),
    )
    .digest('hex');
}
