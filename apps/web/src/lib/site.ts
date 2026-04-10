const DEFAULT_SITE_URL = 'https://modoo-run.vercel.app';

function readOptionalEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export function getSiteUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : null,
    DEFAULT_SITE_URL,
  ];

  const siteUrl = candidates.find((value) => typeof value === 'string' && value.trim()) as string;
  return siteUrl.trim().replace(/\/$/, '');
}

export function buildAbsoluteUrl(pathname = '/') {
  const base = getSiteUrl();
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${base}${normalized}`;
}

export function getSiteVerification() {
  const google = readOptionalEnv('NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION');
  const naver = readOptionalEnv('NEXT_PUBLIC_NAVER_SITE_VERIFICATION');

  if (!google && !naver) {
    return undefined;
  }

  return {
    google: google ?? undefined,
    other: naver
      ? {
          'naver-site-verification': naver,
        }
      : undefined,
  };
}
