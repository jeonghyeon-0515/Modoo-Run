import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import { listViewerNotifications } from '@/lib/notifications/repository';
import { markAllNotificationsAsReadAction, markNotificationAsReadAction } from './actions';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readFirstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function formatKstDateTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Seoul',
  }).format(new Date(value));
}

function isErrorMessage(message?: string) {
  return Boolean(message && /문제|실패|오류/.test(message));
}

export default async function NotificationsPage({ searchParams }: { searchParams: SearchParams }) {
  const resolvedSearchParams = await searchParams;
  const filter = readFirstValue(resolvedSearchParams.filter) === 'unread' ? 'unread' : 'all';
  const message = readFirstValue(resolvedSearchParams.message);
  const { items, viewer } = await listViewerNotifications({ filter });
  const unreadCount = items.filter((item) => !item.isRead).length;

  return (
    <PageShell
      title="알림함"
      description="저장한 대회와 관련된 내부 알림을 확인하고 읽음 처리할 수 있습니다."
      compactIntro
      viewer={viewer}
    >
      {message ? (
        <section
          className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
            isErrorMessage(message)
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          {message}
        </section>
      ) : null}

      <section className="rounded-[1.25rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-950">
              {filter === 'unread' ? `읽지 않은 알림 ${unreadCount}개` : `전체 알림 ${items.length}개`}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              대회 저장/변경/마감 알림을 이곳에 모아둘 예정입니다.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/notifications?filter=all"
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                filter === 'all'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              전체
            </Link>
            <Link
              href="/notifications?filter=unread"
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                filter === 'unread'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              읽지 않음
            </Link>
            <form action={markAllNotificationsAsReadAction}>
              <input type="hidden" name="filter" value={filter} />
              <button
                type="submit"
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                전체 읽음
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="mt-5 space-y-4">
        {items.length > 0 ? (
          items.map((item) => (
            <article key={item.id} className="rounded-[1.25rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={item.isRead ? 'neutral' : 'success'}>
                      {item.isRead ? '읽음' : '새 알림'}
                    </StatusBadge>
                    <StatusBadge tone="disclosure">{item.notificationTypeLabel}</StatusBadge>
                  </div>
                  <h2 className="mt-3 text-base font-semibold text-slate-950">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p>
                </div>
                <p className="text-xs text-slate-400">{formatKstDateTime(item.createdAt)}</p>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <Link href={item.sourcePath} className="text-sm font-semibold text-[var(--brand)]">
                  관련 화면 보기
                </Link>
                {!item.isRead ? (
                  <form action={markNotificationAsReadAction}>
                    <input type="hidden" name="notificationId" value={item.id} />
                    <input type="hidden" name="filter" value={filter} />
                    <button
                      type="submit"
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                    >
                      읽음 처리
                    </button>
                  </form>
                ) : (
                  <span className="text-xs text-slate-400">
                    {item.readAt ? `읽음 ${formatKstDateTime(item.readAt)}` : '읽음 처리됨'}
                  </span>
                )}
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            아직 도착한 알림이 없습니다. 관심 대회를 저장하면 첫 내부 알림이 이곳에 쌓입니다.
          </div>
        )}
      </section>
    </PageShell>
  );
}
