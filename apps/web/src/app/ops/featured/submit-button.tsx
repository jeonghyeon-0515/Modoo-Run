'use client';

import { useFormStatus } from 'react-dom';

export function FeaturedPlacementSubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:bg-slate-400"
    >
      {pending ? '저장 중…' : label}
    </button>
  );
}
