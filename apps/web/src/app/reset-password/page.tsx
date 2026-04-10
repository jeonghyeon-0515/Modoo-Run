import Link from 'next/link';
import { PageShell } from '@/components/layout/page-shell';
import { PasswordResetForm } from '@/components/auth/password-reset-form';

export default function ResetPasswordPage() {
  return (
    <PageShell
      title="새 비밀번호 설정"
      description="재설정 링크로 접속한 뒤 새 비밀번호를 입력해 주세요."
    >
      <section className="mx-auto max-w-2xl rounded-[1.25rem] bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-7">
        <PasswordResetForm />

        <div className="mt-6 border-t border-slate-100 pt-5 text-sm text-slate-600">
          비밀번호 재설정 메일을 다시 받아야 하나요?{' '}
          <Link href="/forgot-password" className="font-semibold text-[var(--brand)]">
            재설정 메일 다시 받기
          </Link>
        </div>
      </section>
    </PageShell>
  );
}
