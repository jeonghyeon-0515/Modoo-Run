import type { RaceChangeSummaryItem } from '../races/change-events';

export const notificationTypes = ['bookmark_saved', 'race_update', 'registration_reminder', 'system'] as const;

export type NotificationType = (typeof notificationTypes)[number];

const notificationTypeLabels: Record<NotificationType, string> = {
  bookmark_saved: '관심 대회 저장',
  race_update: '대회 정보 변경',
  registration_reminder: '접수 마감 알림',
  system: '서비스 알림',
};

function normalizeText(value: unknown, maxLength: number) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function normalizeLongText(value: unknown, maxLength: number) {
  return String(value ?? '').trim().slice(0, maxLength);
}

function formatSummaryValue(value: string | null) {
  return value ?? '미정';
}

export function isNotificationType(value: string): value is NotificationType {
  return (notificationTypes as readonly string[]).includes(value);
}

export function getNotificationTypeLabel(value: string) {
  return notificationTypeLabels[value as NotificationType] ?? value;
}

export function buildRaceUpdateNotificationTitle(raceTitle: string) {
  const title = normalizeText(raceTitle, 80);
  return `${title || '저장한 대회'} 정보가 변경되었어요`;
}

export function buildRaceUpdateNotificationBody(summaryItems: RaceChangeSummaryItem[]) {
  if (summaryItems.length === 0) {
    return '저장한 대회의 주요 정보가 업데이트됐어요. 상세 내용을 확인해 주세요.';
  }

  const messages = summaryItems.map((item) => {
    const before = formatSummaryValue(item.before);
    const after = formatSummaryValue(item.after);
    return `${item.label}이(가) ${before}에서 ${after}로 변경됐어요.`;
  });

  if (messages.length === 1) {
    return messages[0];
  }

  if (messages.length <= 3) {
    return messages.join(' ');
  }

  return `${messages.slice(0, 3).join(' ')} 외 ${messages.length - 3}건 변경됐어요.`;
}

export function normalizeNotificationInput(input: {
  notificationType: unknown;
  title: unknown;
  body: unknown;
  sourcePath: unknown;
}) {
  const notificationType = normalizeText(input.notificationType, 40) as NotificationType;
  const title = normalizeText(input.title, 120);
  const body = normalizeLongText(input.body, 1000);
  const sourcePath = normalizeText(input.sourcePath, 240);

  if (!isNotificationType(notificationType)) {
    throw new Error('알림 유형이 올바르지 않습니다.');
  }

  if (!title) {
    throw new Error('알림 제목이 필요합니다.');
  }

  if (!body) {
    throw new Error('알림 내용이 필요합니다.');
  }

  return {
    notificationType,
    title,
    body,
    sourcePath: sourcePath.startsWith('/') ? sourcePath : '/',
  };
}
