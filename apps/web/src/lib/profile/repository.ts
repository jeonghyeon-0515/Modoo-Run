import { requireViewer } from '@/lib/auth/session';
import { listRegions } from '@/lib/races/repository';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { normalizeMultiSelectValues } from './utils';

type RawProfileRow = {
  id: string;
  display_name: string | null;
  bio: string | null;
  preferred_regions: string[] | null;
  preferred_distances: string[] | null;
  goal_race_id: string | null;
};

type RawGoalRaceRow = {
  id: string;
  title: string;
  event_date: string | null;
  event_date_label: string | null;
};

export type ProfileEditorData = {
  viewer: Awaited<ReturnType<typeof requireViewer>>;
  profile: {
    displayName: string;
    bio: string;
    preferredRegions: string[];
    preferredDistances: string[];
    goalRaceId: string | null;
  };
  regionOptions: string[];
  goalRaceOptions: RawGoalRaceRow[];
};

export async function getProfileEditorData(): Promise<ProfileEditorData> {
  const viewer = await requireViewer('/profile');
  const supabase = await getSupabaseServerClient();

  const [{ data: profile }, regionOptions, { data: goalRaceOptions, error: goalRaceError }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, display_name, bio, preferred_regions, preferred_distances, goal_race_id')
      .eq('id', viewer.id)
      .maybeSingle<RawProfileRow>(),
    listRegions(),
    supabase
      .from('races')
      .select('id, title, event_date, event_date_label')
      .order('event_date', { ascending: true, nullsFirst: false })
      .limit(30),
  ]);

  if (goalRaceError) {
    throw new Error(`목표 대회 목록 조회 실패: ${goalRaceError.message}`);
  }

  return {
    viewer,
    profile: {
      displayName: profile?.display_name?.trim() || viewer.displayName,
      bio: profile?.bio?.trim() || '',
      preferredRegions: normalizeMultiSelectValues(profile?.preferred_regions ?? []),
      preferredDistances: normalizeMultiSelectValues(profile?.preferred_distances ?? []),
      goalRaceId: profile?.goal_race_id ?? null,
    },
    regionOptions,
    goalRaceOptions: (goalRaceOptions ?? []) as RawGoalRaceRow[],
  };
}

export async function updateProfile(input: {
  displayName: string;
  bio: string;
  preferredRegions: string[];
  preferredDistances: string[];
  goalRaceId: string | null;
}) {
  const viewer = await requireViewer('/profile');
  const supabase = await getSupabaseServerClient();

  const displayName = input.displayName.trim() || viewer.displayName;
  const bio = input.bio.trim();
  const preferredRegions = normalizeMultiSelectValues(input.preferredRegions);
  const preferredDistances = normalizeMultiSelectValues(input.preferredDistances);
  const goalRaceId = input.goalRaceId?.trim() ? input.goalRaceId : null;

  const { error } = await supabase.from('profiles').upsert(
    {
      id: viewer.id,
      display_name: displayName,
      bio: bio || null,
      preferred_regions: preferredRegions,
      preferred_distances: preferredDistances,
      goal_race_id: goalRaceId,
    },
    { onConflict: 'id' },
  );

  if (error) {
    throw new Error(`프로필 저장 실패: ${error.message}`);
  }
}
