import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  buildRaceUpdateNotificationBody,
  buildRaceUpdateNotificationTitle,
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

test('race update 알림 제목을 만든다', () => {
  assert.equal(buildRaceUpdateNotificationTitle('서울 하프 마라톤'), '서울 하프 마라톤 정보가 변경되었어요');
});

test('race update 알림 본문은 3건 이하 변경을 모두 보여준다', () => {
  const body = buildRaceUpdateNotificationBody([
    { field: 'location', label: '장소', before: '잠실주경기장', after: '잠실종합운동장' },
    { field: 'registrationCloseAt', label: '접수 마감일', before: '2026-09-20', after: '2026-09-27' },
  ]);

  assert.match(body, /장소/);
  assert.match(body, /접수 마감일/);
  assert.doesNotMatch(body, /외 \d+건 변경/);
});

test('race update 알림 본문은 4건 이상 변경 시 요약한다', () => {
  const body = buildRaceUpdateNotificationBody([
    { field: 'title', label: '대회명', before: '기존 대회명', after: '새 대회명' },
    { field: 'location', label: '장소', before: '잠실주경기장', after: '잠실종합운동장' },
    { field: 'registrationCloseAt', label: '접수 마감일', before: '2026-09-20', after: '2026-09-27' },
    { field: 'homepageUrl', label: '공식 홈페이지', before: 'https://old.example.com', after: 'https://new.example.com' },
  ]);

  assert.match(body, /외 1건 변경됐어요/);
});
