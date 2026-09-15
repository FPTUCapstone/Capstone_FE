/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('./load-ts.cjs');
function setup(token, backend) {
  return loadTs('src/features/admin/create-poi/services/poi-proxy.ts', {
    'next/headers': { cookies: async () => ({ get: () => token ? { value: token } : undefined }) },
    '@/lib/server/backend': { fetchBackend: backend },
    '@/lib/server/adminSession': {
      ADMIN_ACCESS_TOKEN_COOKIE: 'tripmate_admin_access_token',
      isSameOriginRequest: r => r.headers.get('origin') === new URL(r.url).origin,
      jsonNoStore: (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } }),
      clearAdminSession: r => { r.headers.set('Set-Cookie', 'tripmate_admin_access_token=; Max-Age=0'); return r; },
    },
  }).proxyPoi;
}
const req = (origin = 'http://localhost:3001') => new Request('http://localhost:3001/api/admin/pois', { method: 'POST', headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'A', categoryId: 5 }) });
test('unauthenticated and cross-origin mutations never call BE', async () => {
  const forbidden = async () => { throw new Error('Should not call BE'); };
  assert.equal((await setup(null, forbidden)(req(), '/api/v1/admin/pois')).status, 401);
  assert.equal((await setup('secret', forbidden)(req('https://other.example'), '/api/v1/admin/pois')).status, 403);
});
test('forwards flat JSON with bearer and returns real status/body', async () => {
  const proxy = setup('secret', async (path, init) => {
    assert.equal(path, '/api/v1/admin/pois'); assert.equal(init.headers.Authorization, 'Bearer secret');
    assert.deepEqual(JSON.parse(init.body), { name: 'A', categoryId: 5 });
    return Response.json({ id: 51 }, { status: 201 });
  });
  const response = await proxy(req(), '/api/v1/admin/pois');
  assert.equal(response.status, 201); assert.deepEqual(await response.json(), { id: 51 });
});
test('BE auth denials clear session without exposing upstream details', async () => {
  for (const status of [401, 403]) {
    const response = await setup('secret', async () => Response.json({ detail: 'internal sensitive text', traceId: 'private-trace' }, { status }))(req(), '/api/v1/admin/pois');
    assert.equal(response.status, status);
    assert.match(response.headers.get('Set-Cookie'), /Max-Age=0/);
    assert.deepEqual(await response.json(), { title: status === 401 ? 'Administrator sign-in required.' : 'Administrator access is not allowed.' });
  }
});
test('upstream and network failures return safe documented 503', async () => {
  const upstream = await setup('secret', async () => Response.json({ detail: 'database-password-secret' }, { status: 500 }))(req(), '/api/v1/admin/pois');
  assert.equal(upstream.status, 503);
  assert.doesNotMatch(await upstream.text(), /database-password-secret/);
  const network = await setup('secret', async () => { throw new Error('internal backend URL'); })(req(), '/api/v1/admin/pois');
  assert.equal(network.status, 503);
  assert.doesNotMatch(await network.text(), /internal backend URL/);
});
