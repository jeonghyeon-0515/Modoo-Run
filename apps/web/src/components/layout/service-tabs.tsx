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

export function ServiceTabs({ isStaff = false }: { isStaff?: boolean }) {
  const pathname = usePathname();
  const tabItems = isStaff ? [...items, { href: '/ops', label: '관리' }] : items;

  return (
    <nav aria-label="주요 서비스" className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex min-w-max items-center gap-2 py-3">
        {tabItems.map((item) => {
          const active = isActive(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`focus-ring pressable inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold ${
                active
                  ? 'bg-[var(--secondary)] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-[var(--surface-muted)] hover:text-[var(--secondary)]'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
