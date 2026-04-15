const SITE_NAME = '모두의 러닝';
const SITE_DESCRIPTION = '대회 찾기부터 계획 세우기, 기록 남기기까지 함께하는 러닝 서비스';

export type BreadcrumbItem = {
  name: string;
  path: string;
};

export function serializeJsonLd(schema: unknown) {
  return JSON.stringify(schema).replace(/</g, '\\u003c');
}

function normalizeSiteUrl(siteUrl: string) {
  return siteUrl.replace(/\/$/, '');
}

function buildSchemaUrl(siteUrl: string, pathname = '/') {
  const base = normalizeSiteUrl(siteUrl);
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${base}${normalized}`;
}

export function buildSiteStructuredData(siteUrl: string) {
  const normalizedSiteUrl = normalizeSiteUrl(siteUrl);
  const organizationId = `${normalizedSiteUrl}/#organization`;
  const websiteId = `${normalizedSiteUrl}/#website`;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': organizationId,
        name: SITE_NAME,
        url: normalizedSiteUrl,
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        name: SITE_NAME,
        url: normalizedSiteUrl,
        description: SITE_DESCRIPTION,
        inLanguage: 'ko-KR',
        publisher: {
          '@id': organizationId,
        },
      },
    ],
  };
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[], siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: buildSchemaUrl(siteUrl, item.path),
    })),
  };
}
