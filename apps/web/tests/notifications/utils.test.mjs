import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  getNotificationTypeLabel,
  isNotificationType,
  normalizeNotificationInput,
} = require('../../src/lib/notifications/utils.ts');

test('알림 유형 라벨을 한국어로 반환한다', () => {
  assert.equal(getNotificationTypeLabel('bookmark_saved'), '관심 대회 저장');
  assert.equal(getNotificationTypeLabel('race_update'), '대회 정보 변경');
  assert.equal(getNotificationTypeLabel('system'), '서비스 알림');
});

test('허용된 알림 유형만 인정한다', () => {
  assert.equal(isNotificationType('bookmark_saved'), true);
  assert.equal(isNotificationType('registration_reminder'), true);
  assert.equal(isNotificationType('unknown'), false);
});

test('알림 입력값을 검증하고 정규화한다', () => {
  assert.deepEqual(
    normalizeNotificationInput({
      notificationType: 'bookmark_saved',
      title: ' 관심 대회에 저장했어요 ',
      body: ' 알림 본문입니다. ',
      sourcePath: ' /races/40317 ',
    }),
    {
      notificationType: 'bookmark_saved',
      title: '관심 대회에 저장했어요',
      body: '알림 본문입니다.',
      sourcePath: '/races/40317',
    },
  );
});
