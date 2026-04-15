import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  getCorrectionFieldKindLabel,
  getCorrectionRequesterRoleLabel,
  getCorrectionStatusLabel,
  isCorrectionStatus,
  normalizeRaceCorrectionInput,
} = require('../../src/lib/corrections/utils.ts');

test('수정 요청 라벨을 한국어로 반환한다', () => {
  assert.equal(getCorrectionRequesterRoleLabel('organizer'), '주최측');
  assert.equal(getCorrectionFieldKindLabel('registration'), '접수 기간/상태');
  assert.equal(getCorrectionStatusLabel('reviewing'), '검토 중');
});

test('허용된 처리 상태만 인정한다', () => {
  assert.equal(isCorrectionStatus('new'), true);
  assert.equal(isCorrectionStatus('resolved'), true);
  assert.equal(isCorrectionStatus('done'), false);
});

test('수정 요청 입력값을 검증하고 정규화한다', () => {
  assert.deepEqual(
    normalizeRaceCorrectionInput({
      requesterName: ' 홍길동 ',
      requesterEmail: ' Runner@Example.COM ',
      requesterRole: 'organizer',
      fieldKind: 'location',
      currentValue: ' 기존 장소 ',
      suggestedValue: ' 새 장소 ',
      message: ' 공식 공지를 확인했습니다. ',
      sourcePath: ' /races/40317 ',
    }),
    {
      requesterName: '홍길동',
      requesterEmail: 'runner@example.com',
      requesterRole: 'organizer',
      fieldKind: 'location',
      currentValue: '기존 장소',
      suggestedValue: '새 장소',
      message: '공식 공지를 확인했습니다.',
      sourcePath: '/races/40317',
    },
  );
});

test('수정 요청 필수값이 없으면 오류를 낸다', () => {
  assert.throws(
    () =>
      normalizeRaceCorrectionInput({
        requesterName: '',
        requesterEmail: 'bad-email',
        requesterRole: 'runner',
        fieldKind: 'date',
        suggestedValue: '',
        sourcePath: '/races/1',
      }),
    /이름을 입력/,
  );
});
