import type { RaceStatus } from './types';

type RaceStatusInput = {
  eventDate: string | null;
  registrationCloseAt: string | null;
};

type EffectiveRaceStatusInput = RaceStatusInput & {
  registrationStatus: RaceStatus;
};

export function getSeoulTodayDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(now)
    .replace(/\//g, '-');
}

export function inferRegistrationStatus(input: RaceStatusInput, now = new Date()): RaceStatus {
  const today = getSeoulTodayDate(now);

  if (input.eventDate && input.eventDate < today) {
    return 'closed';
  }

  if (input.registrationCloseAt && input.registrationCloseAt < today) {
    return 'closed';
  }

  return 'open';
}

export function getEffectiveRaceStatus(input: EffectiveRaceStatusInput, now = new Date()): RaceStatus {
  if (input.registrationStatus !== 'open') {
    return input.registrationStatus;
  }

  return inferRegistrationStatus(input, now);
}

export function isRaceOpenForDiscovery(input: EffectiveRaceStatusInput, now = new Date()) {
  return getEffectiveRaceStatus(input, now) === 'open';
}
