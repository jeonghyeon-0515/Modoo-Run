'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/', label: '홈' },
  { href: '/races', label: '대회' },
  { href: '/plan', label: '플랜' },
  { href: '/compare', label: '비교' },
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
    <nav className="app-bottom-nav fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-white/96 backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-6xl grid-cols-5 px-2 py-2">
        {items.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`focus-ring pressable flex min-h-11 flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-center text-[11px] font-semibold ${
                active
                  ? 'bg-[#fff1ec] text-[var(--brand-strong)]'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-[var(--secondary)]'
              }`}
            >
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-[var(--brand)]' : 'bg-slate-300'}`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
