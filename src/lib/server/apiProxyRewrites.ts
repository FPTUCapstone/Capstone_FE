export interface ApiProxyRewrite {
  source: string;
  destination: string;
}

/**
 * Same-origin proxy for the backend API.
 *
 * The backend sets the HttpOnly `tripmate_refresh` cookie with SameSite=Lax. When the browser calls
 * the backend host directly from another site, it never sends that cookie, so a page reload loses
 * the session. Serving `/api/v1/*` from the Web origin makes the cookie first-party.
 *
 * Use as a `fallback` rewrite so the Route Handlers under `app/api/v1` keep priority.
 * Returns no rewrites unless `base` is a bare origin (HTTPS, or HTTP outside production).
 */
export function getApiProxyRewrites(
  base: string | undefined,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): ApiProxyRewrite[] {
  if (!base) return [];

  let origin: URL;
  try {
    origin = new URL(base);
  } catch {
    return [];
  }

  const isHttps = origin.protocol === 'https:';
  const isDevHttp = origin.protocol === 'http:' && nodeEnv !== 'production';
  const isBareOrigin =
    !origin.username && !origin.password && origin.pathname === '/' && !origin.search && !origin.hash;
  if ((!isHttps && !isDevHttp) || !isBareOrigin) return [];

  return [{ source: '/api/v1/:path*', destination: `${origin.origin}/api/v1/:path*` }];
}
