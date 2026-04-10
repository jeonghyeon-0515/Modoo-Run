import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';
import { signupAction } from '@/app/login/actions';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readFirstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignupPage({ searchParams }: { searchParams: SearchParams }) {
  const resolvedSearchParams = await searchParams;
  const nextPath = readFirstValue(resolvedSearchParams.next) ?? '/';
  const message = readFirstValue(resolvedSearchParams.message);

  return (
    <PageShell
      title="회원가입"
      description="이메일로 계정을 만들면 대회 저장, 계획 작성, 커뮤니티 기능을 이용할 수 있습니다."
    >
      <section className="mx-auto max-w-2xl rounded-[1.25rem] bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-7">
        {message ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{message}</div>
        ) : null}

        <form className="mt-6 space-y-4">
          <input type="hidden" name="next" value={nextPath} />

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">이름</span>
            <input
              name="displayName"
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              placeholder="한강러너"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">이메일</span>
            <input
              name="email"
              type="email"
              required
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
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
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              placeholder="8자 이상"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-slate-700">비밀번호 확인</span>
            <input
              name="passwordConfirm"
              type="password"
              required
              minLength={8}
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              placeholder="비밀번호 다시 입력"
            />
          </label>

          <button
            type="submit"
            formAction={signupAction}
            className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            회원가입하기
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-5 text-sm text-slate-600">
          이미 계정이 있나요?{' '}
          <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-[var(--brand)]">
            로그인으로 돌아가기
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
