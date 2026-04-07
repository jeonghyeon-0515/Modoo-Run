import { ReactNode } from 'react';

type Tone = 'info' | 'success' | 'warning' | 'neutral';

const toneClassMap: Record<Tone, string> = {
  info: 'bg-blue-50 text-blue-700 ring-blue-100',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  warning: 'bg-amber-50 text-amber-700 ring-amber-100',
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
};

export function StatusBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${toneClassMap[tone]}`}>
      {children}
    </span>
  );
}
