export const correctionRequesterRoles = ['runner', 'organizer', 'volunteer', 'other'] as const;
export const correctionFieldKinds = ['date', 'registration', 'location', 'course', 'contact', 'homepage', 'other'] as const;
export const correctionStatuses = ['new', 'reviewing', 'resolved', 'rejected'] as const;

export type CorrectionRequesterRole = (typeof correctionRequesterRoles)[number];
export type CorrectionFieldKind = (typeof correctionFieldKinds)[number];
export type CorrectionStatus = (typeof correctionStatuses)[number];

const requesterRoleLabels: Record<CorrectionRequesterRole, string> = {
  runner: '참가자/러너',
  organizer: '주최측',
  volunteer: '운영/봉사자',
  other: '기타',
};

const fieldKindLabels: Record<CorrectionFieldKind, string> = {
  date: '대회 일정',
  registration: '접수 기간/상태',
  location: '장소',
  course: '종목/거리',
  contact: '주최/연락처',
  homepage: '공식 링크',
  other: '기타',
};

const statusLabels: Record<CorrectionStatus, string> = {
  new: '새 요청',
  reviewing: '검토 중',
  resolved: '반영 완료',
  rejected: '반영 보류',
};

function normalizeText(value: unknown, maxLength: number) {
  return String(value ?? '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function normalizeLongText(value: unknown, maxLength: number) {
  return String(value ?? '').trim().slice(0, maxLength);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isCorrectionStatus(value: string): value is CorrectionStatus {
  return (correctionStatuses as readonly string[]).includes(value);
}

export function getCorrectionRequesterRoleLabel(value: string) {
  return requesterRoleLabels[value as CorrectionRequesterRole] ?? value;
}

export function getCorrectionFieldKindLabel(value: string) {
  return fieldKindLabels[value as CorrectionFieldKind] ?? value;
}

export function getCorrectionStatusLabel(value: string) {
  return statusLabels[value as CorrectionStatus] ?? value;
}

export function normalizeRaceCorrectionInput(input: {
  requesterName: unknown;
  requesterEmail: unknown;
  requesterRole: unknown;
  fieldKind: unknown;
  currentValue?: unknown;
  suggestedValue: unknown;
  message?: unknown;
  sourcePath: unknown;
}) {
  const requesterName = normalizeText(input.requesterName, 80);
  const requesterEmail = normalizeText(input.requesterEmail, 120).toLowerCase();
  const requesterRole = normalizeText(input.requesterRole, 30) as CorrectionRequesterRole;
  const fieldKind = normalizeText(input.fieldKind, 30) as CorrectionFieldKind;
  const currentValue = normalizeLongText(input.currentValue, 800);
  const suggestedValue = normalizeLongText(input.suggestedValue, 1200);
  const message = normalizeLongText(input.message, 1200);
  const sourcePath = normalizeText(input.sourcePath, 240);

  if (!requesterName) {
    throw new Error('이름을 입력해 주세요.');
  }

  if (!isEmail(requesterEmail)) {
    throw new Error('올바른 이메일 주소를 입력해 주세요.');
  }

  if (!(correctionRequesterRoles as readonly string[]).includes(requesterRole)) {
    throw new Error('요청자 유형을 선택해 주세요.');
  }

  if (!(correctionFieldKinds as readonly string[]).includes(fieldKind)) {
    throw new Error('수정할 정보 유형을 선택해 주세요.');
  }

  if (suggestedValue.length < 2) {
    throw new Error('바르게 고칠 내용을 입력해 주세요.');
  }

  return {
    requesterName,
    requesterEmail,
    requesterRole,
    fieldKind,
    currentValue: currentValue || null,
    suggestedValue,
    message: message || null,
    sourcePath: sourcePath.startsWith('/') ? sourcePath : '/',
  };
}
