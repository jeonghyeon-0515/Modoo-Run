import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  MAX_RACE_COMPARE_ITEMS,
  normalizeRaceCompareItems,
  removeRaceCompareItem,
  upsertRaceCompareItem,
} = require('../../src/lib/races/compare.ts');

const baseItem = (sourceRaceId) => ({
  sourceRaceId,
  title: `대회 ${sourceRaceId}`,
  eventDate: '2026-05-01',
  eventDateLabel: '2026년 5월 1일',
  region: '서울',
  location: '잠실',
  courseSummary: '10km',
  registrationPeriodLabel: '접수중',
  detailPath: `/races/${sourceRaceId}`,
});

test('비교 항목은 중복 제거 후 최대 4개만 유지한다', () => {
  const items = normalizeRaceCompareItems([
    baseItem('1'),
    baseItem('1'),
    baseItem('2'),
    baseItem('3'),
    baseItem('4'),
    baseItem('5'),
  ]);

  assert.equal(items.length, MAX_RACE_COMPARE_ITEMS);
  assert.deepEqual(items.map((item) => item.sourceRaceId), ['1', '2', '3', '4']);
});

test('비교 항목을 추가하면 맨 앞에 놓고 기존 항목을 갱신한다', () => {
  const items = upsertRaceCompareItem([baseItem('1'), baseItem('2')], {
    ...baseItem('2'),
    title: '갱신된 대회',
  });

  assert.equal(items[0].sourceRaceId, '2');
  assert.equal(items[0].title, '갱신된 대회');
  assert.equal(items.length, 2);
});

test('비교 항목을 제거한다', () => {
  assert.deepEqual(
    removeRaceCompareItem([baseItem('1'), baseItem('2')], '1').map((item) => item.sourceRaceId),
    ['2'],
  );
});
