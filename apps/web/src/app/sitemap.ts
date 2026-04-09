import type { MetadataRoute } from 'next';
import { listRaces } from '@/lib/races/repository';
import { buildAbsoluteUrl } from '@/lib/site';
import { hasSupabasePublicEnv } from '@/lib/supabase/env';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
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
