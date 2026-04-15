'use client';

import { useFormStatus } from 'react-dom';

export function RaceCorrectionSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
    >
      {pending ? '접수 중…' : '수정 요청 보내기'}
    </button>
  );
}
