import type { MetadataRoute } from 'next';
import { buildAbsoluteUrl, getSiteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/internal/'],
    },
    sitemap: buildAbsoluteUrl('/sitemap.xml'),
    host: getSiteUrl(),
  };
}
