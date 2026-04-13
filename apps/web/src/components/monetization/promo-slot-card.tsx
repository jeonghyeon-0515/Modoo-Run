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
        <p className="text-base font-semibold text-slate-950">{title}</p>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-400">{disclosure ?? '광고 · 제휴 표기를 포함한 정보형 슬롯입니다.'}</p>
        <span className="public-primary-button inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition">
          {ctaLabel}
        </span>
      </div>
    </>
  );

  const className = `block rounded-[1.1rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 ${
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
