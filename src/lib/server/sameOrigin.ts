import 'server-only';

export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin || origin === 'null') return false;
  if (origin === new URL(request.url).origin) return true;
  const configuredOrigin = process.env.TRIPMATE_WEB_ORIGIN;
  if (!configuredOrigin) return false;
  try {
    const url = new URL(configuredOrigin);
    return (
      ['http:', 'https:'].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      url.pathname === '/' &&
      !url.search &&
      !url.hash &&
      origin === url.origin
    );
  } catch {
    return false;
  }
}
