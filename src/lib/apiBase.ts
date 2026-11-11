/** Resolve the browser-facing TripMate API root without depending on auth policy. */
export function getApiBase(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!envUrl) {
    return process.env.NODE_ENV === 'production'
      ? '/api/v1'
      : 'http://localhost:5021/api/v1';
  }

  return envUrl.endsWith('/api/v1') ? envUrl : `${envUrl.replace(/\/$/, '')}/api/v1`;
}
