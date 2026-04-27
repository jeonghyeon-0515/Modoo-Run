import Link from 'next/link';
import { requireModerator } from '@/lib/auth/session';
import { PageShell } from '@/components/layout/page-shell';
import { FeaturedRaceSection } from '@/components/monetization/featured-race-section';
import {
  featuredPlacementLabelOptions,
  listActiveFeaturedRacePlacements,
  listFeaturedPlacementsForOps,
} from '@/lib/monetization/featured-repository';
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
  const viewer = await requireModerator('/ops/featured');
  const { races, slots } = await listFeaturedPlacementsForOps();
  const previewItems = await listActiveFeaturedRacePlacements(races, 2);

  return (
    <PageShell
      viewer={viewer}
      title="Featured Listing 편성"
      description="대회 목록 상단 featured 영역을 운영자가 직접 선택하고 문구를 수정할 수 있습니다."
      compactIntro
      mode="ops"
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

        <div className="mt-4 rounded-[1rem] border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
          <p className="font-semibold text-slate-900">편성 전 확인</p>
          <ul className="mt-3 space-y-2">
            <li>• 일정, 장소, 접수 상태가 실제 공개 정보와 맞는 대회만 편성합니다.</li>
            <li>• 라벨과 설명 문구는 공개 화면에 그대로 노출되므로 광고·협업 성격을 숨기지 않습니다.</li>
            <li>• 이미 마감됐거나 안내 가치가 낮은 대회는 우선순위를 낮춥니다.</li>
            <li>• 판매 가격과 계약 조건은 이 화면이 아니라 운영 정책에서 별도로 확정합니다.</li>
          </ul>
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
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[rgba(255,107,84,0.34)]"
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
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[rgba(255,107,84,0.34)]"
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
                <select
                  name="eyebrow"
                  defaultValue={featuredPlacementLabelOptions.includes(slot.eyebrow as (typeof featuredPlacementLabelOptions)[number]) ? slot.eyebrow : 'Featured Listing'}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[rgba(255,107,84,0.34)]"
                >
                  {featuredPlacementLabelOptions.map((label) => (
                    <option key={label} value={label}>
                      {label}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  공개 카드에 그대로 노출됩니다. 협업성 노출은 `스폰서`, 일반 큐레이션은 `Featured Listing` 또는 `지역 추천`으로만 저장할 수 있습니다.
                </p>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">설명 문구</span>
                <textarea
                  name="summary"
                  defaultValue={slot.summary}
                  className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[rgba(255,107,84,0.34)]"
                  placeholder="지금 눈여겨볼 대회로 먼저 보여주는 시범 노출 영역입니다."
                />
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  확인 가능한 정보 위주로 작성하고, 유료·협업 노출이면 설명에도 운영 또는 협업 성격이 드러나게 적어 주세요.
                </p>
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
