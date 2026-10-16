/**
 * Public Mapbox token (NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN, same account as the mobile app). Only public
 * `pk.` tokens may ship to a browser; anything else counts as "not configured".
 */
export function getMapboxPublicToken(): string | null {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN?.trim();
  return token && token.startsWith('pk.') ? token : null;
}
