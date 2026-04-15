'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { updateRaceCorrectionRequest } from '@/lib/corrections/repository';

function buildMessagePath(message: string, status = 'new') {
  return `/ops/corrections?status=${encodeURIComponent(status)}&message=${encodeURIComponent(message)}`;
}

export async function updateRaceCorrectionRequestAction(formData: FormData) {
  const status = String(formData.get('status') ?? 'new');
  let message = '수정 요청 처리 상태를 저장했습니다.';

  try {
    await updateRaceCorrectionRequest({
      id: String(formData.get('id') ?? ''),
      status,
      adminNote: String(formData.get('adminNote') ?? ''),
    });
    revalidatePath('/ops');
    revalidatePath('/ops/corrections');
  } catch (error) {
    message = error instanceof Error ? error.message : '수정 요청 처리 중 문제가 생겼습니다.';
  }

  redirect(buildMessagePath(message, status));
}
