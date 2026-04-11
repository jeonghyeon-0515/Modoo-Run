export const partnerClickTargets = ['partner_inquiry', 'affiliate', 'sponsored'] as const;
export type PartnerClickTarget = (typeof partnerClickTargets)[number];

export const partnerInquiryTypes = ['featured_listing', 'sponsorship', 'affiliate', 'other'] as const;
export type PartnerInquiryType = (typeof partnerInquiryTypes)[number];

function readRequiredText(value: FormDataEntryValue | string | null | undefined, label: string) {
  const normalized = String(value ?? '').trim();
  if (!normalized) {
    throw new Error(`${label}을(를) 입력해 주세요.`);
  }

  return normalized;
}

export function isPartnerClickTarget(value: string): value is PartnerClickTarget {
  return (partnerClickTargets as readonly string[]).includes(value);
}

export function getPartnerClickTargetLabel(target: string) {
  if (target === 'partner_inquiry') return '문의 진입';
  if (target === 'affiliate') return '제휴 클릭';
  if (target === 'sponsored') return '스폰서 클릭';
  return target;
}

export function getPartnerInquiryTypeLabel(type: PartnerInquiryType | string) {
  if (type === 'featured_listing') return 'Featured 등록';
  if (type === 'sponsorship') return '스폰서 제안';
  if (type === 'affiliate') return '제휴 제안';
  return '기타 문의';
}

export function validatePartnerInquiryType(value: string): PartnerInquiryType {
  if ((partnerInquiryTypes as readonly string[]).includes(value)) {
    return value as PartnerInquiryType;
  }

  return 'other';
}

export function normalizePartnerLeadInput(input: {
  name: FormDataEntryValue | string | null | undefined;
  email: FormDataEntryValue | string | null | undefined;
  organizationName: FormDataEntryValue | string | null | undefined;
  inquiryType: FormDataEntryValue | string | null | undefined;
  message: FormDataEntryValue | string | null | undefined;
  sourcePath?: FormDataEntryValue | string | null | undefined;
}) {
  const name = readRequiredText(input.name, '이름');
  const email = readRequiredText(input.email, '이메일').toLowerCase();
  const organizationName = readRequiredText(input.organizationName, '브랜드/주최측명');
  const inquiryType = validatePartnerInquiryType(String(input.inquiryType ?? 'other'));
  const message = readRequiredText(input.message, '문의 내용');
  const sourcePath = String(input.sourcePath ?? '').trim() || null;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('올바른 이메일 주소를 입력해 주세요.');
  }

  return {
    name,
    email,
    organizationName,
    inquiryType,
    message,
    sourcePath,
  };
}
