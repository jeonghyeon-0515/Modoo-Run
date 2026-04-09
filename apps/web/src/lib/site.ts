const DEFAULT_SITE_URL = 'https://modoo-run.vercel.app';

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
  return siteUrl.replace(/\/$/, '');
}

export function buildAbsoluteUrl(pathname = '/') {
  const base = getSiteUrl();
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${base}${normalized}`;
}
