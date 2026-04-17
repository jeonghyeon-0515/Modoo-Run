import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  buildRaceChangeKey,
  detectImportantRaceChanges,
  pickRaceChangeSnapshot,
} = require('../../src/lib/races/change-events.ts');
const {
  buildRaceUpdateNotificationBody,
  buildRaceUpdateNotificationTitle,
} = require('../../src/lib/notifications/utils.ts');

test('첫 생성 상태에서는 중요한 변경 이벤트를 만들지 않는다', () => {
  const next = pickRaceChangeSnapshot({
    title: '서울 하프 마라톤',
    eventDate: '2026-10-03',
    eventDateLabel: '10/03',
    location: '잠실종합운동장',
    registrationCloseAt: '2026-09-20',
    registrationStatus: 'open',
  });

  assert.equal(detectImportantRaceChanges(null, next), null);
});

test('중요 필드가 바뀌면 변경 요약을 만든다', () => {
  const previous = pickRaceChangeSnapshot({
    title: '서울 하프 마라톤',
    eventDate: '2026-10-03',
    eventDateLabel: '10/03',
    location: '잠실주경기장',
    registrationCloseAt: '2026-09-20',
    registrationStatus: 'open',
  });
  const next = pickRaceChangeSnapshot({
    title: '서울 하프 마라톤',
    eventDate: '2026-10-03',
    eventDateLabel: '10/03',
    location: '잠실종합운동장',
    registrationCloseAt: '2026-09-27',
    registrationStatus: 'open',
  });

  const change = detectImportantRaceChanges(previous, next);
  assert.ok(change);
  assert.deepEqual(change.changedFields, ['location', 'registrationCloseAt']);
  assert.equal(change.summaryItems[0].label, '장소');
  assert.equal(change.summaryItems[1].label, '접수 마감일');
});

test('같은 논리 변경은 같은 changeKey를 만든다', () => {
  const previous = pickRaceChangeSnapshot({
    title: '서울 하프 마라톤',
    location: '잠실주경기장',
    registrationCloseAt: '2026-09-20',
  });
  const next = pickRaceChangeSnapshot({
    title: '서울 하프 마라톤',
    location: '잠실종합운동장',
    registrationCloseAt: '2026-09-27',
  });

  const changeA = detectImportantRaceChanges(previous, next);
  const changeB = detectImportantRaceChanges(previous, next);

  assert.ok(changeA);
  assert.ok(changeB);
  assert.equal(buildRaceChangeKey('race-1', changeA), buildRaceChangeKey('race-1', changeB));
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

