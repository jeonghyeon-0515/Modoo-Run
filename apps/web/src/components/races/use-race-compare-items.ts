'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { RACE_COMPARE_STORAGE_KEY, normalizeRaceCompareItems, type RaceCompareItem } from '@/lib/races/compare';

const EMPTY_SNAPSHOT = '[]';
const UPDATE_EVENT = 'race-compare-updated';

function readSnapshot() {
  if (typeof window === 'undefined') return EMPTY_SNAPSHOT;
  return window.localStorage.getItem(RACE_COMPARE_STORAGE_KEY) ?? EMPTY_SNAPSHOT;
}

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(UPDATE_EVENT, callback);

  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(UPDATE_EVENT, callback);
  };
}

export function useRaceCompareItems() {
  const snapshot = useSyncExternalStore(subscribe, readSnapshot, () => EMPTY_SNAPSHOT);

  return useMemo(() => {
    try {
      const parsed = JSON.parse(snapshot);
      return normalizeRaceCompareItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      return [];
    }
  }, [snapshot]);
}

export function writeRaceCompareItems(items: RaceCompareItem[]) {
  window.localStorage.setItem(RACE_COMPARE_STORAGE_KEY, JSON.stringify(normalizeRaceCompareItems(items)));
  window.dispatchEvent(new Event(UPDATE_EVENT));
}
