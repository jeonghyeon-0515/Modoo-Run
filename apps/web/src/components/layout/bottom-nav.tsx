'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/races', label: '대회일정' },
  { href: '/compare', label: '비교' },
  { href: '/plan', label: '캘린더' },
  { href: '/community', label: '커뮤니티' },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-20 mt-10 border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto grid max-w-5xl grid-cols-4 px-3 py-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center rounded-xl px-2 py-3 text-[11px] font-medium transition ${
              isActive(pathname, item.href)
                ? 'bg-slate-100 text-slate-950'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
            }`}
          >
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
