type NaverUserInfoEnvelope = {
  resultcode?: string;
  message?: string;
  response?: Record<string, unknown> | null;
};

export type NormalizedNaverUserInfo = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  nickname?: string;
  full_name?: string;
  picture?: string;
  avatar_url?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function normalizeNaverUserInfo(input: unknown): NormalizedNaverUserInfo {
  if (!isRecord(input)) {
    throw new Error('네이버 사용자 정보 응답 형식이 올바르지 않습니다.');
  }

  const envelope = input as NaverUserInfoEnvelope;
  const profile = envelope.response;

  if (!isRecord(profile)) {
    throw new Error('네이버 사용자 프로필(response)이 없습니다.');
  }

  const sub = readString(profile.id);

  if (!sub) {
    throw new Error('네이버 사용자 고유값(id)이 없습니다.');
  }

  const email = readString(profile.email);
  const name = readString(profile.name);
  const nickname = readString(profile.nickname);
  const picture = readString(profile.profile_image);
  const preferredName = nickname ?? name ?? undefined;
  const fullName = name ?? nickname ?? undefined;

  return {
    sub,
    ...(email ? { email, email_verified: true } : {}),
    ...(preferredName ? { name: preferredName } : {}),
    ...(nickname ? { nickname } : {}),
    ...(fullName ? { full_name: fullName } : {}),
    ...(picture ? { picture, avatar_url: picture } : {}),
  };
}
