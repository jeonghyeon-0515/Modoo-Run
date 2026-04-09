import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';
import { SocialLoginButtons } from '@/components/auth/social-login-buttons';
import { loginAction } from './actions';

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
      title="로그인"
      description="저장한 대회, 계획, 커뮤니티 활동을 계속 이용하려면 로그인해 주세요."
    >
      <section className="mx-auto max-w-2xl rounded-[1.75rem] bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-8">
        {message ? (
          <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{message}</div>
        ) : null}

        <div className="mt-2">
          <h2 className="text-sm font-semibold text-slate-900">이메일 로그인</h2>
          <p className="mt-1 text-xs text-slate-500">이메일과 비밀번호로 로그인할 수 있습니다.</p>
        </div>

        <form className="mt-6 space-y-4">
          <input type="hidden" name="next" value={nextPath} />

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

          <div className="text-right text-sm">
            <Link href="/forgot-password" className="font-semibold text-[var(--brand)]">
              비밀번호 찾기
            </Link>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="submit"
              formAction={loginAction}
              className="inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)]"
            >
              로그인하기
            </button>
            <Link
              href={`/signup?next=${encodeURIComponent(nextPath)}`}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              회원가입
            </Link>
          </div>
        </form>

        <div className="mt-8 border-t border-slate-100 pt-6">
          <h2 className="text-sm font-semibold text-slate-900">소셜 로그인</h2>
          <div className="mt-4">
            <SocialLoginButtons nextPath={nextPath} />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
