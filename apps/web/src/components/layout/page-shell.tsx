import Link from 'next/link';
import { ReactNode } from 'react';
import { getOptionalViewer } from '@/lib/auth/session';
import { getUnreadNotificationCount } from '@/lib/notifications/repository';
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
  const unreadNotifications = viewer ? await getUnreadNotificationCount(viewer.id) : 0;

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
            <div className="flex flex-col items-end gap-1.5 text-right sm:flex-row sm:items-center sm:gap-4 sm:text-left">
              <div className="leading-tight">
                <p className="max-w-[180px] truncate text-base font-semibold text-slate-900">{viewer.displayName}</p>
                <p className="mt-1 text-xs text-slate-500">{roleLabel}</p>
              </div>
              <div className="hidden h-5 w-px bg-slate-200 sm:block" />
              <div className="flex items-center gap-3 text-sm font-medium text-slate-600 sm:gap-4">
                <Link
                  href="/notifications"
                  className="inline-flex items-center gap-2 transition hover:text-slate-950"
                >
                  <span>알림</span>
                  {unreadNotifications > 0 ? (
                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-slate-900 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                      {unreadNotifications > 99 ? '99+' : unreadNotifications}
                    </span>
                  ) : null}
                </Link>
                <Link
                  href="/profile"
                  className="transition hover:text-slate-950"
                >
                  프로필
                </Link>
                {viewer.isStaff ? (
                  <Link
                    href="/ops"
                    className="rounded-full border border-[var(--brand-soft-strong)] bg-[var(--brand-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-strong)] transition hover:bg-[#ffe5dd]"
                  >
                    관리자
                  </Link>
                ) : null}
              </div>
              <form action="/auth/logout" method="post">
                <button
                  type="submit"
                  className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
                >
                  로그아웃
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              로그인
            </Link>
          )}
        </div>
        <ServiceTabs isStaff={viewer?.isStaff ?? false} />
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

      <footer className="border-t border-slate-200 bg-white/95">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-5 py-6 text-sm sm:px-8 sm:py-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-900">모두의 러닝</p>
              <p className="mt-1 text-sm text-slate-500">러너를 위한 일정 · 기록 공간</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-600">
              <Link href="/advertise" className="transition hover:text-slate-950">
                광고 · 제휴 문의
              </Link>
              <Link href="/gear" className="transition hover:text-slate-950">
                공개 가이드
              </Link>
            </div>
          </div>
          <p className="text-xs leading-6 text-slate-400">
            브랜드 협업, featured listing, 스폰서 노출 문의는 광고 · 제휴 문의 페이지에서 바로 남길 수 있습니다.
          </p>
        </div>
      </footer>

      <BottomNav />
    </div>
  );
}
