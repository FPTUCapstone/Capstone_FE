/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('./load-ts.cjs');

function setup(token, backend) {
  return loadTs('src/features/admin/active-trips/activeTripsProxy.ts', {
    'next/headers': { cookies: async () => ({ get: () => token ? { value: token } : undefined }) },
    '@/lib/server/backend': { fetchBackend: backend },
    '@/lib/server/adminSession': {
      ADMIN_ACCESS_TOKEN_COOKIE: 'tripmate_admin_access_token',
      jsonNoStore: (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } }),
      clearAdminSession: response => { response.headers.set('Set-Cookie', 'tripmate_admin_access_token=; Max-Age=0'); return response; },
    },
  }).proxyActiveTrips;
}

const request = (query = '') => new Request(`http://localhost:3001/api/admin/trips/active${query}`);

test('requires the HttpOnly Administrator cookie', async () => {
  const response = await setup(null, async () => { throw new Error('must not call backend'); })(request());
  assert.equal(response.status, 401);
});

test('forwards only approved query parameters and bearer token', async () => {
  const proxy = setup('secret', async (path, init) => {
    assert.equal(path, '/api/v1/admin/trips/active?keyword=trip&pageNumber=2');
    assert.equal(init.headers.Authorization, 'Bearer secret');
    return Response.json({ items: [] });
  });
  const response = await proxy(request('?keyword=trip&pageNumber=2&private=x'));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});

test('clears the local session for upstream 401 and 403 without leaking details', async () => {
  for (const status of [401, 403]) {
    const response = await setup('secret', async () => Response.json({ detail: 'private upstream data' }, { status }))(request());
    assert.equal(response.status, status);
    assert.match(response.headers.get('Set-Cookie'), /Max-Age=0/);
    assert.doesNotMatch(await response.text(), /private upstream data/);
  }
});

test('maps upstream and network failures to a safe 503', async () => {
  const upstream = await setup('secret', async () => Response.json({ detail: 'database failure' }, { status: 500 }))(request());
  assert.equal(upstream.status, 503);
  assert.doesNotMatch(await upstream.text(), /database failure/);
  const network = await setup('secret', async () => { throw new Error('private URL'); })(request());
  assert.equal(network.status, 503);
});
