'use client';

import { useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export function PasswordResetForm() {
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (password.length < 8) {
      setMessage('비밀번호는 8자 이상이어야 해요.');
      return;
    }

    if (password !== passwordConfirm) {
      setMessage('비밀번호 확인이 일치하지 않아요.');
      return;
    }

    setPending(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      setMessage('비밀번호를 바꿨어요. 이제 새 비밀번호로 로그인해 주세요.');
      setPassword('');
      setPasswordConfirm('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '비밀번호 변경에 실패했어요.');
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <label className="block">
        <span className="text-sm font-semibold text-slate-700">새 비밀번호</span>
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          minLength={8}
          required
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
          placeholder="8자 이상"
        />
      </label>

      <label className="block">
        <span className="text-sm font-semibold text-slate-700">새 비밀번호 확인</span>
        <input
          value={passwordConfirm}
          onChange={(event) => setPasswordConfirm(event.target.value)}
          type="password"
          minLength={8}
          required
          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400"
          placeholder="같은 비밀번호를 한 번 더 입력"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-full bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-strong)] disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? '변경하는 중…' : '비밀번호 바꾸기'}
      </button>

      {message ? (
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{message}</div>
      ) : null}
    </form>
  );
}
