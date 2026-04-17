import Link from 'next/link';
import { requireModerator } from '@/lib/auth/session';
import { PageShell } from '@/components/layout/page-shell';
import { listPartnerDestinationSettingsForOps } from '@/lib/monetization/partner-destination-repository';
import { resetPartnerDestinationAction, savePartnerDestinationAction } from './actions';
import { PartnerDestinationSubmitButton } from './submit-button';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readFirstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function isErrorMessage(message?: string) {
  return Boolean(message && /실패|문제|입력|올바른/.test(message));
}

export default async function OpsPartnersPage({ searchParams }: { searchParams: SearchParams }) {
  const resolvedSearchParams = await searchParams;
  const message = readFirstValue(resolvedSearchParams.message);
  const viewer = await requireModerator('/ops/partners');
  const settings = await listPartnerDestinationSettingsForOps();

  return (
    <PageShell
      viewer={viewer}
      title="제휴 링크 관리"
      description="공개 화면에서 사용되는 파트너 링크를 관리자 화면에서 직접 바꿀 수 있습니다."
      compactIntro
    >
      <section className="rounded-[1.25rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">운영 가이드</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              저장한 링크는 `/gear`, `/races`, `/community`, 대회 상세에서 바로 사용됩니다. 외부 링크는 https 권장입니다.
            </p>
          </div>
          <Link href="/gear" className="text-sm font-medium text-slate-500 hover:text-slate-900">
            공개 가이드 보기
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

      <section className="mt-6 grid gap-5 xl:grid-cols-3">
        {settings.map((setting) => (
          <article key={setting.key} className="rounded-[1.25rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-slate-950">{setting.name}</p>
                <p className="mt-1 text-xs text-slate-500">{setting.description}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{setting.badge}</span>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-xs leading-6 text-slate-500">
              <div>
                <span className="font-semibold text-slate-700">기본 링크</span>
                <div className="mt-1 break-all">{setting.defaultUrl}</div>
              </div>
              <div className="mt-3">
                <span className="font-semibold text-slate-700">현재 적용 링크</span>
                <div className="mt-1 break-all">{setting.currentUrl}</div>
              </div>
              <div className="mt-3">
                <span className="font-semibold text-slate-700">상태</span>
                <div className="mt-1">{setting.hasOverride ? '운영자 지정 링크 사용 중' : '기본 링크 사용 중'}</div>
              </div>
            </div>

            <form action={savePartnerDestinationAction} className="mt-5 space-y-4">
              <input type="hidden" name="destinationKey" value={setting.key} />

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">적용할 링크</span>
                <input
                  name="destinationUrl"
                  defaultValue={setting.currentUrl}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  placeholder="https://..."
                />
              </label>

              <div className="flex justify-end">
                <PartnerDestinationSubmitButton label="저장하기" />
              </div>
            </form>

            <form action={resetPartnerDestinationAction} className="mt-3">
              <input type="hidden" name="destinationKey" value={setting.key} />
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                기본 링크로 복원
              </button>
            </form>
          </article>
        ))}
      </section>
    </PageShell>
  );
}
