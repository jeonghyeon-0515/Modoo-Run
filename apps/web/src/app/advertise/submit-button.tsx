'use client';

import { useFormStatus } from 'react-dom';

export function AdvertiseSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="public-primary-button pressable inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold disabled:cursor-wait disabled:bg-slate-400 disabled:text-white"
    >
      {pending ? '문의 접수 중…' : '문의 보내기'}
    </button>
  );
}
