type RaceStatus = 'open' | 'closed' | 'unknown';

export function getRaceStatusTone(status: RaceStatus) {
  if (status === 'open') return 'success' as const;
  if (status === 'closed') return 'warning' as const;
  return 'neutral' as const;
}

export function getRaceStatusLabel(status: RaceStatus) {
  if (status === 'open') return '접수중';
  if (status === 'closed') return '접수마감';
  return '상태확인필요';
}

export function formatRaceDate(value: string | null, fallback?: string | null) {
  if (!value) return fallback ?? '일정 확인 필요';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback ?? value;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    timeZone: 'Asia/Seoul',
  }).format(date);
}

export function formatLastSyncedAt(value: string | null) {
  if (!value) return '수집 시각 없음';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Seoul',
  }).format(date);
}

export function normalizeMonthFilter(value?: string | null) {
  if (!value) return null;
  const normalized = value.replace(/월/g, '').trim();
  const month = Number(normalized);
  if (Number.isNaN(month) || month < 1 || month > 12) return null;
  return month;
}
