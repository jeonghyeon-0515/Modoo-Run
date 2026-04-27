'use client';

import { useFormStatus } from 'react-dom';

export function PartnerDestinationSubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="focus-ring public-primary-button pressable inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold disabled:cursor-wait disabled:bg-slate-400 disabled:text-white"
    >
      {pending ? '저장 중…' : label}
    </button>
  );
}
