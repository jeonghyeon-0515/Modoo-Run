import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/layout/page-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  correctionFieldKinds,
  correctionRequesterRoles,
  getCorrectionFieldKindLabel,
  getCorrectionRequesterRoleLabel,
} from '@/lib/corrections/utils';
import { formatRaceDate } from '@/lib/races/formatters';
import { getRaceBySourceRaceId } from '@/lib/races/repository';
import { createRaceCorrectionRequestAction } from './actions';
import { RaceCorrectionSubmitButton } from './submit-button';

type Params = Promise<{ raceId: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readFirstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function isErrorMessage(message?: string) {
  return Boolean(message && /문제|실패|오류|입력|찾을 수|짧은 시간|선택/.test(message));
}

export default async function RaceCorrectionPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const [{ raceId }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const race = await getRaceBySourceRaceId(raceId);

  if (!race) {
    notFound();
  }

  const message = readFirstValue(resolvedSearchParams.message);
  const isError = isErrorMessage(message);
  const racePath = `/races/${race.sourceRaceId}`;

  return (
    <PageShell
      title="대회 정보 수정 요청"
      description="일정, 장소, 접수기간 등 잘못된 정보가 있으면 운영팀에 알려주세요."
      compactIntro
    >
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-[1.25rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center gap-2">
            <StatusBadge tone="neutral">{race.region ?? '지역 미정'}</StatusBadge>
            <StatusBadge tone="neutral">{formatRaceDate(race.eventDate, race.eventDateLabel)}</StatusBadge>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-950">{race.title}</h2>
          <dl className="mt-5 space-y-4 text-sm">
            <div>
              <dt className="font-semibold text-slate-500">장소</dt>
              <dd className="mt-1 text-slate-900">{race.location ?? '장소 정보 없음'}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">접수기간</dt>
              <dd className="mt-1 text-slate-900">{race.registrationPeriodLabel ?? '접수기간 정보 없음'}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">종목</dt>
              <dd className="mt-1 text-slate-900">{race.courseSummary ?? '종목 정보 없음'}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">주최</dt>
              <dd className="mt-1 text-slate-900">{race.organizer ?? '주최 정보 없음'}</dd>
            </div>
          </dl>
          <Link href={racePath} className="mt-6 inline-flex text-sm font-semibold text-[var(--brand)]">
            대회 상세로 돌아가기 →
          </Link>
        </article>

        <section className="rounded-[1.25rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
          {message ? (
            <div
              aria-live="polite"
              className={`rounded-xl border px-4 py-3 text-sm ${
                isError
                  ? 'border-amber-200 bg-amber-50 text-amber-800'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800'
              }`}
            >
              {message}
            </div>
          ) : null}

          <form action={createRaceCorrectionRequestAction} className="mt-6 space-y-4">
            <input type="hidden" name="sourceRaceId" value={race.sourceRaceId} />
            <input type="hidden" name="sourcePath" value={racePath} />
            <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden">
              <label htmlFor="correction-website">웹사이트</label>
              <input id="correction-website" name="website" tabIndex={-1} autoComplete="off" />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">이름</span>
                <input
                  name="requesterName"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[rgba(255,107,84,0.34)]"
                  placeholder="홍길동"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">이메일</span>
                <input
                  name="requesterEmail"
                  type="email"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[rgba(255,107,84,0.34)]"
                  placeholder="contact@example.com"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">요청자 유형</span>
                <select
                  name="requesterRole"
                  defaultValue="runner"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[rgba(255,107,84,0.34)]"
                >
                  {correctionRequesterRoles.map((role) => (
                    <option key={role} value={role}>
                      {getCorrectionRequesterRoleLabel(role)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">수정할 정보</span>
                <select
                  name="fieldKind"
                  defaultValue="date"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[rgba(255,107,84,0.34)]"
                >
                  {correctionFieldKinds.map((kind) => (
                    <option key={kind} value={kind}>
                      {getCorrectionFieldKindLabel(kind)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">현재 보이는 내용</span>
              <textarea
                name="currentValue"
                className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[rgba(255,107,84,0.34)]"
                placeholder="예: 접수기간이 2026년 4월 17일까지로 표시되어 있습니다."
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">바르게 고칠 내용</span>
              <textarea
                name="suggestedValue"
                className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[rgba(255,107,84,0.34)]"
                placeholder="예: 공식 공지 기준 접수 마감일은 2026년 4월 10일입니다."
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">참고 링크 또는 설명</span>
              <textarea
                name="message"
                className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[rgba(255,107,84,0.34)]"
                placeholder="확인 가능한 공식 링크나 추가 설명이 있으면 적어주세요."
              />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <p className="max-w-md text-xs leading-5 text-slate-400">
                요청은 운영자가 검토한 뒤 반영합니다. 반복 제출은 잠시 제한될 수 있습니다.
              </p>
              <RaceCorrectionSubmitButton />
            </div>
          </form>
        </section>
      </section>
    </PageShell>
  );
}
