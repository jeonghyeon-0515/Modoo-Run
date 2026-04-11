import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  buildRecentKstDayBuckets,
  buildPartnerLeadGuardDailyTrend,
} = require('../../src/lib/monetization/report.ts');

test('최근 KST 일자 버킷을 오래된 순서로 만든다', () => {
  const buckets = buildRecentKstDayBuckets(3, new Date('2026-04-11T01:00:00.000Z'));

  assert.deepEqual(
    buckets.map((item) => item.dateLabel),
    ['4/9', '4/10', '4/11'],
  );
  assert.equal(buckets[0].startIso, '2026-04-08T15:00:00.000Z');
  assert.equal(buckets[2].endIso, '2026-04-11T15:00:00.000Z');
});

test('차단 건수는 날짜별로 합쳐서 trend 포인트를 만든다', () => {
  const buckets = buildRecentKstDayBuckets(3, new Date('2026-04-11T01:00:00.000Z'));
  const trend = buildPartnerLeadGuardDailyTrend(buckets, [
    { dateKey: buckets[0].dateKey, blockedScope: 'ip', count: 2 },
    { dateKey: buckets[0].dateKey, blockedScope: 'email', count: 1 },
    { dateKey: buckets[2].dateKey, blockedScope: 'email', count: 4 },
  ]);

  assert.deepEqual(trend, [
    { dateKey: buckets[0].dateKey, dateLabel: '4/9', totalCount: 3 },
    { dateKey: buckets[1].dateKey, dateLabel: '4/10', totalCount: 0 },
    { dateKey: buckets[2].dateKey, dateLabel: '4/11', totalCount: 4 },
  ]);
});
