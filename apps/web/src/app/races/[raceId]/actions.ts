'use server';

import { revalidatePath } from 'next/cache';
import { requireViewer } from '@/lib/auth/session';
import { setRaceBookmark } from '@/lib/races/repository';

export async function toggleRaceBookmarkAction(formData: FormData) {
  const sourceRaceId = String(formData.get('sourceRaceId') ?? '');
  const raceId = String(formData.get('raceId') ?? '');
  const enabled = String(formData.get('enabled') ?? '') === 'true';
  const viewer = await requireViewer(`/races/${sourceRaceId}`);

  await setRaceBookmark(viewer.id, raceId, enabled);
  revalidatePath(`/races/${sourceRaceId}`);
}
