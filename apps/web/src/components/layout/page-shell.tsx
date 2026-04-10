import Link from 'next/link';
import { ReactNode } from 'react';
import { getOptionalViewer } from '@/lib/auth/session';
import { BottomNav } from './bottom-nav';
import { ServiceTabs } from './service-tabs';

export async function PageShell({
  title,
  description,
  children,
  compactIntro = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  compactIntro?: boolean;
}) {
  const viewer = await getOptionalViewer();
  const roleLabel = viewer?.role === 'admin' ? '관리자' : viewer?.role === 'moderator' ? '운영자' : '러너';

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <div>
            <Link href="/races" className="text-base font-bold tracking-tight text-slate-950">
              모두의 러닝
            </Link>
            <div className="text-sm text-slate-500">러너를 위한 일정 · 기록 공간</div>
          </div>

          {viewer ? (
            <div className="flex items-center gap-3">
              {viewer.isStaff ? (
                <Link
                  href="/ops/outbound-clicks"
                  className="rounded-full border border-[var(--brand-soft)] px-4 py-2 text-sm font-semibold text-[var(--brand-strong)] transition hover:bg-[var(--brand-soft)]"
                >
                  운영 흐름
                </Link>
              ) : null}
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{viewer.displayName}</p>
                <p className="text-xs text-slate-500">{roleLabel}</p>
              </div>
              <form action="/auth/logout" method="post">
                <button
                  type="submit"
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  로그아웃
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-[0_14px_32px_rgba(255,107,87,0.24)] transition hover:bg-[var(--brand-strong)]"
            >
              로그인
            </Link>
          )}
        </div>
        <ServiceTabs />
      </header>

      <main className={`mx-auto w-full max-w-5xl px-5 ${compactIntro ? 'py-5 sm:py-6' : 'py-8'} sm:px-8`}>
        <section className={compactIntro ? 'mb-5 sm:mb-6' : 'mb-8'}>
          <h1
            className={
              compactIntro
                ? 'text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl'
                : 'text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl'
            }
          >
            {title}
          </h1>
          {description ? (
            <p
              className={
                compactIntro
                  ? 'mt-2 max-w-3xl text-sm leading-6 text-slate-600'
                  : 'mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base'
              }
            >
              {description}
            </p>
          ) : null}
        </section>
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
