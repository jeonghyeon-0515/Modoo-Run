import { ReactNode } from 'react';

type Tone = 'disclosure' | 'ops-info' | 'success' | 'warning' | 'neutral';

const toneClassMap: Record<Tone, string> = {
  disclosure: 'bg-[#fff7f2] text-[var(--public-accent-strong)] ring-[#f1d8ce]',
  'ops-info': 'bg-[#fff1ec] text-[var(--brand-strong)] ring-[#f7d7cf]',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  warning: 'bg-amber-50 text-amber-700 ring-amber-100',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-200',
};

export function StatusBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${toneClassMap[tone]}`}>
      {children}
    </span>
  );
}
