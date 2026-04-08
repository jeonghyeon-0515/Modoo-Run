import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { isStaffRole, normalizeNextPath, resolveDisplayName, resolveViewerRole, type ViewerRole } from './utils';

export type Viewer = {
  id: string;
  email: string | null;
  displayName: string;
  role: ViewerRole;
  isStaff: boolean;
};

type RawProfile = {
  display_name: string | null;
};

export { normalizeNextPath, resolveDisplayName } from './utils';

export async function getOptionalViewer(): Promise<Viewer | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .maybeSingle<RawProfile>();

  const role = resolveViewerRole(
    typeof user.app_metadata?.role === 'string'
      ? user.app_metadata.role
      : null,
  );

  return {
    id: user.id,
    email: user.email ?? null,
    displayName: resolveDisplayName({
      email: user.email ?? null,
      profileName: profile?.display_name ?? null,
      metadataName: typeof user.user_metadata?.display_name === 'string' ? user.user_metadata.display_name : null,
    }),
    role,
    isStaff: isStaffRole(role),
  };
}

export async function requireViewer(nextPath = '/') {
  const viewer = await getOptionalViewer();

  if (!viewer) {
    redirect(`/login?next=${encodeURIComponent(normalizeNextPath(nextPath))}`);
  }

  return viewer;
}

export async function requireModerator(nextPath = '/') {
  const viewer = await requireViewer(nextPath);

  if (!viewer.isStaff) {
    redirect(normalizeNextPath(nextPath));
  }

  return viewer;
}
