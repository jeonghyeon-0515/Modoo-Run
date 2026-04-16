'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { markAllNotificationsAsRead, markNotificationAsRead } from '@/lib/notifications/repository';

function buildRedirectPath(message: string, filter = 'all') {
  return `/notifications?filter=${encodeURIComponent(filter)}&message=${encodeURIComponent(message)}`;
}

export async function markNotificationAsReadAction(formData: FormData) {
  const filter = String(formData.get('filter') ?? 'all');
  let message = '알림을 읽음 처리했습니다.';

  try {
    await markNotificationAsRead({
      notificationId: String(formData.get('notificationId') ?? ''),
    });
    revalidatePath('/notifications');
  } catch (error) {
    message = error instanceof Error ? error.message : '알림 읽음 처리 중 문제가 생겼습니다.';
  }

  redirect(buildRedirectPath(message, filter));
}

export async function markAllNotificationsAsReadAction(formData: FormData) {
  const filter = String(formData.get('filter') ?? 'all');
  let message = '모든 알림을 읽음 처리했습니다.';

  try {
    await markAllNotificationsAsRead();
    revalidatePath('/notifications');
  } catch (error) {
    message = error instanceof Error ? error.message : '알림 전체 읽음 처리 중 문제가 생겼습니다.';
  }

  redirect(buildRedirectPath(message, filter));
}
