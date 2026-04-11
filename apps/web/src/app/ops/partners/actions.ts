'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { resetPartnerDestinationSetting, savePartnerDestinationSetting } from '@/lib/monetization/partner-destination-repository';
import type { PublicPartnerDestinationKey } from '@/lib/monetization/public-catalog';

function buildMessagePath(message: string) {
  return `/ops/partners?message=${encodeURIComponent(message)}`;
}

export async function savePartnerDestinationAction(formData: FormData) {
  let message = '제휴 링크를 저장했습니다.';

  try {
    await savePartnerDestinationSetting({
      destinationKey: String(formData.get('destinationKey')) as PublicPartnerDestinationKey,
      destinationUrl: String(formData.get('destinationUrl') ?? ''),
    });
    revalidatePath('/gear');
    revalidatePath('/races');
    revalidatePath('/community');
    revalidatePath('/ops');
    revalidatePath('/ops/partners');
  } catch (error) {
    message = error instanceof Error ? error.message : '제휴 링크 저장 중 문제가 생겼습니다.';
  }

  redirect(buildMessagePath(message));
}

export async function resetPartnerDestinationAction(formData: FormData) {
  let message = '기본 링크로 되돌렸습니다.';

  try {
    await resetPartnerDestinationSetting(String(formData.get('destinationKey')) as PublicPartnerDestinationKey);
    revalidatePath('/gear');
    revalidatePath('/races');
    revalidatePath('/community');
    revalidatePath('/ops');
    revalidatePath('/ops/partners');
  } catch (error) {
    message = error instanceof Error ? error.message : '기본 링크 복원 중 문제가 생겼습니다.';
  }

  redirect(buildMessagePath(message));
}
