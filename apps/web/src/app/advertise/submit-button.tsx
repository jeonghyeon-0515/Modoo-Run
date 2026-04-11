'use client';

import { useFormStatus } from 'react-dom';

export function AdvertiseSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-400"
    >
      {pending ? '문의 접수 중…' : '문의 보내기'}
    </button>
  );
}
