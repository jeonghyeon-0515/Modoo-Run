import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  getEffectiveRaceStatus,
  inferRegistrationStatus,
  isRaceOpenForDiscovery,
} = require('../../src/lib/races/status.ts');

test('지난 event date는 접수 종료일이 미래여도 closed 처리한다', () => {
  const status = inferRegistrationStatus(
    {
      eventDate: '2026-04-16',
      registrationCloseAt: '2099-12-31',
    },
    new Date('2026-04-17T12:00:00+09:00'),
  );

  assert.equal(status, 'closed');
});

test('persisted open 상태도 조회 시점에는 지난 대회를 closed로 바로잡는다', () => {
  const status = getEffectiveRaceStatus(
    {
      eventDate: '2026-04-16',
      registrationCloseAt: '2099-12-31',
      registrationStatus: 'open',
    },
    new Date('2026-04-17T12:00:00+09:00'),
  );

  assert.equal(status, 'closed');
});

test('이미 closed 또는 unknown인 상태는 그대로 유지한다', () => {
  assert.equal(
    getEffectiveRaceStatus(
      {
        eventDate: '2099-12-31',
        registrationCloseAt: null,
        registrationStatus: 'closed',
      },
      new Date('2026-04-17T12:00:00+09:00'),
    ),
    'closed',
  );

  assert.equal(
    getEffectiveRaceStatus(
      {
        eventDate: '2099-12-31',
        registrationCloseAt: null,
        registrationStatus: 'unknown',
      },
      new Date('2026-04-17T12:00:00+09:00'),
    ),
    'unknown',
  );
});

test('discoverable 여부는 유효한 open 상태에만 true를 반환한다', () => {
  assert.equal(
    isRaceOpenForDiscovery(
      {
        eventDate: '2099-12-31',
        registrationCloseAt: null,
        registrationStatus: 'open',
      },
      new Date('2026-04-17T12:00:00+09:00'),
    ),
    true,
  );

  assert.equal(
    isRaceOpenForDiscovery(
      {
        eventDate: '2026-04-16',
        registrationCloseAt: '2099-12-31',
        registrationStatus: 'open',
      },
      new Date('2026-04-17T12:00:00+09:00'),
    ),
    false,
  );
});
