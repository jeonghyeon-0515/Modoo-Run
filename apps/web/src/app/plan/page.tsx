import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatRaceDate } from '@/lib/races/formatters';
import { listRaces } from '@/lib/races/repository';
import { buildPlanStarterTemplates } from '@/lib/ui/catalog-insights';
import { PlanItemStatus } from '@/lib/plans/stats';
import { getPlanView } from '@/lib/plans/repository';
import {
  createPlanItemAction,
  deleteMonthlyPlanAction,
  deletePlanItemAction,
  setPlanItemStatusAction,
  updatePlanItemAction,
  upsertMonthlyPlanAction,
} from './actions';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const statusOptions: Array<{ label: string; value: PlanItemStatus }> = [
  { label: '예정', value: 'planned' },
  { label: '완료', value: 'completed' },
  { label: '부분 완료', value: 'partial' },
  { label: '건너뜀', value: 'skipped' },
];

const categoryOptions = [
  { label: '이지런', value: 'easy_run' },
  { label: '템포', value: 'tempo' },
  { label: '인터벌', value: 'interval' },
  { label: '롱런', value: 'long_run' },
  { label: '회복', value: 'recovery' },
  { label: '레이스', value: 'race' },
  { label: '휴식', value: 'rest' },
  { label: '크로스트레이닝', value: 'cross_training' },
  { label: '직접입력', value: 'custom' },
];

function readValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function getCurrentYearMonth() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
  }).format(new Date());
  const [year, month] = formatter.split('-').map(Number);
  return { year, month };
}

function shiftMonth(year: number, month: number, offset: number) {
  const base = new Date(Date.UTC(year, month - 1 + offset, 1));
  return {
    year: base.getUTCFullYear(),
    month: base.getUTCMonth() + 1,
  };
}

function monthHref(year: number, month: number) {
  return `/plan?year=${year}&month=${month}`;
}

function getPlanStatusTone(status: PlanItemStatus) {
  if (status === 'completed') return 'success' as const;
  if (status === 'partial') return 'warning' as const;
  return 'neutral' as const;
}

function createDateInputValue(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

function getStatusLabel(status: PlanItemStatus) {
  return statusOptions.find((option) => option.value === status)?.label ?? status;
}

export default async function PlanPage({ searchParams }: { searchParams: SearchParams }) {
  const resolvedSearchParams = await searchParams;
  const current = getCurrentYearMonth();
  const year = Number(readValue(resolvedSearchParams.year) ?? current.year);
  const month = Number(readValue(resolvedSearchParams.month) ?? current.month);

  const [{ plan, items, stats, viewer }, races] = await Promise.all([
    getPlanView(year, month),
    listRaces({ registrationStatus: 'all', limit: 30 }),
  ]);

  const prevMonth = shiftMonth(year, month, -1);
  const nextMonth = shiftMonth(year, month, 1);
  const monthTitle = `${year}년 ${month}월`;
  const starterTemplates = buildPlanStarterTemplates(races);
  const targetRaceLabel = plan?.target_race_id
    ? races.find((race) => race.id === plan.target_race_id)?.title ?? null
    : null;

  return (
    <PageShell
      title="이번 달 러닝 계획"
      description="이번 달 계획과 실행 기록을 관리합니다."
      viewer={viewer}
    >
      {!viewer ? (
        <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
          <p className="text-lg font-semibold text-slate-950">로그인하면 내 계획을 볼 수 있습니다.</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            로그인하면 이번 달 계획과 실행 기록을 계정에 저장할 수 있습니다.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/login?next=${encodeURIComponent(`/plan?year=${year}&month=${month}`)}`}
              className="focus-ring inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
            >
              로그인하고 계획 보기
            </Link>
            <Link
              href="/races"
              className="focus-ring inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              대회 일정 보기
            </Link>
          </div>

          <div className="mt-8 grid gap-3 lg:grid-cols-3">
            {starterTemplates.map((template) => (
              <article key={template.id} className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{template.accent}</p>
                <h3 className="mt-2 text-sm font-semibold text-slate-950">{template.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{template.description}</p>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <article className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
              <p className="text-sm font-medium text-slate-500">이번 달 실행률</p>
              <p className="mt-3 text-3xl font-bold text-slate-950">{stats.completionRate}%</p>
            </article>
            <article className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
              <p className="text-sm font-medium text-slate-500">잡아둔 일정</p>
              <p className="mt-3 text-3xl font-bold text-slate-950">{stats.totalCount}개</p>
            </article>
            <article className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
              <p className="text-sm font-medium text-slate-500">이어 달린 날</p>
              <p className="mt-3 text-3xl font-bold text-slate-950">{stats.streak}일</p>
            </article>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <aside className="order-1 space-y-6 lg:order-2">
              <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">이번 달 한눈에 보기</h3>
                    <p className="mt-2 text-sm text-slate-600">{monthTitle} 목표와 진행 상태를 빠르게 확인합니다.</p>
                  </div>
                  {plan ? <StatusBadge tone="neutral">계획 저장됨</StatusBadge> : <StatusBadge tone="warning">계획 필요</StatusBadge>}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.25rem] bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-400">완료한 일정</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">{stats.completedCount}개</p>
                  </div>
                  <div className="rounded-[1.25rem] bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-400">부분 완료</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">{stats.partialCount}개</p>
                  </div>
                  <div className="rounded-[1.25rem] bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-400">쉬어간 일정</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">{stats.skippedCount}개</p>
                  </div>
                  <div className="rounded-[1.25rem] bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-slate-400">이어 달린 날</p>
                    <p className="mt-2 text-lg font-semibold text-slate-950">{stats.streak}일</p>
                  </div>
                </div>
              </section>

              <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">새 일정 추가</h3>
                    <p className="mt-2 text-sm text-slate-600">달릴 일정 한 개부터 가볍게 추가할 수 있습니다.</p>
                  </div>
                  <StatusBadge tone="neutral">빠른 입력</StatusBadge>
                </div>
                {plan ? (
                  <form action={createPlanItemAction} className="mt-5 space-y-3">
                    <input type="hidden" name="planId" value={plan.id} />
                    <input
                      type="date"
                      name="scheduledDate"
                      defaultValue={createDateInputValue(year, month)}
                      className="focus-ring w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                    />
                    <select
                      name="category"
                      defaultValue="easy_run"
                      className="focus-ring w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                    >
                      {categoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <input
                      name="title"
                      autoComplete="off"
                      spellCheck={false}
                      className="focus-ring w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                      placeholder="퇴근 후 5km"
                    />
                    <textarea
                      name="description"
                      autoComplete="off"
                      spellCheck
                      className="focus-ring min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                      placeholder="메모 또는 목표 페이스"
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        type="number"
                        step="0.1"
                        inputMode="decimal"
                        autoComplete="off"
                        name="targetDistanceKm"
                        className="focus-ring rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                        placeholder="거리 (km)"
                      />
                      <input
                        type="number"
                        inputMode="numeric"
                        autoComplete="off"
                        name="targetDurationMinutes"
                        className="focus-ring rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                        placeholder="시간 (분)"
                      />
                    </div>
                    <button
                      type="submit"
                      className="focus-ring inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
                    >
                      이 일정 추가하기
                    </button>
                  </form>
                ) : (
                  <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                    먼저 아래에서 이번 달 계획을 만든 뒤 일정을 추가하세요.
                  </div>
                )}
              </section>

              {!plan || items.length === 0 ? (
                <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
                  <h3 className="text-lg font-semibold text-slate-950">시작 예시</h3>
                  <div className="mt-4 space-y-3">
                    {starterTemplates.map((template) => (
                      <article key={template.id} className="rounded-[1.25rem] border border-slate-200 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{template.accent}</p>
                        <h4 className="mt-2 text-sm font-semibold text-slate-950">{template.title}</h4>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{template.description}</p>
                      </article>
                    ))}
                  </div>
                </section>
              ) : null}
            </aside>

            <div className="order-2 space-y-6 lg:order-1">
              <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">{monthTitle} 계획</h3>
                    <p className="mt-2 text-sm text-slate-600">
                      {plan
                        ? '이번 달 목표와 메모를 가볍게 정리해두면 아래 일정 관리가 더 쉬워집니다.'
                        : '먼저 월간 계획을 만들고, 그다음 일정과 실행 상태를 채워보세요.'}
                    </p>
                  </div>
                  {targetRaceLabel ? <StatusBadge tone="success">목표 대회 {targetRaceLabel}</StatusBadge> : null}
                </div>

                {plan ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-[1.25rem] bg-slate-50 p-4">
                      <p className="text-xs font-semibold text-slate-400">월간 목표 거리</p>
                      <p className="mt-2 text-base font-semibold text-slate-950">
                        {plan.goal_distance_km ? `${plan.goal_distance_km}km` : '아직 없음'}
                      </p>
                    </div>
                    <div className="rounded-[1.25rem] bg-slate-50 p-4">
                      <p className="text-xs font-semibold text-slate-400">목표 횟수</p>
                      <p className="mt-2 text-base font-semibold text-slate-950">
                        {plan.goal_sessions ? `${plan.goal_sessions}회` : '아직 없음'}
                      </p>
                    </div>
                    <div className="rounded-[1.25rem] bg-slate-50 p-4">
                      <p className="text-xs font-semibold text-slate-400">메모</p>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-700">{plan.notes?.trim() || '간단한 메모를 남겨둘 수 있어요.'}</p>
                    </div>
                  </div>
                ) : null}

                <form action={upsertMonthlyPlanAction} className="mt-5 space-y-3 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                  <input type="hidden" name="year" value={year} />
                  <input type="hidden" name="month" value={month} />
                  <input
                    name="title"
                    defaultValue={plan?.title ?? ''}
                    autoComplete="off"
                    spellCheck={false}
                    className="focus-ring w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                    placeholder="예: 5월 하프 대비 페이스 끌어올리기"
                  />
                  <textarea
                    name="notes"
                    defaultValue={plan?.notes ?? ''}
                    autoComplete="off"
                    spellCheck
                    className="focus-ring min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                    placeholder="이번 달에 챙길 메모나 컨디션 목표"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="number"
                      step="0.1"
                      inputMode="decimal"
                      autoComplete="off"
                      name="goalDistanceKm"
                      defaultValue={plan?.goal_distance_km ?? ''}
                      className="focus-ring rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                      placeholder="목표 거리 (km)"
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      autoComplete="off"
                      name="goalSessions"
                      defaultValue={plan?.goal_sessions ?? ''}
                      className="focus-ring rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                      placeholder="목표 횟수"
                    />
                  </div>
                  <select
                    name="targetRaceId"
                    defaultValue={plan?.target_race_id ?? ''}
                    className="focus-ring w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                  >
                    <option value="">목표 대회 선택 안 함</option>
                    {races.map((race) => (
                      <option key={race.id} value={race.id}>
                        {race.title}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="focus-ring inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
                  >
                    {plan ? '이번 달 계획 업데이트' : '이번 달 계획 만들기'}
                  </button>
                </form>
                {plan ? (
                  <form action={deleteMonthlyPlanAction} className="mt-3 flex justify-end">
                    <input type="hidden" name="planId" value={plan.id} />
                    <button
                      type="submit"
                      className="focus-ring inline-flex min-h-11 items-center justify-center rounded-full border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                    >
                      월간 계획 삭제
                    </button>
                  </form>
                ) : null}
              </section>

              <article className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-950">이번 달 달리기 일정</h3>
                    <p className="mt-2 text-sm text-slate-600">날짜별 일정과 실행 상태를 기록합니다.</p>
                  </div>
                </div>

                {!plan ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                    이번 달 계획이 없습니다. 위에서 계획을 먼저 만드세요.
                  </div>
                ) : items.length === 0 ? (
                  <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                    등록된 일정이 없습니다. 새 일정 추가 영역에서 먼저 일정을 입력해보세요.
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
                    {items.map((item) => (
                      <article key={item.id} className="rounded-[1.5rem] border border-slate-200 p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{formatRaceDate(item.scheduled_date, item.scheduled_date)}</p>
                            <h4 className="mt-1 text-base font-semibold text-slate-950">{item.title}</h4>
                          </div>
                          <StatusBadge tone={getPlanStatusTone(item.status)}>{getStatusLabel(item.status)}</StatusBadge>
                        </div>

                        <p className="mt-3 text-sm text-slate-600">
                          {item.category} · {item.target_distance_km ? `${item.target_distance_km}km` : '거리 미정'} ·{' '}
                          {item.target_duration_minutes ? `${item.target_duration_minutes}분` : '시간 미정'}
                        </p>
                        {item.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p> : null}

                        <form action={setPlanItemStatusAction} className="mt-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                          <input type="hidden" name="itemId" value={item.id} />
                          <label className="block text-xs font-semibold text-slate-500">실행 상태</label>
                          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <select
                              name="status"
                              defaultValue={item.status}
                              className="focus-ring min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                            >
                              {statusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <button
                              type="submit"
                              className="focus-ring inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                              상태 저장
                            </button>
                          </div>
                        </form>

                        <details className="mt-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                          <summary className="cursor-pointer list-none text-sm font-semibold text-slate-900">
                            <span className="inline-flex items-center gap-2">일정 수정 열기</span>
                          </summary>
                          <form action={updatePlanItemAction} className="mt-4 space-y-3">
                            <input type="hidden" name="itemId" value={item.id} />
                            <div className="grid gap-3 sm:grid-cols-2">
                              <input
                                type="date"
                                name="scheduledDate"
                                defaultValue={item.scheduled_date}
                                className="focus-ring rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                              />
                              <select
                                name="category"
                                defaultValue={item.category}
                                className="focus-ring rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                              >
                                {categoryOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <input
                              name="title"
                              defaultValue={item.title}
                              autoComplete="off"
                              spellCheck={false}
                              className="focus-ring w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                            />
                            <textarea
                              name="description"
                              defaultValue={item.description ?? ''}
                              autoComplete="off"
                              spellCheck
                              className="focus-ring min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                            />
                            <div className="grid gap-3 sm:grid-cols-2">
                              <input
                                type="number"
                                step="0.1"
                                inputMode="decimal"
                                autoComplete="off"
                                name="targetDistanceKm"
                                defaultValue={item.target_distance_km ?? ''}
                                className="focus-ring rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                                placeholder="8"
                              />
                              <input
                                type="number"
                                inputMode="numeric"
                                autoComplete="off"
                                name="targetDurationMinutes"
                                defaultValue={item.target_duration_minutes ?? ''}
                                className="focus-ring rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                                placeholder="50"
                              />
                            </div>
                            <button
                              type="submit"
                              className="focus-ring inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--brand)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
                            >
                              일정 수정 저장
                            </button>
                          </form>
                          <form action={deletePlanItemAction} className="mt-3">
                            <input type="hidden" name="itemId" value={item.id} />
                            <button
                              type="submit"
                              className="focus-ring inline-flex min-h-11 items-center justify-center rounded-full border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                            >
                              일정 삭제
                            </button>
                          </form>
                        </details>
                      </article>
                    ))}
                  </div>
                )}
              </article>
            </div>
          </section>
        </>
      )}
    </PageShell>
  );
}
