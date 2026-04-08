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

  return (
    <PageShell
      title="월간 플랜"
      description="목표 대회를 중심으로 한 달 계획을 만들고, 날짜별 진행 상황을 기록하며 완료율과 연속 달성을 함께 확인합니다."
    >
      {!viewer ? (
        <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
          <p className="text-lg font-semibold text-slate-950">로그인 후 개인 플랜을 사용할 수 있습니다.</p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            대회 탐색은 계속 이용할 수 있고, 로그인하면 월별 계획 생성/수정/달성 체크가 본인 계정에만 저장됩니다.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/login?next=${encodeURIComponent(`/plan?year=${year}&month=${month}`)}`}
              className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
            >
              로그인하고 플랜 시작하기
            </Link>
            <Link
              href="/races"
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              먼저 대회 둘러보기
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
              <p className="text-sm font-medium text-slate-500">이번 달 완료율</p>
              <p className="mt-3 text-3xl font-bold text-slate-950">{stats.completionRate}%</p>
            </article>
            <article className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
              <p className="text-sm font-medium text-slate-500">계획 수</p>
              <p className="mt-3 text-3xl font-bold text-slate-950">{stats.totalCount}개</p>
            </article>
            <article className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
              <p className="text-sm font-medium text-slate-500">연속 달성</p>
              <p className="mt-3 text-3xl font-bold text-slate-950">{stats.streak}일</p>
            </article>
          </section>

          <section className="mt-6 rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">{monthTitle}</h2>
                <p className="mt-2 text-sm text-slate-600">월간 계획은 저장하면 계속 수정할 수 있고, 각 아이템은 상태를 기록하며 누적됩니다.</p>
              </div>
              <div className="flex items-center gap-2">
                <Link href={monthHref(prevMonth.year, prevMonth.month)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  이전 달
                </Link>
                <Link href={monthHref(nextMonth.year, nextMonth.month)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  다음 달
                </Link>
              </div>
            </div>

            <form action={upsertMonthlyPlanAction} className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <input type="hidden" name="year" value={year} />
              <input type="hidden" name="month" value={month} />
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">플랜 제목</span>
                  <input
                    name="title"
                    defaultValue={plan?.title ?? `${monthTitle} 러닝 플랜`}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-blue-400"
                    placeholder="예: 10km 봄 시즌 대비"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">메모</span>
                  <textarea
                    name="notes"
                    defaultValue={plan?.notes ?? ''}
                    className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                    placeholder="이번 달 목표, 회복 전략, 주간 훈련 포인트를 적어두세요."
                  />
                </label>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">목표 대회</span>
                  <select
                    name="targetRaceId"
                    defaultValue={plan?.target_race_id ?? ''}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                  >
                    <option value="">선택 안 함</option>
                    {races.map((race) => (
                      <option key={race.id} value={race.id}>
                        {race.title} · {formatRaceDate(race.eventDate, race.eventDateLabel)}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">목표 거리 (km)</span>
                    <input
                      type="number"
                      step="0.1"
                      name="goalDistanceKm"
                      defaultValue={plan?.goal_distance_km ?? ''}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                      placeholder="40"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">목표 세션 수</span>
                    <input
                      type="number"
                      name="goalSessions"
                      defaultValue={plan?.goal_sessions ?? ''}
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                      placeholder="12"
                    />
                  </label>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
                  >
                    {plan ? '플랜 수정하기' : '플랜 만들기'}
                  </button>
                  {plan ? (
                    <>
                      <input type="hidden" name="planId" value={plan.id} />
                      <button
                        type="submit"
                        formAction={deleteMonthlyPlanAction}
                        className="inline-flex items-center justify-center rounded-full border border-red-200 px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        플랜 삭제
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </form>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <article className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">이번 달 계획 아이템</h3>
                  <p className="mt-2 text-sm text-slate-600">날짜별 계획을 만들고, 상태 버튼으로 완료 / 부분 완료 / 건너뜀을 바로 기록할 수 있습니다.</p>
                </div>
              </div>

              {!plan ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                  아직 이 달의 플랜이 없습니다. 위 폼에서 먼저 월간 플랜을 저장하면 아이템을 추가할 수 있습니다.
                </div>
              ) : items.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                  아직 계획 아이템이 없습니다. 오른쪽 폼에서 첫 훈련 계획을 추가해보세요.
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
                        <StatusBadge tone={getPlanStatusTone(item.status)}>
                          {statusOptions.find((option) => option.value === item.status)?.label ?? item.status}
                        </StatusBadge>
                      </div>

                      <p className="mt-3 text-sm text-slate-600">
                        {item.category} · {item.target_distance_km ? `${item.target_distance_km}km` : '거리 미정'} ·{' '}
                        {item.target_duration_minutes ? `${item.target_duration_minutes}분` : '시간 미정'}
                      </p>
                      {item.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p> : null}

                      <div className="mt-4 flex flex-wrap gap-2">
                        {statusOptions.map((option) => (
                          <form key={option.value} action={setPlanItemStatusAction}>
                            <input type="hidden" name="itemId" value={item.id} />
                            <input type="hidden" name="status" value={option.value} />
                            <button
                              type="submit"
                              className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                                item.status === option.value
                                  ? 'bg-[var(--brand)] text-white'
                                  : 'bg-[var(--surface-muted)] text-slate-700 hover:bg-[var(--brand-soft)]'
                              }`}
                            >
                              {option.label}
                            </button>
                          </form>
                        ))}
                      </div>

                      <details className="mt-4 rounded-2xl bg-slate-50 p-4">
                        <summary className="cursor-pointer text-sm font-semibold text-slate-700">아이템 수정</summary>
                        <form action={updatePlanItemAction} className="mt-4 space-y-3">
                          <input type="hidden" name="itemId" value={item.id} />
                          <div className="grid gap-3 sm:grid-cols-2">
                            <input
                              type="date"
                              name="scheduledDate"
                              defaultValue={item.scheduled_date}
                              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                            />
                            <select
                              name="category"
                              defaultValue={item.category}
                              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
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
                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                          />
                          <textarea
                            name="description"
                            defaultValue={item.description ?? ''}
                            className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                          />
                          <div className="grid gap-3 sm:grid-cols-2">
                            <input
                              type="number"
                              step="0.1"
                              name="targetDistanceKm"
                              defaultValue={item.target_distance_km ?? ''}
                              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                              placeholder="목표 거리"
                            />
                            <input
                              type="number"
                              name="targetDurationMinutes"
                              defaultValue={item.target_duration_minutes ?? ''}
                              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                              placeholder="목표 시간(분)"
                            />
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <button
                              type="submit"
                              className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
                            >
                              아이템 수정
                            </button>
                            <button
                              type="submit"
                              formAction={deletePlanItemAction}
                              className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                            >
                              삭제
                            </button>
                          </div>
                        </form>
                      </details>
                    </article>
                  ))}
                </div>
              )}
            </article>

            <aside className="space-y-6">
              <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
                <h3 className="text-lg font-semibold text-slate-950">새 계획 아이템 추가</h3>
                <p className="mt-2 text-sm text-slate-600">달력 셀 대신 빠르게 추가하는 방식으로 먼저 시작합니다.</p>
                {plan ? (
                  <form action={createPlanItemAction} className="mt-5 space-y-3">
                    <input type="hidden" name="planId" value={plan.id} />
                    <input
                      type="date"
                      name="scheduledDate"
                      defaultValue={createDateInputValue(year, month)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                    />
                    <select
                      name="category"
                      defaultValue="easy_run"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                    >
                      {categoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <input
                      name="title"
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                      placeholder="예: 수요일 템포 런"
                    />
                    <textarea
                      name="description"
                      className="min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                      placeholder="훈련 메모나 목표 페이스를 적어두세요."
                    />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        type="number"
                        step="0.1"
                        name="targetDistanceKm"
                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                        placeholder="거리 (km)"
                      />
                      <input
                        type="number"
                        name="targetDurationMinutes"
                        className="rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                        placeholder="시간 (분)"
                      />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex w-full items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
                    >
                      계획 아이템 추가
                    </button>
                  </form>
                ) : (
                  <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                    먼저 월간 플랜을 만든 뒤 아이템을 추가할 수 있습니다.
                  </div>
                )}
              </section>

          <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h3 className="text-lg font-semibold text-slate-950">요약</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <p>완료 {stats.completedCount}개</p>
              <p>부분 완료 {stats.partialCount}개</p>
              <p>건너뜀 {stats.skippedCount}개</p>
              <p>연속 달성 {stats.streak}일</p>
            </div>
          </section>

          {!plan || items.length === 0 ? (
            <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
              <h3 className="text-lg font-semibold text-slate-950">시작용 추천 템플릿</h3>
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
      </section>
        </>
      )}
    </PageShell>
  );
}
