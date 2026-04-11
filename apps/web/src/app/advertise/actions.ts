'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createPartnerLead } from '@/lib/monetization/repository';
import { normalizePartnerLeadInput } from '@/lib/monetization/utils';

export async function createPartnerLeadAction(formData: FormData) {
  let message = '문의가 접수되었습니다. 입력해주신 이메일로 답변드릴게요.';

  try {
    const input = normalizePartnerLeadInput({
      name: formData.get('name'),
      email: formData.get('email'),
      organizationName: formData.get('organizationName'),
      inquiryType: formData.get('inquiryType'),
      message: formData.get('message'),
      sourcePath: formData.get('sourcePath'),
    });

    await createPartnerLead(input);
    revalidatePath('/ops/outbound-clicks');
  } catch (error) {
    message = error instanceof Error ? error.message : '문의 접수 중 문제가 생겼습니다.';
  }

  redirect(`/advertise?message=${encodeURIComponent(message)}`);
}
