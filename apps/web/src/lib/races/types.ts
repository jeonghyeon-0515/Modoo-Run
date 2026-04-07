export type RaceStatus = 'open' | 'closed' | 'unknown';

export type RaceListItem = {
  id: string;
  sourceRaceId: string;
  title: string;
  eventDate: string | null;
  eventDateLabel: string | null;
  weekdayLabel: string | null;
  region: string | null;
  location: string | null;
  courseSummary: string | null;
  organizer: string | null;
  registrationStatus: RaceStatus;
  registrationPeriodLabel: string | null;
  lastSyncedAt: string | null;
};

export type RaceDetailItem = RaceListItem & {
  representativeName: string | null;
  phone: string | null;
  homepageUrl: string | null;
  summary: string | null;
  description: string | null;
  sourceDetailUrl: string | null;
  sourceListUrl: string | null;
  registrationOpenAt: string | null;
  registrationCloseAt: string | null;
};

export type RaceFilters = {
  registrationStatus?: RaceStatus | 'all';
  region?: string;
  month?: string;
  distance?: string;
  limit?: number;
};
