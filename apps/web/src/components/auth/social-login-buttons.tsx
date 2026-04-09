'use client';

import { useState, useTransition } from 'react';
import type { Provider } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

type SocialProviderConfig = {
  provider: Provider | 'naver';
  label: string;
  enabled: boolean;
};

const providers: SocialProviderConfig[] = [
  {
    provider: 'google',
    label: 'Google로 계속하기',
    enabled: true,
  },
  {
    provider: 'naver',
    label: '네이버로 계속하기',
    enabled: false,
  },
  {
    provider: 'kakao',
    label: '카카오로 계속하기',
    enabled: true,
  },
];

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.5 12 2.5A9.5 9.5 0 0 0 2.5 12 9.5 9.5 0 0 0 12 21.5c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.5z" />
      <path fill="#FBBC05" d="M3.6 7.6 6.8 10A5.7 5.7 0 0 1 12 6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.5 12 2.5A9.5 9.5 0 0 0 3.6 7.6z" />
      <path fill="#34A853" d="M12 21.5c2.5 0 4.7-.8 6.3-2.4l-2.9-2.4c-.8.6-1.9 1.1-3.4 1.1A5.9 5.9 0 0 1 6.8 14l-3.1 2.4A9.5 9.5 0 0 0 12 21.5z" />
      <path fill="#4285F4" d="M21.1 12.2c0-.6-.1-1.1-.2-1.5H12v3.4h5.1c-.2 1.1-.9 2.1-1.8 2.8l2.9 2.4c1.7-1.5 2.9-3.9 2.9-7.1z" />
    </svg>
  );
}

function NaverLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <rect width="24" height="24" rx="6" fill="#03C75A" />
      <path fill="#fff" d="M8 6.5h3.1l4.1 6V6.5H18v11h-3.1l-4.1-6v6H8z" />
    </svg>
  );
}

function KakaoLogo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <rect width="24" height="24" rx="6" fill="#FEE500" />
      <path
        fill="#181600"
        d="M12 6.2c-3.6 0-6.4 2.2-6.4 4.9 0 1.8 1.2 3.4 3 4.2l-.8 2.8c-.1.3.2.5.5.3l3.3-2c.2 0 .3 0 .5 0 3.5 0 6.4-2.2 6.4-4.9S15.5 6.2 12 6.2z"
      />
    </svg>
  );
}

function ProviderLogo({ provider }: { provider: Provider | 'naver' }) {
  if (provider === 'google') return <GoogleLogo />;
  if (provider === 'naver') return <NaverLogo />;
  return <KakaoLogo />;
}

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
      <div className="grid gap-3">
        {providers.map((item) => {
          const isActiveProvider = activeProvider === item.provider && isPending;
          const disabled = !item.enabled || isPending;
          const pendingLabel = isActiveProvider ? '로그인 창 여는 중…' : item.enabled ? item.label : `${item.label} · 준비 중`;
          const className =
            item.provider === 'kakao'
              ? 'border-[#FEE500] bg-[#FEE500] text-slate-900 hover:bg-[#f8db00]'
              : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-50';

          return (
            <button
              key={item.provider}
              type="button"
              onClick={item.enabled ? () => handleSocialLogin(item.provider as Provider) : undefined}
              disabled={disabled}
              className={`rounded-2xl border px-4 py-4 text-left shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
            >
              <span className="flex items-center gap-3">
                <ProviderLogo provider={item.provider} />
                <span className="text-sm font-semibold">{pendingLabel}</span>
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-slate-500">
        네이버 로그인은 현재 Supabase 기본 소셜 provider 미지원이라 버튼만 먼저 준비했고, Google/카카오는 바로 연동할 수 있어요.
      </p>

      {errorMessage ? (
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{errorMessage}</div>
      ) : null}
    </div>
  );
}
