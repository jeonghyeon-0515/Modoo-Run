'use client';

import { useFormStatus } from 'react-dom';

export function RaceCorrectionSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="focus-ring public-primary-button pressable inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:bg-slate-400 disabled:text-white"
    >
      {pending ? '접수 중…' : '수정 요청 보내기'}
    </button>
  );
}
