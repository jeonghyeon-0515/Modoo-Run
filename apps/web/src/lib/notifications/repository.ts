import 'server-only';

import type { RaceChangeField, RaceChangeSummaryItem } from '@/lib/races/change-events';
import { listRaceBookmarkSubscribers } from '@/lib/races/repository';
import { deliverRaceChangeEvent } from './delivery';
import { requireViewer } from '@/lib/auth/session';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import {
  buildRaceUpdateNotificationBody,
  buildRaceUpdateNotificationTitle,
  getNotificationTypeLabel,
  normalizeNotificationInput,
  type NotificationType,
} from './utils';

type RawNotificationRow = {
  id: string;
  user_id: string;
  race_id: string | null;
  notification_type: NotificationType;
  title: string;
  body: string;
  source_path: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

function mapNotification(row: RawNotificationRow) {
  return {
    id: row.id,
    userId: row.user_id,
    raceId: row.race_id,
    notificationType: row.notification_type,
    notificationTypeLabel: getNotificationTypeLabel(row.notification_type),
    title: row.title,
    body: row.body,
    sourcePath: row.source_path,
    metadata: row.metadata ?? {},
    isRead: row.is_read,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

function isUniqueViolation(error?: { code?: string; message?: string } | null) {
  return error?.code === '23505';
}

export async function createUserNotification(input: {
  userId: string;
  raceId?: string | null;
  notificationType: NotificationType;
  title: string;
  body: string;
  sourcePath: string;
  metadata?: Record<string, unknown>;
}) {
  const normalized = normalizeNotificationInput(input);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin: any = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('user_notifications')
    .insert({
      user_id: input.userId,
      race_id: input.raceId ?? null,
      notification_type: normalized.notificationType,
      title: normalized.title,
      body: normalized.body,
      source_path: normalized.sourcePath,
      metadata: input.metadata ?? {},
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`알림 저장 실패: ${error?.message ?? 'unknown'}`);
  }

  return data.id as string;
}

export async function createBookmarkSavedNotification(input: {
  userId: string;
  raceId: string;
  sourceRaceId: string;
  raceTitle: string;
}) {
  await createUserNotification({
    userId: input.userId,
    raceId: input.raceId,
    notificationType: 'bookmark_saved',
    title: '관심 대회에 저장했어요',
    body: `${input.raceTitle} 대회를 관심 목록에 담았습니다. 변경 감지와 마감 알림은 다음 단계에서 연결할 예정입니다.`,
    sourcePath: `/races/${input.sourceRaceId}`,
    metadata: {
      sourceRaceId: input.sourceRaceId,
      raceTitle: input.raceTitle,
    },
  });
}

export async function createRaceUpdateNotification(input: {
  userId: string;
  raceId: string;
  sourceRaceId: string;
  raceTitle: string;
  changedFields: RaceChangeField[];
  summaryItems: RaceChangeSummaryItem[];
  changeKey: string;
  eventId: string;
}) {
  return createUserNotification({
    userId: input.userId,
    raceId: input.raceId,
    notificationType: 'race_update',
    title: buildRaceUpdateNotificationTitle(input.raceTitle),
    body: buildRaceUpdateNotificationBody(input.summaryItems),
    sourcePath: `/races/${input.sourceRaceId}`,
    metadata: {
      eventId: input.eventId,
      sourceRaceId: input.sourceRaceId,
      raceTitle: input.raceTitle,
      changedFields: input.changedFields,
      summaryItems: input.summaryItems,
      changeKey: input.changeKey,
    },
  });
}

export async function deliverRaceChangeEventToBookmarkedUsers(input: {
  eventId: string;
  raceId: string;
  sourceRaceId: string;
  raceTitle: string;
  changedFields: RaceChangeField[];
  summaryItems: RaceChangeSummaryItem[];
  changeKey: string;
}) {
  const subscribers = await listRaceBookmarkSubscribers(input.raceId);
  if (subscribers.length === 0) {
    return { deliveredCount: 0 };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin: any = getSupabaseAdminClient();

  return deliverRaceChangeEvent(
    {
      ...input,
      subscribers,
    },
    {
      async readDelivery({ eventId, userId }) {
        const { data, error } = await admin
          .from('race_change_notifications')
          .select('id, notification_id')
          .eq('event_id', eventId)
          .eq('user_id', userId)
          .maybeSingle();

        if (error) {
          throw new Error(`변경 알림 전달 기록 조회 실패: ${error.message}`);
        }

        return data
          ? {
              id: data.id as string,
              notificationId: (data.notification_id as string | null) ?? null,
            }
          : null;
      },
      async createDelivery({ eventId, userId }) {
        const { data, error } = await admin
          .from('race_change_notifications')
          .insert({
            event_id: eventId,
            user_id: userId,
          })
          .select('id')
          .single();

        if (error) {
          if (isUniqueViolation(error)) {
            return null;
          }
          throw new Error(`변경 알림 전달 기록 저장 실패: ${error.message}`);
        }

        if (!data) {
          throw new Error('변경 알림 전달 기록 저장 결과가 비어 있습니다.');
        }

        return { id: data.id as string };
      },
      async createNotification(notificationInput) {
        return createRaceUpdateNotification(notificationInput);
      },
      async linkNotification({ deliveryId, notificationId }) {
        const { error } = await admin
          .from('race_change_notifications')
          .update({ notification_id: notificationId })
          .eq('id', deliveryId)
          .is('notification_id', null);

        if (error) {
          throw new Error(`변경 알림 전달 기록 업데이트 실패: ${error.message}`);
        }

        const { data, error: readError } = await admin
          .from('race_change_notifications')
          .select('notification_id')
          .eq('id', deliveryId)
          .maybeSingle();

        if (readError) {
          throw new Error(`변경 알림 전달 기록 조회 실패: ${readError.message}`);
        }

        return data?.notification_id === notificationId;
      },
      async deleteNotification(notificationId) {
        await admin.from('user_notifications').delete().eq('id', notificationId);
      },
      async deleteDelivery(deliveryId) {
        await admin.from('race_change_notifications').delete().eq('id', deliveryId).is('notification_id', null);
      },
    },
  );
}

export async function listViewerNotifications(input?: { filter?: 'all' | 'unread'; limit?: number }) {
  const viewer = await requireViewer('/notifications');
  const supabase = await getSupabaseServerClient();
  const filter = input?.filter ?? 'all';
  const limit = input?.limit ?? 100;

  let query = supabase
    .from('user_notifications')
    .select('id, user_id, race_id, notification_type, title, body, source_path, metadata, is_read, read_at, created_at')
    .eq('user_id', viewer.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (filter === 'unread') {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`알림 조회 실패: ${error.message}`);
  }

  return {
    viewer,
    items: ((data ?? []) as RawNotificationRow[]).map(mapNotification),
  };
}

export async function getUnreadNotificationCount(userId: string) {
  const supabase = await getSupabaseServerClient();
  const { count, error } = await supabase
    .from('user_notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) {
    console.error('notification unread count failed', error);
    return 0;
  }

  return count ?? 0;
}

export async function markNotificationAsRead(input: { notificationId: string }) {
  const viewer = await requireViewer('/notifications');
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from('user_notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', input.notificationId)
    .eq('user_id', viewer.id);

  if (error) {
    throw new Error(`알림 읽음 처리 실패: ${error.message}`);
  }
}

export async function markAllNotificationsAsRead() {
  const viewer = await requireViewer('/notifications');
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase
    .from('user_notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('user_id', viewer.id)
    .eq('is_read', false);

  if (error) {
    throw new Error(`알림 전체 읽음 처리 실패: ${error.message}`);
  }
}
