export function readBearerToken(value?: string | null) {
  if (!value) return null;

  const [scheme, token] = value.trim().split(/\s+/, 2);
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
}

export function isAuthorizedInternalRequest(input: {
  authorizationHeader?: string | null;
  sharedSecretHeader?: string | null;
  allowedSecrets: string[];
}) {
  if (input.allowedSecrets.length === 0) {
    return false;
  }

  const bearerToken = readBearerToken(input.authorizationHeader);
  return input.allowedSecrets.some(
    (secret) => secret === input.sharedSecretHeader || secret === bearerToken,
  );
}
