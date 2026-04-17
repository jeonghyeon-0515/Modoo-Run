import type { RaceChangeField, RaceChangeSummaryItem } from '@/lib/races/change-events';

export type RaceChangeDeliverySubscriber = {
  userId: string;
};

export type StoredRaceChangeDelivery = {
  id: string;
  notificationId: string | null;
};

export type DeliverRaceChangeEventInput = {
  eventId: string;
  raceId: string;
  sourceRaceId: string;
  raceTitle: string;
  changedFields: RaceChangeField[];
  summaryItems: RaceChangeSummaryItem[];
  changeKey: string;
  subscribers: RaceChangeDeliverySubscriber[];
};

export type DeliverRaceChangeEventDeps = {
  readDelivery: (input: { eventId: string; userId: string }) => Promise<StoredRaceChangeDelivery | null>;
  createDelivery: (input: { eventId: string; userId: string }) => Promise<{ id: string } | null>;
  createNotification: (input: {
    userId: string;
    raceId: string;
    sourceRaceId: string;
    raceTitle: string;
    changedFields: RaceChangeField[];
    summaryItems: RaceChangeSummaryItem[];
    changeKey: string;
    eventId: string;
  }) => Promise<string>;
  linkNotification: (input: { deliveryId: string; notificationId: string }) => Promise<boolean>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteDelivery: (deliveryId: string) => Promise<void>;
};

export async function deliverRaceChangeEvent(input: DeliverRaceChangeEventInput, deps: DeliverRaceChangeEventDeps) {
  let deliveredCount = 0;

  for (const subscriber of input.subscribers) {
    let existing = await deps.readDelivery({ eventId: input.eventId, userId: subscriber.userId });
    if (existing?.notificationId) {
      continue;
    }

    let deliveryId = existing?.id as string | undefined;
    let createdDelivery = false;

    if (!deliveryId) {
      const delivery = await deps.createDelivery({ eventId: input.eventId, userId: subscriber.userId });
      if (!delivery) {
        existing = await deps.readDelivery({ eventId: input.eventId, userId: subscriber.userId });
        if (!existing) {
          throw new Error('변경 알림 전달 기록을 다시 읽지 못했습니다.');
        }
        if (existing.notificationId) {
          continue;
        }
        deliveryId = existing.id;
      } else {
        deliveryId = delivery.id;
        createdDelivery = true;
      }
    }

    if (!deliveryId) {
      throw new Error('변경 알림 전달 기록 ID를 확인하지 못했습니다.');
    }

    let notificationId: string | null = null;
    let linked = false;
    try {
      const latestDelivery = await deps.readDelivery({ eventId: input.eventId, userId: subscriber.userId });
      if (latestDelivery?.notificationId) {
        continue;
      }

      notificationId = await deps.createNotification({
        userId: subscriber.userId,
        raceId: input.raceId,
        sourceRaceId: input.sourceRaceId,
        raceTitle: input.raceTitle,
        changedFields: input.changedFields,
        summaryItems: input.summaryItems,
        changeKey: input.changeKey,
        eventId: input.eventId,
      });

      const latestBeforeLink = await deps.readDelivery({ eventId: input.eventId, userId: subscriber.userId });
      if (latestBeforeLink?.notificationId) {
        await deps.deleteNotification(notificationId);
        continue;
      }

      linked = await deps.linkNotification({ deliveryId, notificationId });
      if (!linked) {
        await deps.deleteNotification(notificationId);
        continue;
      }

      const linkedDelivery = await deps.readDelivery({ eventId: input.eventId, userId: subscriber.userId });
      if (!linkedDelivery?.notificationId || linkedDelivery.notificationId !== notificationId) {
        await deps.deleteNotification(notificationId);
        continue;
      }

      deliveredCount += 1;
    } catch (error) {
      if (notificationId && !linked) {
        await deps.deleteNotification(notificationId);
      }
      if (createdDelivery && !linked) {
        await deps.deleteDelivery(deliveryId);
      }
      throw error;
    }
  }

  return { deliveredCount };
}
