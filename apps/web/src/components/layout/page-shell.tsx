import Link from 'next/link';
import { ReactNode } from 'react';
import type { Viewer } from '@/lib/auth/session';
import { getUnreadNotificationCount } from '@/lib/notifications/repository';
import { BottomNav } from './bottom-nav';
import { ServiceTabs } from './service-tabs';

export async function PageShell({
  title,
  description,
  children,
  compactIntro = false,
  viewer = null,
  unreadNotifications,
  mode = 'public',
  showBottomNav = true,
  showIntro = true,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  compactIntro?: boolean;
  viewer?: Viewer | null;
  unreadNotifications?: number;
  mode?: 'public' | 'ops';
  showBottomNav?: boolean;
  showIntro?: boolean;
}) {
  const roleLabel = viewer?.role === 'admin' ? '관리자' : viewer?.role === 'moderator' ? '운영자' : '러너';
  const isOpsMode = mode === 'ops';
  const resolvedUnreadNotifications = viewer
    ? unreadNotifications ?? await getUnreadNotificationCount(viewer.id)
    : 0;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="app-shell-header sticky top-0 z-20 border-b border-[var(--line)] bg-white/92 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <div className="flex min-h-[72px] items-center justify-between gap-4 py-3">
            <div>
              <Link href={isOpsMode ? '/ops' : '/'} className="focus-ring pressable inline-flex rounded-md text-base font-bold tracking-tight text-[var(--secondary)]">
                {isOpsMode ? '모두의 러닝 운영' : '모두의 러닝'}
              </Link>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                {isOpsMode ? '운영 흐름과 공개 노출 상태를 확인하는 관리자 화면' : '대회 찾기부터 계획과 기록까지 이어지는 러닝 서비스'}
              </p>
            </div>

            {viewer ? (
              <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                <div className="hidden text-right sm:block">
                  <p className="max-w-[180px] truncate text-sm font-semibold text-slate-900">{viewer.displayName}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{roleLabel}</p>
                </div>
                <Link
                  href="/notifications"
                  className="focus-ring pressable inline-flex min-h-10 items-center gap-2 rounded-full border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-[rgba(255,107,84,0.22)] hover:text-[var(--secondary)]"
                >
                  <span>알림</span>
                  {resolvedUnreadNotifications > 0 ? (
                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--brand)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {resolvedUnreadNotifications > 99 ? '99+' : resolvedUnreadNotifications}
                    </span>
                  ) : null}
                </Link>
                <Link
                  href="/profile"
                  className="focus-ring pressable inline-flex min-h-10 items-center rounded-full border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-[rgba(255,107,84,0.22)] hover:text-[var(--secondary)]"
                >
                  프로필
                </Link>
                {viewer.isStaff ? (
                  <Link
                    href="/ops"
                    className="focus-ring pressable inline-flex min-h-10 items-center rounded-full bg-[#eef3f8] px-3 py-2 text-sm font-semibold text-[var(--secondary)] hover:bg-[#e4ebf2]"
                  >
                    {isOpsMode ? '운영 홈' : '관리'}
                  </Link>
                ) : null}
                <form action="/auth/logout" method="post">
                  <button
                    type="submit"
                    className="focus-ring pressable inline-flex min-h-10 items-center rounded-full border border-[var(--line)] bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:border-slate-300 hover:text-slate-900"
                  >
                    로그아웃
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href="/login"
                className="focus-ring public-primary-button pressable inline-flex min-h-11 items-center rounded-full px-4 py-2 text-sm font-semibold"
              >
                로그인
              </Link>
            )}
          </div>
          {!isOpsMode ? (
            <div className="hidden border-t border-[var(--line)] md:block">
              <ServiceTabs isStaff={viewer?.isStaff ?? false} />
            </div>
          ) : null}
        </div>
      </header>

      <main
        id="main-content"
        tabIndex={-1}
        className={`app-shell-main mx-auto w-full max-w-6xl px-4 ${compactIntro ? 'py-5 sm:py-6' : 'py-6 sm:py-8'} ${showBottomNav ? 'pb-24 md:pb-10' : 'pb-10'} sm:px-8`}
      >
        {showIntro ? (
          <section className={compactIntro ? 'mb-5 sm:mb-6' : 'mb-7 sm:mb-8'}>
            <h1
              className={
                compactIntro
                  ? 'text-balance text-[28px] font-bold tracking-tight text-[var(--secondary)] sm:text-[34px]'
                  : 'text-balance text-[32px] font-bold tracking-tight text-[var(--secondary)] sm:text-[40px]'
              }
            >
              {title}
            </h1>
            {description ? (
              <p
                className={
                  compactIntro
                    ? 'text-pretty mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)] sm:text-[15px]'
                    : 'text-pretty mt-3 max-w-3xl text-sm leading-6 text-[var(--muted)] sm:text-base'
                }
              >
                {description}
              </p>
            ) : null}
          </section>
        ) : null}
        {children}
      </main>

      <footer className="border-t border-[var(--line)] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 sm:px-8 sm:py-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-[var(--secondary)]">{isOpsMode ? '모두의 러닝 운영' : '모두의 러닝'}</p>
              <p className="mt-1 text-sm text-slate-500">
                {isOpsMode ? '운영 검수와 공개 노출 관리' : '찾기 → 고르기 → 계획하기 → 공유하기 흐름을 한곳에서'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-sm font-medium text-slate-600">
              {isOpsMode ? (
                <>
                  <Link href="/ops" className="focus-ring pressable inline-flex min-h-10 items-center rounded-md px-2 hover:text-[var(--secondary)]">
                    운영 홈
                  </Link>
                  <Link href="/races" className="focus-ring pressable inline-flex min-h-10 items-center rounded-md px-2 hover:text-[var(--secondary)]">
                    공개 대회 화면
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/races" className="focus-ring pressable inline-flex min-h-10 items-center rounded-md px-2 hover:text-[var(--secondary)]">
                    대회 일정
                  </Link>
                  <Link href="/plan" className="focus-ring pressable inline-flex min-h-10 items-center rounded-md px-2 hover:text-[var(--secondary)]">
                    월간 플랜
                  </Link>
                  <Link href="/community" className="focus-ring pressable inline-flex min-h-10 items-center rounded-md px-2 hover:text-[var(--secondary)]">
                    커뮤니티
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </footer>

      {!isOpsMode && showBottomNav ? <BottomNav /> : null}
    </div>
  );
}
