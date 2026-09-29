/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('./load-ts.cjs');

function setup(token, backend) {
  return loadTs('src/features/admin/audit-logs/api/auditLogProxy.ts', {
    'next/headers': { cookies: async () => ({ get: () => token ? { value: token } : undefined }) },
    '@/lib/server/backend': { fetchBackend: backend },
    '@/lib/server/adminSession': {
      ADMIN_ACCESS_TOKEN_COOKIE: 'tripmate_admin_access_token',
      jsonNoStore: (body, status = 200) => Response.json(body, {
        status,
        headers: { 'Cache-Control': 'no-store' },
      }),
      clearAdminSession: response => {
        response.headers.set('Set-Cookie', 'tripmate_admin_access_token=; Max-Age=0');
        return response;
      },
    },
  }).proxyAuditLogs;
}

function request(query = '') {
  return new Request(`http://localhost:3001/api/admin/audit-logs${query}`);
}

test('requires the HttpOnly Administrator session before calling BE', async () => {
  let called = false;
  const response = await setup(null, async () => {
    called = true;
    return Response.json({});
  })(request());

  assert.equal(response.status, 401);
  assert.equal(called, false);
});

test('forwards supported filters and the Admin cookie token only', async () => {
  const calls = [];
  const proxy = setup('admin-cookie-token', async (path, init) => {
    calls.push({ path, init });
    return Response.json({ items: [], pageNumber: 1, pageSize: 10, totalCount: 0, totalPages: 0 });
  });

  const response = await proxy(request('?keyword=trip%204&actorRole=Administrator&pageNumber=1&ignored=secret'));

  assert.equal(response.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(
    calls[0].path,
    '/api/v1/admin/audit-logs?keyword=trip+4&actorRole=Administrator&pageNumber=1',
  );
  assert.equal(calls[0].init.method, 'GET');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer admin-cookie-token');
});

test('clears invalid Admin sessions for authentication and authorization failures', async () => {
  for (const status of [401, 403]) {
    const response = await setup('invalid-token', async () => Response.json(
      { detail: 'private upstream detail' },
      { status },
    ))(request());

    assert.equal(response.status, status);
    assert.match(response.headers.get('Set-Cookie'), /Max-Age=0/);
    assert.doesNotMatch(await response.text(), /private upstream detail/);
  }
});

test('maps upstream and network failures to safe no-store responses', async () => {
  const failed = await setup('admin-token', async () => Response.json(
    { detail: 'database-secret' },
    { status: 500 },
  ))(request());
  assert.equal(failed.status, 503);
  assert.equal(failed.headers.get('Cache-Control'), 'no-store');
  assert.doesNotMatch(await failed.text(), /database-secret/);

  const unreachable = await setup('admin-token', async () => {
    throw new Error('internal network detail');
  })(request());
  assert.equal(unreachable.status, 503);
  assert.doesNotMatch(await unreachable.text(), /internal network detail/);
});
