/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('./load-ts.cjs');
const { adminProxyStubs } = require('./admin-proxy-stubs.cjs');

function setup(token, backend) {
  return loadTs('src/features/admin/active-trips/activeTripsProxy.ts', {
    '@/lib/server/backend': { fetchBackend: backend },
    ...adminProxyStubs(token ? { accessToken: token, role: 'Administrator' } : null),
  }).proxyActiveTrips;
}

const request = (query = '') => new Request(`http://localhost:3001/api/admin/trips/active${query}`);

test('requires the HttpOnly Administrator cookie', async () => {
  const response = await setup(null, async () => { throw new Error('must not call backend'); })(request());
  assert.equal(response.status, 401);
});

test('forwards only approved query parameters and bearer token', async () => {
  const proxy = setup('secret', async (path, init) => {
    assert.equal(path, '/api/v1/admin/trips/active?keyword=trip&pageNumber=2&pageSize=20');
    assert.equal(init.headers.Authorization, 'Bearer secret');
    return Response.json({ items: [] });
  });
  const response = await proxy(request('?keyword=trip&pageNumber=2&private=x'));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});

test('enforces pageSize 20 even when the caller supplies a larger or duplicate value', async () => {
  const proxy = setup('secret', async (path) => {
    const query = new URL(path, 'http://backend.local').searchParams;
    assert.deepEqual(query.getAll('pageSize'), ['20']);
    return Response.json({ items: [] });
  });
  const response = await proxy(request('?pageSize=100&pageSize=500&pageNumber=2'));
  assert.equal(response.status, 200);
});

test('passes upstream 401 and 403 through without cookies or leaked details', async () => {
  for (const status of [401, 403]) {
    const response = await setup('secret', async () => Response.json({ detail: 'private upstream data' }, { status }))(request());
    assert.equal(response.status, status);
    assert.equal(response.headers.get('Set-Cookie'), null);
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
