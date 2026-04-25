import Link from 'next/link';
import { StatusBadge } from '@/components/ui/status-badge';

export function PromoSlotCard({
  badge,
  title,
  description,
  href,
  ctaLabel,
  disclosure,
  external = false,
  compact = false,
}: {
  badge: string;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  disclosure?: string;
  external?: boolean;
  compact?: boolean;
}) {
  const content = (
    <>
      <div className="flex items-center gap-2">
        <StatusBadge tone="disclosure">{badge}</StatusBadge>
        <p className="text-balance text-base font-semibold text-slate-950">{title}</p>
      </div>
      <p className="text-pretty mt-3 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-pretty text-xs text-slate-400">{disclosure ?? '광고 · 제휴 표기를 포함한 정보형 슬롯입니다.'}</p>
        <span className="public-primary-button pressable inline-flex min-h-11 items-center justify-center rounded-[0.95rem] px-4 py-2.5 text-center text-sm font-semibold">
          {ctaLabel}
        </span>
      </div>
    </>
  );

  const className = `interactive-card soft-surface block rounded-[1.25rem] border border-black/5 bg-white p-5 ${
    compact ? '' : ''
  }`;

  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}
