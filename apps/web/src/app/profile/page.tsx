import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';
import { formatRaceDate } from '@/lib/races/formatters';
import { getProfileEditorData } from '@/lib/profile/repository';
import { PROFILE_DISTANCE_OPTIONS } from '@/lib/profile/utils';
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
      <span className="inline-flex rounded-full bg-[var(--surface-muted)] px-3 py-2 text-sm font-medium text-slate-700 transition peer-checked:bg-[var(--brand)] peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--brand)]">
        {label}
      </span>
    </label>
  );
}

export default async function ProfilePage({ searchParams }: { searchParams: SearchParams }) {
  const resolvedSearchParams = await searchParams;
  const message = readFirstValue(resolvedSearchParams.message);
  const { viewer, profile, regionOptions, goalRaceOptions } = await getProfileEditorData();

  return (
    <PageShell
      title="프로필 수정"
      description="표시 이름과 선호 지역/거리, 목표 대회를 관리할 수 있습니다."
      compactIntro
    >
      <section className="rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
        {message ? (
          <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{message}</div>
        ) : null}

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">{viewer.displayName}</p>
            <p className="mt-1 text-sm text-slate-500">{viewer.email ?? '이메일 정보 없음'}</p>
          </div>
          <Link
            href="/plan"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            일정 캘린더로 돌아가기
          </Link>
        </div>

        <form action={updateProfileAction} className="mt-8 space-y-8">
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">표시 이름</span>
              <input
                name="displayName"
                defaultValue={profile.displayName}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
                placeholder="러너 이름"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">목표 대회</span>
              <select
                name="goalRaceId"
                defaultValue={profile.goalRaceId ?? ''}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
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
              className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
              placeholder="어떤 러닝을 좋아하는지, 이번 시즌 목표가 무엇인지 적어보세요."
            />
          </label>

          <div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">선호 지역</h2>
                <p className="mt-1 text-xs text-slate-500">복수 선택할 수 있습니다. 보고 싶은 지역만 골라두세요.</p>
              </div>
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

          <div>
            <h2 className="text-sm font-semibold text-slate-900">선호 거리</h2>
            <p className="mt-1 text-xs text-slate-500">복수 선택할 수 있습니다. 대회 탐색 화면과 맞춘 거리 기준입니다.</p>
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
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              대회 일정 보기
            </Link>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
            >
              프로필 저장
            </button>
          </div>
        </form>
      </section>
    </PageShell>
  );
}
