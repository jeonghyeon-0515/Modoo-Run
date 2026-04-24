import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { applyRaceFilters, collectRaceRegions, getRaceCacheTtlSeconds, groupHashFieldsByTtl } = require('../../src/lib/races/cache-helpers.ts');
const { inferRegistrationStatus } = require('../../src/lib/races/status.ts');

const currentYear = new Date().getFullYear();

const sampleRaces = [
  {
    id: '1',
    sourceRaceId: '41182',
    title: '새해 일출런',
    eventDate: '2099-01-01',
    eventDateLabel: '1/1',
    weekdayLabel: '목',
    region: '서울',
    location: '한강공원',
    courseSummary: '하프,10km,5km',
    organizer: '모두의 러닝',
    registrationStatus: 'open',
    registrationPeriodLabel: '2098년12월1일~2098년12월20일',
    registrationCloseAt: '2098-12-20',
    lastSyncedAt: '2026-04-09T00:00:00.000Z',
  },
  {
    id: '2',
    sourceRaceId: '41183',
    title: '봄꽃 마라톤',
    eventDate: '2099-04-20',
    eventDateLabel: '4/20',
    weekdayLabel: '일',
    region: '부산',
    location: '시민공원',
    courseSummary: '10km,5km',
    organizer: '모두의 러닝',
    registrationStatus: 'open',
    registrationPeriodLabel: '2099년3월1일~2099년3월20일',
    registrationCloseAt: '2099-03-20',
    lastSyncedAt: '2026-04-09T00:00:00.000Z',
  },
  {
    id: '3',
    sourceRaceId: '41184',
    title: '가을 하프런',
    eventDate: '2099-09-14',
    eventDateLabel: '9/14',
    weekdayLabel: '일',
    region: '서울',
    location: '올림픽공원',
    courseSummary: '하프',
    organizer: '모두의 러닝',
    registrationStatus: 'closed',
    registrationPeriodLabel: '2099년8월1일~2099년8월20일',
    registrationCloseAt: '2099-08-20',
    lastSyncedAt: '2026-04-09T00:00:00.000Z',
  },
];

const monthSampleRaces = [
  {
    id: '11',
    sourceRaceId: '51182',
    title: '1월 레이스',
    eventDate: `${currentYear}-01-01`,
    eventDateLabel: '1/1',
    weekdayLabel: '수',
    region: '서울',
    location: '한강공원',
    courseSummary: '하프,10km',
    organizer: '모두의 러닝',
    registrationStatus: 'open',
    registrationPeriodLabel: `${currentYear - 1}년12월1일~${currentYear - 1}년12월20일`,
    registrationCloseAt: `${currentYear - 1}-12-20`,
    lastSyncedAt: '2026-04-09T00:00:00.000Z',
  },
  {
    id: '12',
    sourceRaceId: '51183',
    title: '4월 레이스',
    eventDate: `${currentYear}-04-20`,
    eventDateLabel: '4/20',
    weekdayLabel: '일',
    region: '부산',
    location: '시민공원',
    courseSummary: '10km,5km',
    organizer: '모두의 러닝',
    registrationStatus: 'open',
    registrationPeriodLabel: `${currentYear}년3월1일~${currentYear}년3월20일`,
    registrationCloseAt: `${currentYear}-03-20`,
    lastSyncedAt: '2026-04-09T00:00:00.000Z',
  },
  {
    id: '13',
    sourceRaceId: '51184',
    title: '9월 레이스',
    eventDate: `${currentYear}-09-14`,
    eventDateLabel: '9/14',
    weekdayLabel: '일',
    region: '서울',
    location: '올림픽공원',
    courseSummary: '하프',
    organizer: '모두의 러닝',
    registrationStatus: 'closed',
    registrationPeriodLabel: `${currentYear}년8월1일~${currentYear}년8월20일`,
    registrationCloseAt: `${currentYear}-08-20`,
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
  const january = applyRaceFilters(monthSampleRaces, {
    month: '1월',
    limit: 1,
  });

  assert.equal(january.length, 1);
  assert.equal(january[0].sourceRaceId, '51182');
});

test('지역·월·거리 다중 선택을 함께 적용한다', () => {
  const filtered = applyRaceFilters(monthSampleRaces, {
    region: ['서울', '부산'],
    month: ['1월', '4월'],
    distance: ['하프', '10km'],
  });

  assert.equal(filtered.length, 2);
  assert.deepEqual(
    filtered.map((item) => item.sourceRaceId),
    ['51182', '51183'],
  );
});

test('더 이른 event date 또는 접수 종료일 기준으로 TTL을 계산한다', () => {
  const ttl = getRaceCacheTtlSeconds('2099-12-31', '2099-12-30', new Date('2099-12-29T12:00:00+09:00'));
  assert.ok(ttl < 60 * 60 * 36);
  assert.ok(ttl > 60 * 60 * 30);

  const expiredByEventDate = getRaceCacheTtlSeconds('2099-12-31', '2020-01-01', new Date('2020-01-02T00:00:00+09:00'));
  assert.equal(expiredByEventDate, 1);
});

test('지난 대회는 접수 종료일이 남아 있어도 open 목록에서 제외한다', () => {
  const filtered = applyRaceFilters(
    [
      {
        id: '9',
        sourceRaceId: '49999',
        title: '이미 끝난 대회',
        eventDate: '2020-01-01',
        eventDateLabel: '1/1',
        weekdayLabel: '수',
        region: '서울',
        location: '잠실',
        courseSummary: '10km',
        organizer: '모두의 러닝',
        registrationStatus: 'open',
        registrationPeriodLabel: '2099년1월1일~2099년1월2일',
        registrationCloseAt: '2099-01-02',
        lastSyncedAt: '2026-04-09T00:00:00.000Z',
      },
    ],
    { registrationStatus: 'open' },
  );

  assert.equal(filtered.length, 0);
});

test('미래 대회는 접수 종료일이 없어도 open 상태를 유지한다', () => {
  const status = inferRegistrationStatus(
    {
      eventDate: '2099-01-01',
      registrationCloseAt: null,
    },
    new Date('2026-04-17T12:00:00+09:00'),
  );

  assert.equal(status, 'open');
});

test('접수 종료일이 지났으면 event date가 남아 있어도 closed 처리한다', () => {
  const status = inferRegistrationStatus(
    {
      eventDate: '2099-01-01',
      registrationCloseAt: '2026-04-16',
    },
    new Date('2026-04-17T12:00:00+09:00'),
  );

  assert.equal(status, 'closed');
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

test('지역 목록은 중복과 null을 제거한 독립 캐시 payload로 만든다', () => {
  const regions = collectRaceRegions([
    { region: '서울' },
    { region: '부산' },
    { region: '서울' },
    { region: null },
  ]);

  assert.deepEqual(regions, ['서울', '부산']);
});
