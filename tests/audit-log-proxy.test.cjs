/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('./load-ts.cjs');
const { adminProxyStubs } = require('./admin-proxy-stubs.cjs');

function setup(token, backend) {
  return loadTs('src/features/admin/audit-logs/api/auditLogProxy.ts', {
    '@/lib/server/backend': { fetchBackend: backend },
    ...adminProxyStubs(token ? { accessToken: token, role: 'Administrator' } : null),
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

  const inboundRequest = request('?keyword=trip%204&actorRole=Administrator&pageNumber=1&ignored=secret');
  const response = await proxy(inboundRequest);

  assert.equal(response.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(
    calls[0].path,
    '/api/v1/admin/audit-logs?keyword=trip+4&actorRole=Administrator&pageNumber=1',
  );
  assert.equal(calls[0].init.method, 'GET');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer admin-cookie-token');
  assert.equal(calls[0].init.signal, inboundRequest.signal);
});

test('answers 401 without cookies on upstream 401 and 403 without cookies on upstream 403', async () => {
  const unauthenticated = await setup('invalid-token', async () => Response.json(
    { detail: 'private upstream detail' },
    { status: 401 },
  ))(request());

  assert.equal(unauthenticated.status, 401);
  assert.equal(unauthenticated.headers.get('Set-Cookie'), null);
  assert.doesNotMatch(await unauthenticated.text(), /private upstream detail/);

  const forbidden = await setup('staff-token', async () => Response.json(
    { detail: 'private upstream detail' },
    { status: 403 },
  ))(request());

  assert.equal(forbidden.status, 403);
  assert.equal(forbidden.headers.get('Set-Cookie'), null);
  assert.doesNotMatch(await forbidden.text(), /private upstream detail/);
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
