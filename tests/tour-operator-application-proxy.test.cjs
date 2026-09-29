/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('./load-ts.cjs');

function setup(token, backend) {
  return loadTs('src/features/admin/tour-operator-applications/api/tourOperatorApplicationProxy.ts', {
    'next/headers': { cookies: async () => ({ get: () => token ? { value: token } : undefined }) },
    '@/lib/server/backend': { fetchBackend: backend },
    '@/lib/server/adminSession': {
      ADMIN_ACCESS_TOKEN_COOKIE: 'tripmate_admin_access_token',
      isSameOriginRequest: request => request.headers.get('origin') === new URL(request.url).origin,
      jsonNoStore: (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } }),
      clearAdminSession: response => {
        response.headers.set('Set-Cookie', 'tripmate_admin_access_token=; Max-Age=0');
        return response;
      },
    },
  }).proxyTourOperatorApplication;
}

function request(method = 'GET', body) {
  return new Request('http://localhost:3001/api/admin/tour-operator-applications/2', {
    method,
    headers: { origin: 'http://localhost:3001', 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

test('requires an Administrator session before calling BE', async () => {
  const forbidden = async () => { throw new Error('BE must not be called'); };
  const response = await setup(null, forbidden)(request(), '2');
  assert.equal(response.status, 401);
});

test('rejects malformed or unsafe application IDs before calling BE', async () => {
  let called = false;
  const proxy = setup('admin-token', async () => {
    called = true;
    return Response.json({});
  });

  for (const userId of ['1abc', '1.5', '1e3', '0', '-1', '01', '9007199254740992']) {
    const response = await proxy(request(), userId);
    assert.equal(response.status, 400, `expected ${userId} to be rejected`);
  }
  assert.equal(called, false);
});

test('forwards detail and approve requests with the HttpOnly session token', async () => {
  const calls = [];
  const proxy = setup('admin-token', async (path, init) => {
    calls.push({ path, init });
    return Response.json(path.endsWith('/approve') ? { applicationStatus: 'Approved' } : { userId: 2 });
  });

  const detail = await proxy(request(), '2');
  const approval = await proxy(request('POST'), '2', 'approve');

  assert.equal(detail.status, 200);
  assert.equal(approval.status, 200);
  assert.deepEqual(calls.map(call => call.path), [
    '/api/v1/admin/tour-operator-applications/2',
    '/api/v1/admin/tour-operator-applications/2/approve',
  ]);
  assert.ok(calls.every(call => call.init.headers.Authorization === 'Bearer admin-token'));
});

test('rejects cross-origin mutations and forwards a valid rejection reason', async () => {
  let called = false;
  const proxy = setup('admin-token', async (_path, init) => {
    called = true;
    assert.deepEqual(JSON.parse(init.body), { reason: 'Invalid licence' });
    return new Response(null, { status: 200 });
  });
  const crossOrigin = new Request('http://localhost:3001/api/admin/tour-operator-applications/2/reject', {
    method: 'POST',
    headers: { origin: 'https://attacker.example', 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'Invalid licence' }),
  });
  assert.equal((await proxy(crossOrigin, '2', 'reject')).status, 403);
  assert.equal(called, false);

  const response = await proxy(request('POST', { reason: 'Invalid licence' }), '2', 'reject');
  assert.equal(response.status, 200);
  assert.equal(called, true);
});

test('reject validation blocks empty and oversized reasons before calling BE', async () => {
  let called = false;
  const proxy = setup('admin-token', async () => {
    called = true;
    return new Response(null, { status: 200 });
  });

  const empty = await proxy(request('POST', { reason: '   ' }), '2', 'reject');
  assert.equal(empty.status, 422);
  assert.match(await empty.text(), /required/i);

  const oversized = await proxy(request('POST', { reason: 'x'.repeat(501) }), '2', 'reject');
  assert.equal(oversized.status, 422);
  assert.match(await oversized.text(), /500/);
  assert.equal(called, false);
});

test('clears an invalid session and does not expose upstream server failures', async () => {
  const denied = await setup('expired', async () => Response.json({ detail: 'private' }, { status: 401 }))(request(), '2');
  assert.equal(denied.status, 401);
  assert.match(denied.headers.get('Set-Cookie'), /Max-Age=0/);

  const failed = await setup('admin-token', async () => Response.json({ detail: 'database-secret' }, { status: 500 }))(request(), '2');
  assert.equal(failed.status, 503);
  assert.doesNotMatch(await failed.text(), /database-secret/);
});
