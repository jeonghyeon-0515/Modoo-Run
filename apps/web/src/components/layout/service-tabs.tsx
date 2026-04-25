'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/', label: '홈' },
  { href: '/races', label: '대회 일정' },
  { href: '/plan', label: '일정 캘린더' },
  { href: '/compare', label: '대회 비교' },
  { href: '/community', label: '커뮤니티' },
];

function isActive(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ServiceTabs({ isStaff = false }: { isStaff?: boolean }) {
  const pathname = usePathname();
  const tabItems = isStaff ? [...items, { href: '/ops', label: '관리자' }] : items;

  return (
    <div className="border-t border-slate-200 bg-white/95">
      <div className="mx-auto max-w-5xl px-5 py-2.5 sm:px-8">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium text-slate-400 sm:hidden">좌우로 넘겨 더 보기</p>
        </div>
        <div className="relative mt-2">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-white/95 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-white/95 to-transparent" />
          <div className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {tabItems.map((item) => {
              const active = isActive(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`focus-ring inline-flex min-h-11 items-center whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition ${
                    active
                      ? 'border border-slate-300 bg-slate-100 text-slate-950'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
