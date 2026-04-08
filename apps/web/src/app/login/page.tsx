import { PageShell } from '@/components/layout/page-shell';
import { loginAction, signupAction } from './actions';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readFirstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: { searchParams: SearchParams }) {
  const resolvedSearchParams = await searchParams;
  const nextPath = readFirstValue(resolvedSearchParams.next) ?? '/';
  const message = readFirstValue(resolvedSearchParams.message);

  return (
    <PageShell
      title="로그인 또는 회원가입"
      description="개인 월간 플랜, 달성 체크, 관심 대회 저장, 커뮤니티 작성 기능은 로그인 후 사용할 수 있습니다."
    >
      <section className="mx-auto max-w-2xl rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
        {message ? (
          <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{message}</div>
        ) : null}

        <form className="mt-6 space-y-4">
          <input type="hidden" name="next" value={nextPath} />

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">이름</span>
            <input
              name="displayName"
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
              placeholder="예: 한강러너"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">이메일</span>
            <input
              name="email"
              type="email"
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
              placeholder="runner@modoo.run"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">비밀번호</span>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
              placeholder="8자 이상"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="submit"
              formAction={loginAction}
              className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
            >
              로그인
            </button>
            <button
              type="submit"
              formAction={signupAction}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              회원가입
            </button>
          </div>
        </form>
      </section>
    </PageShell>
  );
}
