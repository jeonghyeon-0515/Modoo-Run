import Link from 'next/link';
import { ReactNode } from 'react';
import { BottomNav } from './bottom-nav';

export function PageShell({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="text-base font-bold tracking-tight text-slate-950">
            모두의 러닝
          </Link>
          <div className="text-sm text-slate-500">모바일 우선 러닝 웹앱</div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8">
        <section className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p>
        </section>
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
