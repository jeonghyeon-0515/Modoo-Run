'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LinkPendingCue } from '@/components/ui/link-pending-cue';

const items = [
  { href: '/races', label: '대회 일정' },
  { href: '/community', label: '커뮤니티' },
  { href: '/plan', label: '일정 캘린더' },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ServiceTabs() {
  const pathname = usePathname();

  return (
    <div className="border-t border-slate-200/80 bg-white/80">
      <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto px-5 py-3 sm:px-8">
        {items.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                active
                  ? 'bg-[var(--brand)] text-white shadow-[0_12px_28px_rgba(255,107,87,0.22)]'
                  : 'bg-[var(--surface-muted)] text-slate-700 hover:bg-[var(--brand-soft)]'
              }`}
            >
              <span className="inline-flex items-center gap-2">
                {item.label}
                <LinkPendingCue mode="badge" label="이동 중" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
