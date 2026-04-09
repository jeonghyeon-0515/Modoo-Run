'use client';

import { useEffect } from 'react';

export function RaceDetailViewTracker({ sourceRaceId }: { sourceRaceId: string }) {
  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/races/${encodeURIComponent(sourceRaceId)}/view`, {
      method: 'POST',
      keepalive: true,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sourceRaceId }),
    }).catch(() => {});

    return () => {
      controller.abort();
    };
  }, [sourceRaceId]);

  return null;
}
