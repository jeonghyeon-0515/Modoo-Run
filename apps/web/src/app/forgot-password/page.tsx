import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';
import { requestPasswordResetAction } from '@/app/login/actions';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readFirstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ForgotPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  const resolvedSearchParams = await searchParams;
  const message = readFirstValue(resolvedSearchParams.message);

  return (
    <PageShell
      title="비밀번호 재설정"
      description="가입한 이메일로 재설정 링크를 보냅니다."
    >
      <section className="mx-auto max-w-2xl rounded-[1.25rem] bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-7">
        {message ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{message}</div>
        ) : null}

        <form className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">이메일</span>
            <input
              name="email"
              type="email"
              required
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none field-transition focus:border-[rgba(255,107,84,0.34)]"
              placeholder="runner@modoo.run"
            />
          </label>

          <button
            type="submit"
            formAction={requestPasswordResetAction}
            className="focus-ring public-primary-button pressable inline-flex min-h-11 w-full items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold"
          >
            재설정 링크 보내기
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-5 text-sm text-slate-600">
          <Link href="/login" className="font-semibold text-[var(--brand)]">
            로그인으로 돌아가기
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
