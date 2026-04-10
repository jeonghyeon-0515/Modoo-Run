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
    message =
      error instanceof Error && error.message.includes('로그인')
        ? '로그인 상태를 다시 확인해 주세요.'
        : '프로필 저장 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.';
  }

  redirect('/profile?message=' + encodeURIComponent(message));
}
