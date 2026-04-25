'use client';

import { useFormStatus } from 'react-dom';

export function ProfileSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="focus-ring pressable inline-flex min-h-11 min-w-[108px] items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-400"
    >
      {pending ? '저장 중…' : '저장하기'}
    </button>
  );
}
