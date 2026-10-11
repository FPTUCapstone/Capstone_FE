/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('./load-ts.cjs');

function setup(token, backend, role = 'Staff') {
  return loadTs('src/features/admin/active-trip-details/activeTripDetailsProxy.ts', {
    'next/headers': { cookies: async () => ({ get: () => token ? { value: token } : undefined }) },
    '@/lib/server/backend': { fetchBackend: backend },
    '@/lib/server/adminSession': {
      ADMIN_ACCESS_TOKEN_COOKIE: 'tripmate_admin_access_token',
      verifyAdminSessionFromCookies: () => token ? { role } : null,
      jsonNoStore: (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } }),
      clearAdminSession: response => { response.headers.set('Set-Cookie', 'tripmate_admin_access_token=; Max-Age=0'); return response; },
    },
    './activeTripDetails': { isValidTripId: id => /^\d+$/.test(id) },
  }).proxyActiveTripDetails;
}

test('requires a verified Staff session before fetching active trip details', async () => {
  const response = await setup(null, async () => { throw new Error('must not call backend'); })('42');
  assert.equal(response.status, 401);
});

test('rejects an Administrator session before requesting Staff-only active trip details', async () => {
  const response = await setup('admin-token', async () => { throw new Error('must not call backend'); }, 'Administrator')('42');
  assert.equal(response.status, 403);
  assert.doesNotMatch(await response.text(), /admin-token/);
});

test('forwards a Staff request with the sealed session token', async () => {
  const proxy = setup('staff-token', async (path, init) => {
    assert.equal(path, '/api/v1/admin/trips/active/42');
    assert.equal(init.headers.Authorization, 'Bearer staff-token');
    return Response.json({ tripId: '42' });
  });
  const response = await proxy('42');
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});
