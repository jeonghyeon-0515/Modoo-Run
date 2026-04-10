'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
    <div className="border-t border-slate-200 bg-white/95">
      <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-5 py-2.5 sm:px-8">
        {items.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition ${
                active
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
