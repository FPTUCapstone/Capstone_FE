import { NextRequest, NextResponse } from 'next/server';

import { fetchBackend } from '@/lib/server/backend';

const REFRESH_COOKIE = 'tripmate_refresh';

/**
 * Clears the browser-owned refresh cookie as well as revoking the corresponding
 * backend session.  The backend is reached through a rewrite in local web mode;
 * its cookie path can otherwise differ from the browser-facing `/` path.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;

  if (refresh) {
    await fetchBackend('/api/v1/auth/web/logout', {
      method: 'POST',
      headers: { Cookie: `${REFRESH_COOKIE}=${encodeURIComponent(refresh)}` },
    }).catch(() => undefined);
  }

  const response = NextResponse.json({ success: true }, {
    headers: { 'Cache-Control': 'no-store' },
  });

  // Expire both paths: old local builds used `/api/v1/auth`, while the BFF
  // session proxies read the root-path cookie. Next's response adapter de-dupes
  // cookies by name, so keep `/` last: it is the cookie that authorizes every
  // browser-facing BFF route.
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  for (const path of ['/api/v1/auth', '/']) {
    response.headers.append(
      'Set-Cookie',
      `${REFRESH_COOKIE}=; Path=${path}; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax${secure}`,
    );
  }

  return response;
}
