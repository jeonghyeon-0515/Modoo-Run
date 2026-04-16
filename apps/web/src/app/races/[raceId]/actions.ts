'use server';

import { revalidatePath } from 'next/cache';
import { requireViewer } from '@/lib/auth/session';
import { createBookmarkSavedNotification } from '@/lib/notifications/repository';
import { getRaceBySourceRaceId, setRaceBookmark } from '@/lib/races/repository';

export async function toggleRaceBookmarkAction(formData: FormData) {
  const sourceRaceId = String(formData.get('sourceRaceId') ?? '');
  const raceId = String(formData.get('raceId') ?? '');
  const enabled = String(formData.get('enabled') ?? '') === 'true';
  const viewer = await requireViewer(`/races/${sourceRaceId}`);

  await setRaceBookmark(viewer.id, raceId, enabled);
  if (enabled) {
    const race = await getRaceBySourceRaceId(sourceRaceId);
    if (race) {
      await createBookmarkSavedNotification({
        userId: viewer.id,
        raceId: race.id,
        sourceRaceId: race.sourceRaceId,
        raceTitle: race.title,
      });
    }
  }
  revalidatePath(`/races/${sourceRaceId}`);
  revalidatePath('/notifications');
}
