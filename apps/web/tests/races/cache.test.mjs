import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { applyRaceFilters, getRaceCacheTtlSeconds, groupHashFieldsByTtl } = require('../../src/lib/races/cache-helpers.ts');

const sampleRaces = [
  {
    id: '1',
    sourceRaceId: '41182',
    title: '새해 일출런',
    eventDate: `${new Date().getFullYear()}-01-01`,
    eventDateLabel: '1/1',
    weekdayLabel: '목',
    region: '서울',
    location: '한강공원',
    courseSummary: '하프,10km,5km',
    organizer: '모두의 러닝',
    registrationStatus: 'open',
    registrationPeriodLabel: `${new Date().getFullYear()}년1월1일~${new Date().getFullYear()}년1월7일`,
    lastSyncedAt: '2026-04-09T00:00:00.000Z',
  },
  {
    id: '2',
    sourceRaceId: '41183',
    title: '봄꽃 마라톤',
    eventDate: `${new Date().getFullYear()}-04-20`,
    eventDateLabel: '4/20',
    weekdayLabel: '일',
    region: '부산',
    location: '시민공원',
    courseSummary: '10km,5km',
    organizer: '모두의 러닝',
    registrationStatus: 'open',
    registrationPeriodLabel: `${new Date().getFullYear()}년3월1일~${new Date().getFullYear()}년3월20일`,
    lastSyncedAt: '2026-04-09T00:00:00.000Z',
  },
  {
    id: '3',
    sourceRaceId: '41184',
    title: '가을 하프런',
    eventDate: `${new Date().getFullYear()}-09-14`,
    eventDateLabel: '9/14',
    weekdayLabel: '일',
    region: '서울',
    location: '올림픽공원',
    courseSummary: '하프',
    organizer: '모두의 러닝',
    registrationStatus: 'closed',
    registrationPeriodLabel: `${new Date().getFullYear()}년8월1일~${new Date().getFullYear()}년8월20일`,
    lastSyncedAt: '2026-04-09T00:00:00.000Z',
  },
];

test('캐시된 대회 목록에 접수 상태/지역/거리 필터를 적용한다', () => {
  const filtered = applyRaceFilters(sampleRaces, {
    registrationStatus: 'open',
    region: '부산',
    distance: '10km',
  });

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].sourceRaceId, '41183');
});

test('월 필터와 limit를 동일하게 적용한다', () => {
  const january = applyRaceFilters(sampleRaces, {
    month: '1월',
    limit: 1,
  });

  assert.equal(january.length, 1);
  assert.equal(january[0].sourceRaceId, '41182');
});

test('지역·월·거리 다중 선택을 함께 적용한다', () => {
  const filtered = applyRaceFilters(sampleRaces, {
    region: ['서울', '부산'],
    month: ['1월', '4월'],
    distance: ['하프', '10km'],
  });

  assert.equal(filtered.length, 2);
  assert.deepEqual(
    filtered.map((item) => item.sourceRaceId),
    ['41182', '41183'],
  );
});

test('접수 종료일 기준으로 TTL을 계산한다', () => {
  const ttl = getRaceCacheTtlSeconds('2099-12-31', new Date('2099-12-30T12:00:00+09:00'));
  assert.ok(ttl > 60 * 60 * 30);

  const expired = getRaceCacheTtlSeconds('2020-01-01', new Date('2020-01-02T00:00:00+09:00'));
  assert.equal(expired, 1);
});

test('같은 TTL을 가진 hash field를 묶어 hsetex payload로 만든다', () => {
  const grouped = groupHashFieldsByTtl([
    { field: '40317', ttlSeconds: 100, value: '{"title":"a"}' },
    { field: '40318', ttlSeconds: 100, value: '{"title":"b"}' },
    { field: '50001', ttlSeconds: 200, value: '{"title":"c"}' },
  ]);

  assert.equal(grouped.length, 2);
  assert.deepEqual(grouped[0], {
    ttlSeconds: 100,
    fields: {
      '40317': '{"title":"a"}',
      '40318': '{"title":"b"}',
    },
  });
  assert.deepEqual(grouped[1], {
    ttlSeconds: 200,
    fields: {
      '50001': '{"title":"c"}',
    },
  });
});
