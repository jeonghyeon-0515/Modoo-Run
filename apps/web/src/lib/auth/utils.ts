export type ViewerRole = 'user' | 'moderator' | 'admin';

type UserMetadataRecord = Record<string, unknown>;

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

function readMetadataString(metadata: UserMetadataRecord, key: string) {
  const value = metadata[key];
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function resolveAuthMetadataDisplayName(metadata: unknown) {
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }

  const record = metadata as UserMetadataRecord;

  return (
    readMetadataString(record, 'display_name') ??
    readMetadataString(record, 'full_name') ??
    readMetadataString(record, 'name') ??
    readMetadataString(record, 'preferred_username') ??
    readMetadataString(record, 'user_name') ??
    readMetadataString(record, 'nickname')
  );
}
