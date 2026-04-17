import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { deliverRaceChangeEvent } = require('../../src/lib/notifications/delivery.ts');

function createDeliveryHarness() {
  const deliveries = new Map();
  const notifications = new Map();
  let deliverySequence = 1;
  let notificationSequence = 1;

  return {
    deliveries,
    notifications,
    deps: {
      async readDelivery({ eventId, userId }) {
        return deliveries.get(`${eventId}:${userId}`) ?? null;
      },
      async createDelivery({ eventId, userId }) {
        const key = `${eventId}:${userId}`;
        if (deliveries.has(key)) {
          return null;
        }

        const delivery = { id: `delivery-${deliverySequence++}`, notificationId: null };
        deliveries.set(key, delivery);
        return { id: delivery.id };
      },
      async createNotification(input) {
        const notificationId = `notification-${notificationSequence++}`;
        notifications.set(notificationId, input);
        return notificationId;
      },
      async linkNotification({ deliveryId, notificationId }) {
        for (const delivery of deliveries.values()) {
          if (delivery.id !== deliveryId) continue;
          if (delivery.notificationId) {
            return false;
          }
          delivery.notificationId = notificationId;
          return true;
        }

        return false;
      },
      async deleteNotification(notificationId) {
        notifications.delete(notificationId);
      },
      async deleteDelivery(deliveryId) {
        for (const [key, delivery] of deliveries.entries()) {
          if (delivery.id === deliveryId && !delivery.notificationId) {
            deliveries.delete(key);
            return;
          }
        }
      },
    },
  };
}

test('같은 이벤트를 같은 사용자에게 한 번만 전달한다', async () => {
  const harness = createDeliveryHarness();
  const input = {
    eventId: 'event-1',
    raceId: 'race-1',
    sourceRaceId: '40317',
    raceTitle: '서울 하프 마라톤',
    changedFields: ['location'],
    summaryItems: [{ field: 'location', label: '장소', before: '잠실주경기장', after: '잠실종합운동장' }],
    changeKey: 'change-1',
    subscribers: [{ userId: 'user-1' }, { userId: 'user-2' }],
  };

  const first = await deliverRaceChangeEvent(input, harness.deps);
  const second = await deliverRaceChangeEvent(input, harness.deps);

  assert.deepEqual(first, { deliveredCount: 2 });
  assert.deepEqual(second, { deliveredCount: 0 });
  assert.equal(harness.deliveries.size, 2);
  assert.equal(harness.notifications.size, 2);
});

test('이미 다른 알림이 연결된 전달 기록이 있으면 새 알림을 만들지 않는다', async () => {
  const harness = createDeliveryHarness();
  harness.deliveries.set('event-1:user-1', {
    id: 'delivery-1',
    notificationId: 'notification-existing',
  });

  const result = await deliverRaceChangeEvent(
    {
      eventId: 'event-1',
      raceId: 'race-1',
      sourceRaceId: '40317',
      raceTitle: '서울 하프 마라톤',
      changedFields: ['location'],
      summaryItems: [{ field: 'location', label: '장소', before: '잠실주경기장', after: '잠실종합운동장' }],
      changeKey: 'change-1',
      subscribers: [{ userId: 'user-1' }],
    },
    harness.deps,
  );

  assert.deepEqual(result, { deliveredCount: 0 });
  assert.equal(harness.notifications.size, 0);
});

test('연결 후 재조회가 실패하면 알림과 전달 기록을 롤백하지 않는다', async () => {
  const harness = createDeliveryHarness();
  let readCount = 0;

  const deps = {
    ...harness.deps,
    async readDelivery(input) {
      readCount += 1;
      if (readCount === 4) {
        throw new Error('temporary read failure');
      }
      return harness.deps.readDelivery(input);
    },
  };

  await assert.rejects(
    deliverRaceChangeEvent(
      {
        eventId: 'event-1',
        raceId: 'race-1',
        sourceRaceId: '40317',
        raceTitle: '서울 하프 마라톤',
        changedFields: ['location'],
        summaryItems: [{ field: 'location', label: '장소', before: '잠실주경기장', after: '잠실종합운동장' }],
        changeKey: 'change-1',
        subscribers: [{ userId: 'user-1' }],
      },
      deps,
    ),
    /temporary read failure/,
  );

  assert.equal(harness.notifications.size, 1);
  assert.deepEqual(harness.deliveries.get('event-1:user-1'), {
    id: 'delivery-1',
    notificationId: 'notification-1',
  });
});
