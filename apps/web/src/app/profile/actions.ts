'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { updateProfile } from '@/lib/profile/repository';
import { normalizeMultiSelectValues } from '@/lib/profile/utils';

export async function updateProfileAction(formData: FormData) {
  let message = '프로필을 저장했습니다.';

  try {
    await updateProfile({
      displayName: String(formData.get('displayName') ?? ''),
      bio: String(formData.get('bio') ?? ''),
      preferredRegions: normalizeMultiSelectValues(formData.getAll('preferredRegions')),
      preferredDistances: normalizeMultiSelectValues(formData.getAll('preferredDistances')),
      goalRaceId: String(formData.get('goalRaceId') ?? '') || null,
    });

    revalidatePath('/profile');
    revalidatePath('/', 'layout');
  } catch (error) {
    message = error instanceof Error ? error.message : '프로필 저장 중 오류가 발생했습니다.';
  }

  redirect('/profile?message=' + encodeURIComponent(message));
}
