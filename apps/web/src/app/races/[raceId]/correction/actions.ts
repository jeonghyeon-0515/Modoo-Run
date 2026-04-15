'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createRaceCorrectionRequest } from '@/lib/corrections/repository';
import { enforceRaceCorrectionRateLimit, getRaceCorrectionRateLimitMessage } from '@/lib/corrections/rate-limit';
import { normalizeRaceCorrectionInput } from '@/lib/corrections/utils';
import { getRaceBySourceRaceId } from '@/lib/races/repository';

function buildRedirectPath(sourceRaceId: string, message: string) {
  return `/races/${encodeURIComponent(sourceRaceId)}/correction?message=${encodeURIComponent(message)}`;
}

export async function createRaceCorrectionRequestAction(formData: FormData) {
  const sourceRaceId = String(formData.get('sourceRaceId') ?? '').trim();
  let message = '수정 요청이 접수되었습니다. 운영자가 확인한 뒤 반영 여부를 검토할게요.';

  if (!sourceRaceId) {
    redirect('/races');
  }

  if (!String(formData.get('website') ?? '').trim()) {
    try {
      const race = await getRaceBySourceRaceId(sourceRaceId);
      if (!race) {
        throw new Error('대회 정보를 찾을 수 없습니다.');
      }

      const input = normalizeRaceCorrectionInput({
        requesterName: formData.get('requesterName'),
        requesterEmail: formData.get('requesterEmail'),
        requesterRole: formData.get('requesterRole'),
        fieldKind: formData.get('fieldKind'),
        currentValue: formData.get('currentValue'),
        suggestedValue: formData.get('suggestedValue'),
        message: formData.get('message'),
        sourcePath: formData.get('sourcePath'),
      });

      const headerStore = await headers();
      const rateLimitResult = await enforceRaceCorrectionRateLimit({
        email: input.requesterEmail,
        headers: headerStore,
      });

      if (!rateLimitResult.allowed) {
        message = getRaceCorrectionRateLimitMessage(rateLimitResult.retryAfterSeconds);
      } else {
        await createRaceCorrectionRequest({
          raceId: race.id,
          sourceRaceId: race.sourceRaceId,
          requesterName: input.requesterName,
          requesterEmail: input.requesterEmail,
          requesterRole: input.requesterRole,
          fieldKind: input.fieldKind,
          currentValue: input.currentValue,
          suggestedValue: input.suggestedValue,
          message: input.message,
          sourcePath: input.sourcePath,
        });
      }
    } catch (error) {
      message = error instanceof Error ? error.message : '수정 요청 접수 중 문제가 생겼습니다.';
    }
  }

  redirect(buildRedirectPath(sourceRaceId, message));
}
