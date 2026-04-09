'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LinkPendingCue } from '@/components/ui/link-pending-cue';

const items = [
  { href: '/', label: '홈' },
  { href: '/races', label: '대회일정' },
  { href: '/plan', label: '캘린더' },
  { href: '/community', label: '커뮤니티' },
];

function isActive(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-20 mt-10 border-t border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto grid max-w-5xl grid-cols-4 px-3 py-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`relative overflow-hidden flex flex-col items-center justify-center rounded-2xl px-2 py-3 text-[11px] font-medium transition ${
              isActive(pathname, item.href)
                ? 'bg-[var(--surface-muted)] text-[var(--brand-strong)]'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
            }`}
          >
            <span>{item.label}</span>
            <LinkPendingCue mode="badge" label="이동" className="mt-1" />
            <LinkPendingCue mode="bar" className="bottom-1" />
          </Link>
        ))}
      </div>
    </nav>
  );
}
