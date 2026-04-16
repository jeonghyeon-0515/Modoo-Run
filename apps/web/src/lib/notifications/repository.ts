import 'server-only';

import { requireViewer } from '@/lib/auth/session';
import { getSupabaseAdminClient } from '@/lib/supabase/admin';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getNotificationTypeLabel, type NotificationType } from './utils';

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

type NotificationInsertClient = {
  from(table: 'user_notifications'): {
    insert(values: Record<string, unknown>): Promise<{ error: { message: string } | null }>;
  };
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

export async function createUserNotification(input: {
  userId: string;
  raceId?: string | null;
  notificationType: NotificationType;
  title: string;
  body: string;
  sourcePath: string;
  metadata?: Record<string, unknown>;
}) {
  const admin = getSupabaseAdminClient() as unknown as NotificationInsertClient;
  const { error } = await admin.from('user_notifications').insert({
    user_id: input.userId,
    race_id: input.raceId ?? null,
    notification_type: input.notificationType,
    title: input.title,
    body: input.body,
    source_path: input.sourcePath,
    metadata: input.metadata ?? {},
  });

  if (error) {
    throw new Error(`알림 저장 실패: ${error.message}`);
  }
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
