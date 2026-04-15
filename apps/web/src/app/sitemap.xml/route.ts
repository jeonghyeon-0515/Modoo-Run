import { listRaces } from '@/lib/races/repository';
import { raceLandingPages } from '@/lib/races/landing-config';
import { buildAbsoluteUrl } from '@/lib/site';
import { hasSupabasePublicEnv } from '@/lib/supabase/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SitemapEntry = {
  url: string;
  lastModified: Date;
  changeFrequency: 'daily' | 'weekly';
  priority: number;
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildXml(entries: SitemapEntry[]) {
  const items = entries
    .map(
      (entry) => [
        '<url>',
        `<loc>${escapeXml(entry.url)}</loc>`,
        `<lastmod>${entry.lastModified.toISOString()}</lastmod>`,
        `<changefreq>${entry.changeFrequency}</changefreq>`,
        `<priority>${entry.priority}</priority>`,
        '</url>',
      ].join(''),
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${items}</urlset>`;
}

async function buildEntries(): Promise<SitemapEntry[]> {
  const now = new Date();
  const entries: SitemapEntry[] = [
    {
      url: buildAbsoluteUrl('/'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: buildAbsoluteUrl('/races'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...raceLandingPages.map((page) => ({
      url: buildAbsoluteUrl(page.path),
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.85,
    })),
    {
      url: buildAbsoluteUrl('/community'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: buildAbsoluteUrl('/plan'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ];

  if (!hasSupabasePublicEnv()) {
    return entries;
  }

  try {
    const races = await listRaces({ registrationStatus: 'open', limit: 300 });
    return [
      ...entries,
      ...races.map((race) => ({
        url: buildAbsoluteUrl(`/races/${race.sourceRaceId}`),
        lastModified: race.lastSyncedAt ? new Date(race.lastSyncedAt) : now,
        changeFrequency: 'daily' as const,
        priority: 0.8,
      })),
    ];
  } catch {
    return entries;
  }
}

export async function GET() {
  const xml = buildXml(await buildEntries());

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
