import Link from 'next/link';
import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/page-shell';
import { formatRetryAfterSeconds } from '@/lib/monetization/rate-limit-helpers';
import { getOutboundClickDashboard } from '@/lib/races/outbound-report-repository';
import { getOutboundTargetLabel } from '@/lib/races/outbound-report';
import { getPartnerGuardScopeLabel, getPartnerInquiryTypeLabel } from '@/lib/monetization/utils';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: '외부 신청 흐름 | 모두의 러닝',
  description: '운영자 전용 외부 클릭 흐름 대시보드',
  robots: {
    index: false,
    follow: false,
  },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readFirstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Seoul',
  }).format(new Date(value));
}

function formatRate(value: number) {
  return `${value.toFixed(1)}%`;
}

function maskHash(value?: string | null) {
  if (!value) return '없음';
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function TrendBars({
  points,
}: {
  points: Array<{ dateLabel: string; viewCount: number; applyClickCount: number; otherClickCount: number }>;
}) {
  const maxValue = Math.max(...points.map((point) => Math.max(point.viewCount, point.applyClickCount + point.otherClickCount)), 1);

  return (
    <div className="mt-4">
      <div className="grid grid-cols-7 gap-2 sm:grid-cols-14">
        {points.map((point) => {
          const viewHeight = Math.max(8, Math.round((point.viewCount / maxValue) * 120));
          const clickHeight = Math.max(4, Math.round(((point.applyClickCount + point.otherClickCount) / maxValue) * 120));
          return (
            <div key={point.dateLabel} className="flex flex-col items-center gap-2">
              <div className="flex h-32 w-full items-end justify-center gap-1 rounded-2xl bg-slate-50 px-1 py-2">
                <div
                  className="w-3 rounded-full bg-slate-300"
                  style={{ height: `${viewHeight}px` }}
                  title={`${point.dateLabel} 상세 조회 ${point.viewCount}회`}
                />
                <div
                  className="w-3 rounded-full bg-[var(--brand)]"
                  style={{ height: `${clickHeight}px` }}
                  title={`${point.dateLabel} 외부 클릭 ${point.applyClickCount + point.otherClickCount}회`}
                />
              </div>
              <div className="text-center">
                <p className="text-[11px] font-semibold text-slate-500">{point.dateLabel}</p>
                <p className="text-[10px] text-slate-400">조회 {point.viewCount} · 클릭 {point.applyClickCount + point.otherClickCount}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-slate-300" />상세 조회</span>
        <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[var(--brand)]" />외부 클릭</span>
      </div>
    </div>
  );
}

function GuardTrendBars({
  points,
}: {
  points: Array<{ dateLabel: string; totalCount: number }>;
}) {
  const maxValue = Math.max(...points.map((point) => point.totalCount), 1);

  return (
    <div className="mt-4 overflow-x-auto">
      <div
        className="grid min-w-max gap-2"
        style={{ gridTemplateColumns: `repeat(${points.length}, minmax(28px, 1fr))` }}
      >
        {points.map((point) => {
          const barHeight = point.totalCount > 0 ? Math.max(8, Math.round((point.totalCount / maxValue) * 120)) : 4;
          return (
            <div key={point.dateLabel} className="flex flex-col items-center gap-2">
              <div className="flex h-32 w-full items-end justify-center rounded-2xl bg-slate-50 px-1 py-2">
                <div
                  className="w-4 rounded-full bg-amber-500/80"
                  style={{ height: `${barHeight}px` }}
                  title={`${point.dateLabel} 차단 ${point.totalCount}건`}
                />
              </div>
              <div className="text-center">
                <p className="text-[11px] font-semibold text-slate-500">{point.dateLabel}</p>
                <p className="text-[10px] text-slate-400">{point.totalCount}건</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-amber-500/80" />
          차단된 제출
        </span>
      </div>
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
        active
          ? 'bg-[var(--brand)] text-white'
          : 'bg-[var(--surface-muted)] text-slate-700 hover:bg-[var(--brand-soft)]'
      }`}
    >
      {children}
    </Link>
  );
}

export default async function OutboundClicksPage({ searchParams }: { searchParams: SearchParams }) {
  const resolvedSearchParams = await searchParams;
  const daysValue = Number(readFirstValue(resolvedSearchParams.days) ?? '7');
  const days = [7, 30, 90].includes(daysValue) ? daysValue : 7;
  const { outbound, partner } = await getOutboundClickDashboard(days);

  return (
    <PageShell
      title="외부 신청 흐름"
      description="최근 외부 이동 흐름을 확인할 수 있는 운영 화면입니다."
      compactIntro
    >
      <section className="rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">조회 기간</p>
            <p className="mt-1 text-sm text-slate-600">대회 상세에서 외부로 나간 클릭만 집계합니다.</p>
            <p className="mt-1 text-xs text-slate-400">전환율은 상세 조회 로그 기준으로 100%를 넘지 않게 보정합니다.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {[7, 30, 90].map((value) => (
              <FilterChip key={value} href={`/ops/outbound-clicks?days=${value}`} active={days === value}>
                최근 {value}일
              </FilterChip>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-3 sm:grid-cols-3">
        <article className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">총 상세 조회</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{outbound.totalViewCount}</p>
        </article>
        <article className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">지원 클릭</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{outbound.applyClickCount}</p>
        </article>
        <article className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">지원 전환율</p>
          <p className="mt-2 text-lg font-bold text-slate-950">
            {outbound.totalViewCount > 0 ? formatRate(outbound.applyConversionRate) : '데이터 없음'}
          </p>
          <p className="mt-1 text-xs text-slate-500">상세 조회 대비 지원 클릭 비율</p>
        </article>
      </section>

      <section className="mt-4 rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">차단 추이</h2>
            <p className="mt-1 text-sm text-slate-500">최근 기간 동안 문의 폼에서 차단된 제출 수를 날짜별로 봅니다.</p>
          </div>
          <p className="text-xs text-slate-500">최근 {days}일</p>
        </div>
        {partner.guardDailyTrend.some((point) => point.totalCount > 0) ? (
          <GuardTrendBars points={partner.guardDailyTrend} />
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
            아직 차단 추이를 그릴 데이터가 없습니다.
          </div>
        )}
      </section>

      <section className="mt-4 rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">날짜별 추이</h2>
            <p className="mt-1 text-sm text-slate-500">회색은 상세 조회, 주황색은 외부 클릭입니다.</p>
          </div>
          <p className="text-xs text-slate-500">최근 {days}일</p>
        </div>
        {outbound.dailyTrend.length > 0 ? (
          <TrendBars points={outbound.dailyTrend} />
        ) : (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
            아직 추이를 그릴 데이터가 없습니다.
          </div>
        )}
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="text-lg font-semibold text-slate-950">액션별 클릭 수</h2>
          <div className="mt-4 space-y-3">
            {outbound.targetSummaries.length > 0 ? (
              outbound.targetSummaries.map((item) => (
                <div key={item.targetKind} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span className="text-sm font-medium text-slate-700">{getOutboundTargetLabel(item.targetKind)}</span>
                  <span className="text-sm font-semibold text-slate-950">{item.count}회</span>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                아직 집계할 클릭 데이터가 없습니다.
              </div>
            )}
          </div>
        </article>

        <article className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950">대회별 지원 전환율</h2>
            <p className="text-xs text-slate-500">상세 조회 대비</p>
          </div>
          <div className="mt-4 space-y-3">
            {outbound.topConversionRaces.length > 0 ? (
              outbound.topConversionRaces.map((item, index) => (
                <div key={item.sourceRaceId} className="rounded-2xl border border-slate-200 px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--brand)]">#{index + 1}</p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">{item.raceTitle}</p>
                      <p className="mt-1 text-xs text-slate-500">sourceRaceId {item.sourceRaceId}</p>
                    </div>
                    <Link href={`/races/${item.sourceRaceId}`} className="text-sm font-semibold text-[var(--brand)]">
                      대회 보기
                    </Link>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 px-3 py-3">
                      <p className="text-[11px] font-semibold text-slate-400">상세 조회</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{item.viewCount}회</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-3 py-3">
                      <p className="text-[11px] font-semibold text-slate-400">지원 클릭</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{item.boundedApplyClickCount}회</p>
                    </div>
                    <div className="rounded-2xl bg-[var(--brand-soft)] px-3 py-3">
                      <p className="text-[11px] font-semibold text-[var(--brand-strong)]">전환율</p>
                      <p className="mt-1 text-sm font-semibold text-[var(--brand-strong)]">{formatRate(item.conversionRate)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                아직 전환율을 계산할 상세 조회 데이터가 없습니다.
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="mt-4 rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">많이 눌린 대회</h2>
            <p className="mt-1 text-sm text-slate-500">외부 클릭 총량이 많은 대회를 봅니다.</p>
          </div>
          <p className="text-xs text-slate-500">sourceRaceId 기준</p>
        </div>
        <div className="mt-4 space-y-3">
          {outbound.topRaces.length > 0 ? (
            outbound.topRaces.map((item, index) => (
              <div key={item.sourceRaceId} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[var(--brand)]">#{index + 1}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">{item.raceTitle}</p>
                  <p className="mt-1 text-xs text-slate-500">sourceRaceId {item.sourceRaceId}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-950">{item.count}회</p>
                  <Link href={`/races/${item.sourceRaceId}`} className="mt-1 inline-flex text-xs font-semibold text-[var(--brand)]">
                    대회 보기
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
              아직 클릭량이 많은 대회를 계산할 데이터가 없습니다.
            </div>
          )}
        </div>
      </section>

      <section className="mt-4 rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">최근 클릭 로그</h2>
            <p className="mt-1 text-sm text-slate-500">최근 외부 클릭 로그를 시간순으로 표시합니다.</p>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-3 py-3 font-semibold">시각</th>
                <th className="px-3 py-3 font-semibold">대회</th>
                <th className="px-3 py-3 font-semibold">액션</th>
                <th className="px-3 py-3 font-semibold">역할</th>
              </tr>
            </thead>
            <tbody>
              {outbound.recentEvents.length > 0 ? (
                outbound.recentEvents.map((event) => (
                  <tr key={`${event.sourceRaceId}-${event.targetKind}-${event.createdAt}`} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-3 py-3 text-slate-600">{formatDateTime(event.createdAt)}</td>
                    <td className="px-3 py-3">
                      <Link href={`/races/${event.sourceRaceId}`} className="font-semibold text-slate-900 hover:text-[var(--brand)]">
                        {event.raceTitle}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-slate-700">{getOutboundTargetLabel(event.targetKind)}</td>
                    <td className="px-3 py-3 text-slate-500">{event.viewerRole}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                    아직 표시할 클릭 로그가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <article className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="text-lg font-semibold text-slate-950">광고 · 제휴 문의 현황</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">문의 수</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{partner.totalLeadCount}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">문의 진입 클릭</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{partner.totalClickCount}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">차단된 제출</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{partner.totalGuardCount}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-900">문의 유형별</p>
              {partner.leadSummaries.length > 0 ? (
                partner.leadSummaries.map((item) => (
                  <div key={item.inquiryType} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                    <span className="text-sm font-medium text-slate-700">{getPartnerInquiryTypeLabel(item.inquiryType)}</span>
                    <span className="text-sm font-semibold text-slate-950">{item.count}건</span>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                  아직 접수된 문의가 없습니다.
                </div>
              )}
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-900">차단 기준별</p>
              {partner.guardSummaries.length > 0 ? (
                partner.guardSummaries.map((item) => (
                  <div key={item.blockedScope} className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3">
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                    <span className="text-sm font-semibold text-slate-950">{item.count}건</span>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                  아직 차단된 제출이 없습니다.
                </div>
              )}
            </div>
          </div>
        </article>

        <article className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950">최근 광고 · 제휴 문의</h2>
            <Link href="/advertise" className="text-sm font-medium text-slate-500 hover:text-slate-900">
              문의 페이지
            </Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="px-3 py-3 font-semibold">시각</th>
                  <th className="px-3 py-3 font-semibold">이름</th>
                  <th className="px-3 py-3 font-semibold">브랜드/주최측</th>
                  <th className="px-3 py-3 font-semibold">유형</th>
                  <th className="px-3 py-3 font-semibold">상태</th>
                </tr>
              </thead>
              <tbody>
                {partner.recentLeads.length > 0 ? (
                  partner.recentLeads.map((lead) => (
                    <tr key={lead.id} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-3 py-3 text-slate-600">{formatDateTime(lead.created_at)}</td>
                      <td className="px-3 py-3 text-slate-900">{lead.name}</td>
                      <td className="px-3 py-3 text-slate-700">{lead.organization_name}</td>
                      <td className="px-3 py-3 text-slate-700">{getPartnerInquiryTypeLabel(lead.inquiry_type)}</td>
                      <td className="px-3 py-3 text-slate-500">{lead.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                      아직 표시할 문의가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section className="mt-4 rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">최근 차단 로그</h2>
            <p className="mt-1 text-sm text-slate-500">문의 폼 rate limit으로 막힌 최근 제출 기록입니다.</p>
          </div>
          <p className="text-xs text-slate-500">원문 이메일/IP는 저장하지 않습니다.</p>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="px-3 py-3 font-semibold">시각</th>
                <th className="px-3 py-3 font-semibold">기준</th>
                <th className="px-3 py-3 font-semibold">재시도</th>
                <th className="px-3 py-3 font-semibold">유입 경로</th>
                <th className="px-3 py-3 font-semibold">해시 식별자</th>
              </tr>
            </thead>
            <tbody>
              {partner.recentGuardEvents.length > 0 ? (
                partner.recentGuardEvents.map((event) => (
                  <tr key={event.id} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-3 py-3 text-slate-600">{formatDateTime(event.created_at)}</td>
                    <td className="px-3 py-3 text-slate-700">{getPartnerGuardScopeLabel(event.blocked_scope)}</td>
                    <td className="px-3 py-3 text-slate-700">{formatRetryAfterSeconds(event.retry_after_seconds)}</td>
                    <td className="px-3 py-3 text-slate-600">{event.source_path ?? '/advertise'}</td>
                    <td className="px-3 py-3 text-xs text-slate-500">
                      <div>email {maskHash(event.email_hash)}</div>
                      <div>ip {maskHash(event.ip_hash)}</div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                    아직 표시할 차단 로그가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </PageShell>
  );
}
