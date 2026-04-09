type FilterableRace = {
  eventDate: string | null;
  courseSummary: string | null;
  region: string | null;
  registrationStatus: 'open' | 'closed' | 'unknown';
};

type FilterableRaceFilters = {
  registrationStatus?: 'open' | 'closed' | 'unknown' | 'all';
  region?: string;
  month?: string;
  distance?: string;
  limit?: number;
};

function normalizeMonthFilter(value?: string | null) {
  if (!value) return null;
  const normalized = value.replace(/월/g, '').trim();
  const month = Number(normalized);
  if (Number.isNaN(month) || month < 1 || month > 12) return null;
  return month;
}

function matchesMonthFilter(eventDate: string | null, value?: string) {
  const month = normalizeMonthFilter(value);
  if (!month) return true;
  if (!eventDate) return false;

  const currentYear = new Date().getFullYear();
  const start = `${currentYear}-${String(month).padStart(2, '0')}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? currentYear + 1 : currentYear;
  const end = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;
  return eventDate >= start && eventDate < end;
}

export function applyRaceFilters<T extends FilterableRace>(items: T[], filters: FilterableRaceFilters = {}) {
  const distance = filters.distance?.trim().toLowerCase();

  let filtered = items.filter((item) => {
    if (
      filters.registrationStatus &&
      filters.registrationStatus !== 'all' &&
      item.registrationStatus !== filters.registrationStatus
    ) {
      return false;
    }

    if (filters.region && item.region !== filters.region) {
      return false;
    }

    if (!matchesMonthFilter(item.eventDate, filters.month)) {
      return false;
    }

    if (distance && !(item.courseSummary ?? '').toLowerCase().includes(distance)) {
      return false;
    }

    return true;
  });

  if (filters.limit) {
    filtered = filtered.slice(0, filters.limit);
  }

  return filtered;
}
