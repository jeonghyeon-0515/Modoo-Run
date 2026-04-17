import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  buildRaceChangeKey,
  detectImportantRaceChanges,
  pickRaceChangeSnapshot,
} = require('../../src/lib/races/change-events.ts');
const { persistRaceChangeEvent } = require('../../src/lib/races/change-event-delivery.ts');

function createEventHarness() {
  const events = new Map();
  const delivered = [];
  let sequence = 1;

  return {
    events,
    delivered,
    deps: {
      async readExistingEvent({ raceId, changeKey }) {
        return events.get(`${raceId}:${changeKey}`) ?? null;
      },
      async createEvent({ raceId, changeKey }) {
        const key = `${raceId}:${changeKey}`;
        if (events.has(key)) {
          return null;
        }

        const event = { id: `event-${sequence++}` };
        events.set(key, event);
        return event;
      },
      async deliver(input) {
        delivered.push(input);
      },
    },
  };
}

function createImportantChange() {
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
  const change = detectImportantRaceChanges(previous, next);
  assert.ok(change);
  return change;
}

test('중요 변경이 생기면 변경 이벤트를 만들고 전달을 호출한다', async () => {
  const harness = createEventHarness();
  const importantChange = createImportantChange();
  const changeKey = buildRaceChangeKey('race-1', importantChange);

  const result = await persistRaceChangeEvent(
    {
      syncRunId: 'sync-1',
      raceId: 'race-1',
      sourceSite: 'roadrun',
      sourceRaceId: '40317',
      raceTitle: '서울 하프 마라톤',
      changeKey,
      importantChange,
    },
    harness.deps,
  );

  assert.deepEqual(result, { eventId: 'event-1', created: true });
  assert.equal(harness.events.size, 1);
  assert.equal(harness.delivered.length, 1);
  assert.equal(harness.delivered[0].eventId, 'event-1');
});

test('같은 논리 변경이 다시 오면 기존 이벤트를 재사용한다', async () => {
  const harness = createEventHarness();
  const importantChange = createImportantChange();
  const changeKey = buildRaceChangeKey('race-1', importantChange);

  const first = await persistRaceChangeEvent(
    {
      syncRunId: 'sync-1',
      raceId: 'race-1',
      sourceSite: 'roadrun',
      sourceRaceId: '40317',
      raceTitle: '서울 하프 마라톤',
      changeKey,
      importantChange,
    },
    harness.deps,
  );
  const second = await persistRaceChangeEvent(
    {
      syncRunId: 'sync-2',
      raceId: 'race-1',
      sourceSite: 'roadrun',
      sourceRaceId: '40317',
      raceTitle: '서울 하프 마라톤',
      changeKey,
      importantChange,
    },
    harness.deps,
  );

  assert.deepEqual(first, { eventId: 'event-1', created: true });
  assert.deepEqual(second, { eventId: 'event-1', created: false });
  assert.equal(harness.events.size, 1);
  assert.equal(harness.delivered.length, 2);
  assert.equal(harness.delivered[1].eventId, 'event-1');
});
