/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('./load-ts.cjs');
const { adminProxyStubs } = require('./admin-proxy-stubs.cjs');
// role: the web session role; null means no valid session, the default is Staff.
function setup(token, backend, role = 'Staff') {
  return loadTs('src/features/admin/create-poi/services/poi-proxy.ts', {
    '@/lib/server/backend': { fetchBackend: backend },
    ...adminProxyStubs(token && role ? { accessToken: token, role } : null),
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
test('BE 401 answers 401 without cookies while BE 403 answers 403 without exposing upstream details', async () => {
  const unauthenticated = await setup('secret', async () => Response.json({ detail: 'internal sensitive text', traceId: 'private-trace' }, { status: 401 }))(req(), '/api/v1/admin/pois');
  assert.equal(unauthenticated.status, 401);
  assert.equal(unauthenticated.headers.get('Set-Cookie'), null);
  assert.deepEqual(await unauthenticated.json(), { title: 'Staff sign-in required.' });

  const forbidden = await setup('secret', async () => Response.json({ detail: 'internal sensitive text', traceId: 'private-trace' }, { status: 403 }))(req(), '/api/v1/admin/pois');
  assert.equal(forbidden.status, 403);
  assert.equal(forbidden.headers.get('Set-Cookie'), null);
  assert.deepEqual(await forbidden.json(), { title: 'Staff access is required.' });
});
test('only Staff may create POIs: an Administrator session is rejected before the BE is called', async () => {
  const forbidden = async () => { throw new Error('Should not call BE'); };
  const response = await setup('secret', forbidden, 'Administrator')(req(), '/api/v1/admin/pois');
  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { title: 'Staff access is required.' });
});
test('a Staff session reaches the BE and an invalid session is rejected with 401', async () => {
  let called = 0;
  const ok = await setup('secret', async () => { called += 1; return Response.json({ id: 7 }, { status: 201 }); }, 'Staff')(req(), '/api/v1/admin/pois');
  assert.equal(ok.status, 201);
  assert.equal(called, 1);
  const noSession = await setup('secret', async () => { called += 1; return Response.json({}); }, null)(req(), '/api/v1/admin/pois');
  assert.equal(noSession.status, 401);
  assert.equal(called, 1);
});
test('upstream and network failures return safe documented 503', async () => {
  const upstream = await setup('secret', async () => Response.json({ detail: 'database-password-secret' }, { status: 500 }))(req(), '/api/v1/admin/pois');
  assert.equal(upstream.status, 503);
  assert.doesNotMatch(await upstream.text(), /database-password-secret/);
  const network = await setup('secret', async () => { throw new Error('internal backend URL'); })(req(), '/api/v1/admin/pois');
  assert.equal(network.status, 503);
  assert.doesNotMatch(await network.text(), /internal backend URL/);
});
