import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  getPartnerClickTargetLabel,
  getPartnerInquiryTypeLabel,
  isPartnerClickTarget,
  normalizePartnerLeadInput,
} = require('../../src/lib/monetization/utils.ts');

test('파트너 클릭 대상 라벨을 사용자 친화적으로 바꾼다', () => {
  assert.equal(getPartnerClickTargetLabel('partner_inquiry'), '문의 진입');
  assert.equal(getPartnerClickTargetLabel('affiliate'), '제휴 클릭');
  assert.equal(getPartnerClickTargetLabel('unknown'), 'unknown');
});

test('파트너 문의 유형 라벨을 한국어로 바꾼다', () => {
  assert.equal(getPartnerInquiryTypeLabel('featured_listing'), 'Featured 등록');
  assert.equal(getPartnerInquiryTypeLabel('sponsorship'), '스폰서 제안');
  assert.equal(getPartnerInquiryTypeLabel('other'), '기타 문의');
});

test('파트너 클릭 대상은 허용값만 인정한다', () => {
  assert.equal(isPartnerClickTarget('partner_inquiry'), true);
  assert.equal(isPartnerClickTarget('affiliate'), true);
  assert.equal(isPartnerClickTarget('apply'), false);
});

test('파트너 문의 입력값을 검증하고 정규화한다', () => {
  assert.deepEqual(
    normalizePartnerLeadInput({
      name: ' 홍길동 ',
      email: 'SALES@EXAMPLE.COM ',
      organizationName: ' 모두의브랜드 ',
      inquiryType: 'sponsorship',
      message: ' 협업을 제안합니다. ',
      sourcePath: ' /community ',
    }),
    {
      name: '홍길동',
      email: 'sales@example.com',
      organizationName: '모두의브랜드',
      inquiryType: 'sponsorship',
      message: '협업을 제안합니다.',
      sourcePath: '/community',
    },
  );
});
