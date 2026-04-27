'use client';

import { useFormStatus } from 'react-dom';

export function ProfileSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="focus-ring public-primary-button pressable inline-flex min-h-11 min-w-[108px] items-center justify-center rounded-full px-5 py-3 text-sm font-semibold disabled:cursor-wait disabled:bg-slate-400 disabled:text-white"
    >
      {pending ? '저장 중…' : '저장하기'}
    </button>
  );
}
