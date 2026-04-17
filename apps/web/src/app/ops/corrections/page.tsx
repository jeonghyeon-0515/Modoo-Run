import Link from 'next/link';
import { requireModerator } from '@/lib/auth/session';
import { PageShell } from '@/components/layout/page-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import { correctionStatuses, getCorrectionStatusLabel, isCorrectionStatus } from '@/lib/corrections/utils';
import { listRaceCorrectionRequestsForOps } from '@/lib/corrections/repository';
import { updateRaceCorrectionRequestAction } from './actions';

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
  return Boolean(message && /실패|문제|입력|선택/.test(message));
}

export default async function OpsCorrectionsPage({ searchParams }: { searchParams: SearchParams }) {
  const resolvedSearchParams = await searchParams;
  const statusParam = readFirstValue(resolvedSearchParams.status) ?? 'new';
  const selectedStatus = statusParam === 'all' || isCorrectionStatus(statusParam) ? statusParam : 'new';
  const message = readFirstValue(resolvedSearchParams.message);
  const viewer = await requireModerator('/ops/corrections');
  const { items } = await listRaceCorrectionRequestsForOps(selectedStatus);

  return (
    <PageShell
      viewer={viewer}
      title="대회 정보 수정 요청"
      description="사용자와 주최측이 보낸 정보 수정 요청을 검토하고 처리 상태를 남깁니다."
      compactIntro
    >
      <section className="rounded-[1.25rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">처리 기준</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              공식 링크나 주최측 근거가 확인되는 요청부터 반영하고, 처리 메모에는 확인한 근거를 짧게 남깁니다.
            </p>
          </div>
          <Link href="/ops" className="text-sm font-medium text-slate-500 hover:text-slate-900">
            관리자 홈
          </Link>
        </div>
      </section>

      {message ? (
        <section
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            isErrorMessage(message)
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          {message}
        </section>
      ) : null}

      <section className="mt-5 flex flex-wrap gap-2">
        <Link
          href="/ops/corrections?status=all"
          className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
            selectedStatus === 'all'
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
          }`}
        >
          전체
        </Link>
        {correctionStatuses.map((status) => (
          <Link
            key={status}
            href={`/ops/corrections?status=${status}`}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              selectedStatus === status
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`}
          >
            {getCorrectionStatusLabel(status)}
          </Link>
        ))}
      </section>

      <section className="mt-6 space-y-4">
        {items.length > 0 ? (
          items.map((item) => (
            <article key={item.id} className="rounded-[1.25rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={item.status === 'resolved' ? 'success' : item.status === 'rejected' ? 'warning' : 'neutral'}>
                      {item.statusLabel}
                    </StatusBadge>
                    <StatusBadge tone="neutral">{item.fieldKindLabel}</StatusBadge>
                    <StatusBadge tone="neutral">{item.requesterRoleLabel}</StatusBadge>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-slate-950">{item.raceTitle}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.raceRegion ?? '지역 미정'} · {item.raceEventDateLabel ?? '일정 미정'} · 접수 {formatKstDateTime(item.createdAt)}
                  </p>
                </div>
                <Link href={`/races/${item.sourceRaceId}`} className="text-sm font-semibold text-[var(--brand)]">
                  상세 보기
                </Link>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-500">현재 보이는 내용</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {item.currentValue ?? '입력 없음'}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-500">바르게 고칠 내용</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-900">{item.suggestedValue}</p>
                </div>
              </div>

              {item.message ? (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-semibold text-slate-500">참고 링크/설명</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{item.message}</p>
                </div>
              ) : null}

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                <p>
                  요청자: <span className="font-semibold text-slate-900">{item.requesterName}</span> · {item.requesterEmail}
                </p>
                {item.reviewedAt ? <p className="mt-1">마지막 처리: {formatKstDateTime(item.reviewedAt)}</p> : null}
              </div>

              <form action={updateRaceCorrectionRequestAction} className="mt-5 space-y-3">
                <input type="hidden" name="id" value={item.id} />
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">처리 상태</span>
                  <select
                    name="status"
                    defaultValue={item.status}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  >
                    {correctionStatuses.map((status) => (
                      <option key={status} value={status}>
                        {getCorrectionStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">운영 메모</span>
                  <textarea
                    name="adminNote"
                    defaultValue={item.adminNote ?? ''}
                    className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                    placeholder="확인한 공식 링크, 반영 여부, 보류 사유를 남겨주세요."
                  />
                </label>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    처리 상태 저장
                  </button>
                </div>
              </form>
            </article>
          ))
        ) : (
          <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            현재 조건에 해당하는 수정 요청이 없습니다.
          </div>
        )}
      </section>
    </PageShell>
  );
}
