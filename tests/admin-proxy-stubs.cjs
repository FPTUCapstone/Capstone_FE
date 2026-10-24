// Module stubs for administration proxies loaded through loadTs. The proxies resolve the
// signed-in session with resolveWebSession, so tests stub that resolver directly instead of
// a sealed cookie. `session` is { accessToken, role } or null when no web session exists.
function adminProxyStubs(session) {
  return {
    '@/lib/server/webSession': { resolveWebSession: async () => session },
    '@/lib/server/jsonNoStore': {
      jsonNoStore: (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } }),
    },
    '@/lib/server/sameOrigin': {
      isSameOriginRequest: request => request.headers.get('origin') === new URL(request.url).origin,
    },
  };
}

module.exports = { adminProxyStubs };
