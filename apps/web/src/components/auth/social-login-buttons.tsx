'use client';

import { useState, useTransition } from 'react';
import type { Provider } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

type SocialProviderConfig = {
  provider: Provider;
  label: string;
  description: string;
  className: string;
};

const providers: SocialProviderConfig[] = [
  {
    provider: 'google',
    label: 'Google로 계속하기',
    description: '구글 계정으로 바로 시작',
    className: 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50',
  },
  {
    provider: 'kakao',
    label: '카카오로 계속하기',
    description: '카카오 계정으로 빠르게 시작',
    className: 'border-[#FEE500] bg-[#FEE500] text-slate-900 hover:bg-[#f8db00]',
  },
];

function getErrorMessage(provider: Provider, error: Error) {
  const message = error.message.toLowerCase();

  if (message.includes('provider is not enabled') || message.includes('unsupported provider')) {
    return `${provider === 'kakao' ? '카카오' : 'Google'} 로그인 설정이 아직 완료되지 않았어요.`;
  }

  return error.message;
}

export function SocialLoginButtons({ nextPath }: { nextPath: string }) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeProvider, setActiveProvider] = useState<Provider | null>(null);

  const handleSocialLogin = (provider: Provider) => {
    setErrorMessage(null);
    setActiveProvider(provider);

    startTransition(async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
        const { error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo,
          },
        });

        if (error) {
          throw error;
        }
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? getErrorMessage(provider, error) : '소셜 로그인 시작에 실패했어요.',
        );
        setActiveProvider(null);
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {providers.map((item) => {
          const pendingLabel = activeProvider === item.provider && isPending ? '로그인 창 여는 중…' : item.description;

          return (
            <button
              key={item.provider}
              type="button"
              onClick={() => handleSocialLogin(item.provider)}
              disabled={isPending}
              className={`rounded-2xl border px-4 py-4 text-left shadow-sm transition disabled:cursor-wait disabled:opacity-70 ${item.className}`}
            >
              <p className="text-sm font-semibold">{item.label}</p>
              <p className="mt-1 text-xs opacity-80">{pendingLabel}</p>
            </button>
          );
        })}
      </div>

      {errorMessage ? (
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{errorMessage}</div>
      ) : null}
    </div>
  );
}
