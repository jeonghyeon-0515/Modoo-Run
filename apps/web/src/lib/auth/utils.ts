export type ViewerRole = 'user' | 'moderator' | 'admin';

export function normalizeNextPath(value?: string | null) {
  if (!value) return '/';
  if (!value.startsWith('/')) return '/';
  if (value.startsWith('//')) return '/';
  return value;
}

export function resolveViewerRole(value?: string | null): ViewerRole {
  if (value === 'admin') return 'admin';
  if (value === 'moderator') return 'moderator';
  return 'user';
}

export function isStaffRole(role: ViewerRole) {
  return role === 'admin' || role === 'moderator';
}

export function resolveDisplayName(options: {
  email?: string | null;
  profileName?: string | null;
  metadataName?: string | null;
}) {
  if (options.profileName?.trim()) return options.profileName.trim();
  if (options.metadataName?.trim()) return options.metadataName.trim();
  if (options.email?.includes('@')) return options.email.split('@')[0];
  return '러너';
}
