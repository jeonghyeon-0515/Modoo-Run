'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { clearFeaturedPlacement, saveFeaturedPlacement } from '@/lib/monetization/featured-repository';

function buildMessagePath(message: string) {
  return `/ops/featured?message=${encodeURIComponent(message)}`;
}

export async function saveFeaturedPlacementAction(formData: FormData) {
  let message = 'featured listing이 저장되었습니다.';

  try {
    await saveFeaturedPlacement({
      slotKey: String(formData.get('slotKey')) as 'featured_primary' | 'featured_secondary',
      raceId: String(formData.get('raceId') ?? ''),
      eyebrow: String(formData.get('eyebrow') ?? ''),
      summary: String(formData.get('summary') ?? ''),
      isActive: String(formData.get('isActive') ?? '') === 'true',
    });
    revalidatePath('/races');
    revalidatePath('/ops');
    revalidatePath('/ops/featured');
  } catch (error) {
    message = error instanceof Error ? error.message : 'featured listing 저장 중 문제가 생겼습니다.';
  }

  redirect(buildMessagePath(message));
}

export async function clearFeaturedPlacementAction(formData: FormData) {
  let message = 'featured listing을 비웠습니다.';

  try {
    await clearFeaturedPlacement(String(formData.get('slotKey')) as 'featured_primary' | 'featured_secondary');
    revalidatePath('/races');
    revalidatePath('/ops');
    revalidatePath('/ops/featured');
  } catch (error) {
    message = error instanceof Error ? error.message : 'featured listing 비우기 중 문제가 생겼습니다.';
  }

  redirect(buildMessagePath(message));
}
