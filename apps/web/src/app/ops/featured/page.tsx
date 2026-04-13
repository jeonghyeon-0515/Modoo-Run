import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';
import { FeaturedRaceSection } from '@/components/monetization/featured-race-section';
import { listActiveFeaturedRacePlacements, listFeaturedPlacementsForOps } from '@/lib/monetization/featured-repository';
import { clearFeaturedPlacementAction, saveFeaturedPlacementAction } from './actions';
import { FeaturedPlacementSubmitButton } from './submit-button';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readFirstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function isErrorMessage(message?: string) {
  return Boolean(message && /실패|문제|입력|선택/.test(message));
}

export default async function OpsFeaturedPage({ searchParams }: { searchParams: SearchParams }) {
  const resolvedSearchParams = await searchParams;
  const message = readFirstValue(resolvedSearchParams.message);
  const { races, slots } = await listFeaturedPlacementsForOps();
  const previewItems = await listActiveFeaturedRacePlacements(races, 2);

  return (
    <PageShell
      title="Featured Listing 편성"
      description="대회 목록 상단 featured 영역을 운영자가 직접 선택하고 문구를 수정할 수 있습니다."
      compactIntro
    >
      <section className="rounded-[1.25rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">운영 가이드</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              메인/보조 슬롯 각각 한 개씩 고를 수 있습니다. 저장 후 공개 화면 `/races`에 바로 반영됩니다.
            </p>
          </div>
          <Link href="/races" className="text-sm font-medium text-slate-500 hover:text-slate-900">
            공개 화면 보기
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

      <section className="mt-6">
        <FeaturedRaceSection items={previewItems} variant="ops-preview" />
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-2">
        {slots.map((slot) => (
          <article key={slot.slotKey} className="rounded-[1.25rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-950">{slot.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {slot.updatedAt ? `마지막 수정 ${new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Seoul' }).format(new Date(slot.updatedAt))}` : '아직 저장된 값이 없습니다.'}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {slot.slotKey === 'featured_primary' ? '메인' : '보조'}
              </span>
            </div>

            <form action={saveFeaturedPlacementAction} className="mt-5 space-y-4">
              <input type="hidden" name="slotKey" value={slot.slotKey} />

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">노출 여부</span>
                <select
                  name="isActive"
                  defaultValue={slot.isActive ? 'true' : 'false'}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                >
                  <option value="true">노출</option>
                  <option value="false">숨김</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">대회 선택</span>
                <select
                  name="raceId"
                  defaultValue={slot.raceId}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                >
                  <option value="">대회를 선택하세요</option>
                  {races.map((race) => (
                    <option key={race.id} value={race.id}>
                      {race.title} · {race.region ?? '지역 미정'} · {race.eventDateLabel ?? race.eventDate ?? '일정 미정'}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">라벨</span>
                <input
                  name="eyebrow"
                  defaultValue={slot.eyebrow}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  placeholder="Featured Listing"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">설명 문구</span>
                <textarea
                  name="summary"
                  defaultValue={slot.summary}
                  className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  placeholder="지금 눈여겨볼 대회로 먼저 보여주는 시범 노출 영역입니다."
                />
              </label>
              <div className="flex justify-end pt-2">
                <FeaturedPlacementSubmitButton label="저장하기" />
              </div>
            </form>

            <form action={clearFeaturedPlacementAction} className="mt-3">
              <input type="hidden" name="slotKey" value={slot.slotKey} />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                슬롯 비우기
              </button>
            </form>
          </article>
        ))}
      </section>
    </PageShell>
  );
}
