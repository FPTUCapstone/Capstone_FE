/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('./load-ts.cjs');

function setup({ role = 'ServiceProvider', mustChangePassword = false, admin = false, upstream, refreshStatus = 200 } = {}) {
  const calls = [];
  const proxy = loadTs('src/features/hotel-service-provider/server/workflowProxy.ts', {
    'next/headers': { cookies: async () => ({ get: () => ({ value: 'cookie' }) }) },
    '@/lib/server/adminSession': {
      ADMIN_ACCESS_TOKEN_COOKIE: 'admin',
      verifyAdminSessionFromCookies: () => admin ? { role, mustChangePassword } : null,
      isSameOriginRequest: request => request.headers.get('origin') === 'https://tripmate.test',
    },
    '@/lib/server/backend': { fetchBackend: async (path, init) => {
      calls.push({ path, init });
      if (path.includes('/auth/web/refresh')) return Response.json({ success: true, data: { role, status: 'Active', mustChangePassword, accessToken: 'bearer' } }, { status: refreshStatus });
      return upstream ?? Response.json({ success: true, data: { id: '9', status: 'Confirmed' } });
    } },
  });
  return { ...proxy, calls };
}
const req = (method = 'GET', body, key = '92a7302a-1754-4d33-8d70-0f87fe0486ef') => new Request('https://tripmate.test/api/provider/service-booking-requests?status=Confirmed&pageNumber=2&providerId=999', {
  method, headers: { origin: 'https://tripmate.test', 'Content-Type': 'application/json', 'Idempotency-Key': key },
  ...(body ? { body: JSON.stringify(body) } : {}),
});

test('refresh availability failures remain retryable instead of expiring the session', async () => {
  for (const refreshStatus of [500, 503]) {
    const proxy = setup({ refreshStatus });
    assert.equal((await proxy.proxyProviderWorkflow(req())).status, 503);
    assert.equal(proxy.calls.length, 1);
  }
});

test('invalid successful refresh responses stay retryable', async () => {
  const proxy = loadTs('src/features/hotel-service-provider/server/workflowProxy.ts', {
    'next/headers': { cookies: async () => ({ get: () => ({ value: 'cookie' }) }) },
    '@/lib/server/adminSession': {},
    '@/lib/server/backend': { fetchBackend: async () => Response.json({ success: true, data: null }) },
  });
  assert.equal((await proxy.proxyProviderWorkflow(req())).status, 503);
});

test('vehicle-rental provisioning uses the Backend category contract', async () => {
  const proxy = setup({ role: 'Staff', admin: true });
  const body = { fullName: 'Owner', email: 'owner@example.test', phoneNumber: '0905123456',
    businessName: 'Rental', category: 'VehicleRental', linkedPoiIds: [3] };
  assert.equal((await proxy.proxyProvisionAccount(req('POST', body), 'provider')).status, 200);
  assert.equal(JSON.parse(proxy.calls[0].init.body).category, 'Vehicle Rental');
});

test('provider BFF denies wrong role and first-password sessions before business API', async () => {
  for (const options of [{ role: 'Staff' }, { mustChangePassword: true }]) {
    const proxy = setup(options);
    assert.equal((await proxy.proxyProviderWorkflow(req())).status, 403);
    assert.equal(proxy.calls.length, 1);
  }
});
test('provider BFF forwards only approved filters and authenticates server-side', async () => {
  const proxy = setup();
  assert.equal((await proxy.proxyProviderWorkflow(req())).status, 200);
  assert.equal(proxy.calls[1].path, '/api/v1/provider/service-booking-requests?status=Confirmed&pageNumber=2');
  assert.equal(proxy.calls[1].init.headers.Authorization, 'Bearer bearer');
});
test('decision forwards exact DTO and stable idempotency key', async () => {
  const proxy = setup();
  assert.equal((await proxy.proxyProviderWorkflow(req('POST', { decision: 'Rejected', reason: 'Full', rowVersion: 'AAAAAAAB=' }), '9', 'decision')).status, 200);
  assert.equal(proxy.calls[1].init.headers['Idempotency-Key'], '92a7302a-1754-4d33-8d70-0f87fe0486ef');
  assert.deepEqual(JSON.parse(proxy.calls[1].init.body), { decision: 'Rejected', reason: 'Full', rowVersion: 'AAAAAAAB=' });
});
test('rejects blank reasons, invalid amounts, unsafe ids and missing keys', async () => {
  for (const [id, operation, body, key] of [
    ['../9', 'decision', { decision: 'Confirmed', rowVersion: 'AAAAAAAB=' }, 'key'],
    ['9', 'decision', { decision: 'Rejected', reason: ' ', rowVersion: 'AAAAAAAB=' }, 'key'],
    ['9', 'outcome', { outcome: 'Completed', actualAmount: 0, rowVersion: 'AAAAAAAB=' }, 'key'],
    ['9', 'decision', { decision: 'Confirmed', rowVersion: 'AAAAAAAB=' }, ''],
  ]) {
    const proxy = setup();
    assert.equal((await proxy.proxyProviderWorkflow(req('POST', body, key), id, operation)).status, 400);
    assert.ok(proxy.calls.every(call => call.path.includes('/auth/web/refresh')));
  }
});
test('creation requires exact actor and strips credentials from result', async () => {
  const body = { fullName: 'Name', email: 'name@example.com', phoneNumber: '0905123456' };
  const denied = setup({ admin: true, role: 'Staff' });
  assert.equal((await denied.proxyProvisionAccount(req('POST', body), 'staff')).status, 403);
  const allowed = setup({ admin: true, role: 'Administrator', upstream: Response.json({ success: true, data: { userId: 3, email: body.email, temporaryPassword: 'secret' } }, { status: 201 }) });
  const response = await allowed.proxyProvisionAccount(req('POST', body), 'staff');
  assert.equal(response.status, 201);
  assert.equal(JSON.stringify(await response.json()).includes('secret'), false);
  assert.equal(allowed.calls[0].path, '/api/v1/admin/staff-accounts');
});
test('errors expose only safe message codes', async () => {
  const proxy = setup({ upstream: Response.json({ errorCode: 'SQL_EXCEPTION', detail: 'private' }, { status: 500 }) });
  const response = await proxy.proxyProviderWorkflow(req());
  assert.deepEqual(await response.json(), { errorCode: 'MSG127' });
});
test('normalizes the published direct success DTOs at the BFF boundary', async () => {
  const provider = setup({ upstream: Response.json({ items: [], totalCount: 0, pageNumber: 1, pageSize: 20 }) });
  assert.deepEqual(await (await provider.proxyProviderWorkflow(req())).json(), { success: true, data: { items: [], totalCount: 0, pageNumber: 1, pageSize: 20 } });
  const pois = setup({ admin: true, role: 'Staff', upstream: Response.json([{ id: 2, name: 'Hotel', category: 'Hotel' }]) });
  const response = await pois.proxyProvisionAccount(req(), 'pois');
  assert.deepEqual(await response.json(), { success: true, data: [{ id: 2, name: 'Hotel', category: 'Hotel' }] });
});

test('provider BFF stops reading oversized streamed JSON before buffering the full request', async () => {
  const proxy = setup();
  let reads = 0;
  let cancelled = false;
  const stream = new ReadableStream({
    pull(controller) {
      if (++reads <= 3) controller.enqueue(new Uint8Array(20_000).fill(32));
      else controller.close();
    },
    cancel() { cancelled = true; },
  });
  const request = new Request('https://tripmate.test/api/provider/service-booking-requests/9/decision', {
    method: 'POST', body: stream, duplex: 'half',
    headers: { origin: 'https://tripmate.test', 'Content-Type': 'application/json',
      'Idempotency-Key': '92a7302a-1754-4d33-8d70-0f87fe0486ef' },
  });
  assert.equal((await proxy.proxyProviderWorkflow(request, '9', 'decision')).status, 413);
  assert.equal(cancelled, true);
  assert.equal(proxy.calls.length, 1);
});
