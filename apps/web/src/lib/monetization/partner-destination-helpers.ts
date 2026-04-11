export function normalizePartnerDestinationUrl(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error('링크 URL을 입력해 주세요.');
  }

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    throw new Error('올바른 URL을 입력해 주세요.');
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error('http 또는 https 링크만 저장할 수 있습니다.');
  }

  return parsed.toString();
}
