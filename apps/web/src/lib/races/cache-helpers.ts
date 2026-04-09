type FilterableRace = {
  eventDate: string | null;
  courseSummary: string | null;
  region: string | null;
  registrationStatus: 'open' | 'closed' | 'unknown';
};

type FilterableRaceFilters = {
  registrationStatus?: 'open' | 'closed' | 'unknown' | 'all';
  region?: string | string[];
  month?: string | string[];
  distance?: string | string[];
  limit?: number;
};

const DEFAULT_RACE_CACHE_TTL_SECONDS = 60 * 60 * 24;

type HashFieldWithTtl<T> = {
  field: string;
  ttlSeconds: number;
  value: T;
};

function normalizeMonthFilter(value?: string | null) {
  if (!value) return null;
  const normalized = value.replace(/월/g, '').trim();
  const month = Number(normalized);
  if (Number.isNaN(month) || month < 1 || month > 12) return null;
  return month;
}

function normalizeFilterValues(value?: string | string[] | null) {
  if (!value) return [] as string[];

  const values = Array.isArray(value) ? value : [value];
  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

function matchesMonthFilter(eventDate: string | null, values?: string | string[]) {
  const months = normalizeFilterValues(values)
    .map((value) => normalizeMonthFilter(value))
    .filter(Boolean) as number[];

  if (months.length === 0) return true;
  if (!eventDate) return false;

  const currentYear = new Date().getFullYear();
  return months.some((month) => {
    const start = `${currentYear}-${String(month).padStart(2, '0')}-01`;
    const endMonth = month === 12 ? 1 : month + 1;
    const endYear = month === 12 ? currentYear + 1 : currentYear;
    const end = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;
    return eventDate >= start && eventDate < end;
  });
}

export function getRaceCacheTtlSeconds(closeAt: string | null, now = new Date()) {
  if (!closeAt) {
    return DEFAULT_RACE_CACHE_TTL_SECONDS;
  }

  const expiresAt = new Date(`${closeAt}T23:59:59+09:00`);
  const ttl = Math.floor((expiresAt.getTime() - now.getTime()) / 1000);
  return ttl > 0 ? ttl : 1;
}

export function applyRaceFilters<T extends FilterableRace>(items: T[], filters: FilterableRaceFilters = {}) {
  const regions = normalizeFilterValues(filters.region);
  const distances = normalizeFilterValues(filters.distance).map((value) => value.toLowerCase());

  let filtered = items.filter((item) => {
    if (
      filters.registrationStatus &&
      filters.registrationStatus !== 'all' &&
      item.registrationStatus !== filters.registrationStatus
    ) {
      return false;
    }

    if (regions.length > 0 && (!item.region || !regions.includes(item.region))) {
      return false;
    }

    if (!matchesMonthFilter(item.eventDate, filters.month)) {
      return false;
    }

    if (
      distances.length > 0 &&
      !distances.some((distance) => (item.courseSummary ?? '').toLowerCase().includes(distance))
    ) {
      return false;
    }

    return true;
  });

  if (filters.limit) {
    filtered = filtered.slice(0, filters.limit);
  }

  return filtered;
}

export function summarizeActiveRaceFilters(filters: FilterableRaceFilters) {
  const regions = normalizeFilterValues(filters.region);
  const months = normalizeFilterValues(filters.month);
  const distances = normalizeFilterValues(filters.distance);

  return [
    ...regions,
    ...months,
    ...distances,
  ];
}

export function groupHashFieldsByTtl<T>(items: HashFieldWithTtl<T>[]) {
  const groups = new Map<number, Record<string, T>>();

  items.forEach((item) => {
    const group = groups.get(item.ttlSeconds) ?? {};
    group[item.field] = item.value;
    groups.set(item.ttlSeconds, group);
  });

  return [...groups.entries()].map(([ttlSeconds, fields]) => ({
    ttlSeconds,
    fields,
  }));
}
