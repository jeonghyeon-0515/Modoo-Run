import Link from 'next/link';

const items = [
  { href: '/', label: '홈' },
  { href: '/races', label: '대회' },
  { href: '/plan', label: '플랜' },
  { href: '/community', label: '커뮤니티' },
];

export function BottomNav() {
  return (
    <nav className="sticky bottom-0 z-20 mt-10 border-t border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto grid max-w-5xl grid-cols-4 px-3 py-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center rounded-2xl px-2 py-3 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
