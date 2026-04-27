import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';
import { formatRaceDate } from '@/lib/races/formatters';
import { getProfileEditorData } from '@/lib/profile/repository';
import { PROFILE_DISTANCE_OPTIONS } from '@/lib/profile/utils';
import { ProfileSubmitButton } from './profile-submit-button';
import { updateProfileAction } from './actions';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readFirstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function SelectableChip({
  name,
  value,
  label,
  defaultChecked,
}: {
  name: string;
  value: string;
  label: string;
  defaultChecked: boolean;
}) {
  const id = `${name}-${value}`;

  return (
    <label htmlFor={id} className="cursor-pointer">
      <input id={id} type="checkbox" name={name} value={value} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="pressable inline-flex min-h-10 items-center rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 peer-checked:border-[var(--secondary)] peer-checked:bg-[var(--secondary)] peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[rgba(255,107,84,0.34)]">
        {label}
      </span>
    </label>
  );
}

export default async function ProfilePage({ searchParams }: { searchParams: SearchParams }) {
  const resolvedSearchParams = await searchParams;
  const message = readFirstValue(resolvedSearchParams.message);
  const isErrorMessage = Boolean(message && /문제|실패|오류/.test(message));
  const { viewer, profile, regionOptions, goalRaceOptions } = await getProfileEditorData();

  return (
    <PageShell
      title="프로필"
      description="닉네임과 러닝 취향을 간단하게 관리할 수 있습니다."
      compactIntro
      viewer={viewer}
    >
      <section className="rounded-[1.25rem] bg-white p-5 shadow-sm ring-1 ring-black/5 sm:p-7">
        {message ? (
          <div
            aria-live="polite"
            className={`rounded-xl border px-4 py-3 text-sm ${
              isErrorMessage
                ? 'border-amber-200 bg-amber-50 text-amber-800'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}
          >
            {message}
          </div>
        ) : null}

        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-5">
          <div>
            <p className="text-lg font-semibold text-slate-950">{viewer.displayName}</p>
            <p className="mt-1 text-sm text-slate-500">{viewer.email ?? '이메일 정보 없음'}</p>
          </div>
          <Link
            href="/plan"
            className="focus-ring pressable inline-flex min-h-10 items-center justify-center text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            일정 캘린더로 돌아가기
          </Link>
        </div>

        <form action={updateProfileAction} className="mt-6 space-y-7">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">닉네임</span>
              <p className="mt-1 text-xs text-slate-500">서비스에서 보이는 이름입니다.</p>
              <input
                name="displayName"
                defaultValue={profile.displayName}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none field-transition focus:border-[rgba(255,107,84,0.34)]"
                placeholder="닉네임을 입력하세요"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">목표 대회</span>
              <p className="mt-1 text-xs text-slate-500">준비 중인 대회가 있다면 연결해둘 수 있습니다.</p>
              <select
                name="goalRaceId"
                defaultValue={profile.goalRaceId ?? ''}
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none field-transition focus:border-[rgba(255,107,84,0.34)]"
              >
                <option value="">아직 안 정했어요</option>
                {goalRaceOptions.map((race) => (
                  <option key={race.id} value={race.id}>
                    {race.title} · {formatRaceDate(race.event_date, race.event_date_label)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">한 줄 소개</span>
            <textarea
              name="bio"
              defaultValue={profile.bio}
              className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none field-transition focus:border-[rgba(255,107,84,0.34)]"
              placeholder="러닝 스타일이나 목표를 짧게 적어보세요."
            />
          </label>

          <div className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">선호 지역</h2>
              <p className="mt-1 text-xs text-slate-500">복수 선택할 수 있습니다.</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {regionOptions.map((region) => (
                <SelectableChip
                  key={region}
                  name="preferredRegions"
                  value={region}
                  label={region}
                  defaultChecked={profile.preferredRegions.includes(region)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">선호 거리</h2>
            <p className="mt-1 text-xs text-slate-500">자주 찾는 거리만 골라두면 됩니다.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {PROFILE_DISTANCE_OPTIONS.map((distance) => (
                <SelectableChip
                  key={distance}
                  name="preferredDistances"
                  value={distance}
                  label={distance}
                  defaultChecked={profile.preferredDistances.includes(distance)}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <Link
              href="/races"
              className="focus-ring pressable inline-flex min-h-10 items-center justify-center text-sm font-medium text-slate-500 hover:text-slate-900"
            >
              대회 일정 보기
            </Link>
            <div className="flex flex-col items-end gap-2">
              <ProfileSubmitButton />
              <p className="text-xs text-slate-400">저장 후 화면이 새로 갱신됩니다.</p>
            </div>
          </div>
        </form>
      </section>
    </PageShell>
  );
}
