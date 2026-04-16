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

export function isNotificationType(value: string): value is NotificationType {
  return (notificationTypes as readonly string[]).includes(value);
}

export function getNotificationTypeLabel(value: string) {
  return notificationTypeLabels[value as NotificationType] ?? value;
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
