import { ReactNode } from 'react';

type Tone = 'featured' | 'disclosure' | 'ops-info' | 'success' | 'warning' | 'neutral';

const toneClassMap: Record<Tone, string> = {
  featured: 'bg-[#fff1ec] text-[var(--brand-strong)] ring-[rgba(255,107,84,0.18)]',
  disclosure: 'bg-[#fff7f4] text-[var(--brand-strong)] ring-[rgba(255,107,84,0.12)]',
  'ops-info': 'bg-[#eef3f8] text-[var(--secondary)] ring-[rgba(44,62,80,0.12)]',
  success: 'bg-[#edf8ee] text-[#2f8b35] ring-[rgba(76,175,80,0.16)]',
  warning: 'bg-[#fff4e5] text-[#b86f11] ring-[rgba(255,183,77,0.18)]',
  neutral: 'bg-[#f3f4f6] text-[#5f6b76] ring-[rgba(44,62,80,0.08)]',
};

export function StatusBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${toneClassMap[tone]}`}>
      {children}
    </span>
  );
}
