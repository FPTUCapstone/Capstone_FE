/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('./load-ts.cjs');

const routePath = 'app/api/admin/session/route.ts';
const request = (origin = 'https://web.test', body = { email: ' admin@example.com ', password: 'secret' }, method = 'POST') => new Request('https://web.test/api/admin/session', {
  method,
  headers: { ...(origin ? { Origin: origin } : {}), 'Content-Type': 'application/json' },
  ...(method === 'POST' ? { body: JSON.stringify(body) } : {}),
});
const loginResult = () => ({ role: 3, status: 2, accessToken: 'test-access-token', refreshToken: 'must-not-leak', accessTokenExpiresAtUtc: new Date(Date.now() + 3600000).toISOString() });
const loadRoute = (fetchBackend) => loadTs(routePath, { '@/lib/server/backend': { fetchBackend } });

test('session rejects foreign or missing Origin before contacting BE', async () => {
  const route = loadRoute(() => assert.fail('BE must not be called'));
  for (const origin of ['https://evil.test', null]) {
    assert.equal((await route.POST(request(origin))).status, 403);
    assert.equal((await route.DELETE(request(origin, null, 'DELETE'))).status, 403);
  }
});

test('login validates credentials before sending to BE', async () => {
  const route = loadRoute(() => assert.fail('BE must not be called'));
  for (const body of [null, {}, { email: 'bad', password: 'x' }, { email: 'a@b.com', password: '' }]) {
    assert.equal((await route.POST(request(undefined, body))).status, 400);
  }
});

test('login forwards credentials, checks active admin catalogue, and returns cookie without tokens', async () => {
  const calls = [];
  const route = loadRoute(async (path, init) => {
    calls.push({ path, init });
    return calls.length === 1 ? Response.json(loginResult()) : Response.json({ categories: [], tags: [] });
  });
  const response = await route.POST(request());
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { authenticated: true });
  assert.deepEqual(JSON.parse(calls[0].init.body), { email: 'admin@example.com', password: 'secret' });
  assert.equal(calls[0].path, '/api/v1/auth/login');
  assert.equal(calls[1].path, '/api/v1/admin/pois/catalogue');
  assert.equal(new Headers(calls[1].init.headers).get('authorization'), 'Bearer test-access-token');
  const cookie = response.headers.get('set-cookie');
  assert.match(cookie, /tripmate_admin_access_token=test-access-token/);
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=strict/i);
  assert.match(cookie, /Expires=/i);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('login denies non-admin, inactive, invalid expiry or invalid token response', async () => {
  for (const change of [{ role: 1 }, { status: 3 }, { accessTokenExpiresAtUtc: 'invalid' }, { accessTokenExpiresAtUtc: '2000-01-01T00:00:00Z' }, { accessToken: '' }]) {
    const route = loadRoute(async () => Response.json({ ...loginResult(), ...change }));
    const response = await route.POST(request());
    assert.ok([403, 502].includes(response.status));
    assert.match(response.headers.get('set-cookie'), /Max-Age=0/i);
  }
});

test('BE auth denial clears old cookie and never exposes upstream error', async () => {
  for (const status of [401, 403]) {
    const route = loadRoute(async () => Response.json({ detail: 'internal sensitive text' }, { status }));
    const response = await route.POST(request());
    assert.equal(response.status, status);
    assert.match(response.headers.get('set-cookie'), /Max-Age=0/i);
    assert.doesNotMatch(await response.text(), /internal sensitive text/);
  }
});

test('catalogue denial prevents session issuance', async () => {
  let count = 0;
  const route = loadRoute(async () => ++count === 1 ? Response.json(loginResult()) : new Response(null, { status: 403 }));
  const response = await route.POST(request());
  assert.equal(response.status, 403);
  assert.match(response.headers.get('set-cookie'), /Max-Age=0/i);
});

test('BE network failure is a safe 503 and DELETE expires session', async () => {
  const route = loadRoute(async () => { throw new Error('sensitive network URL'); });
  const response = await route.POST(request());
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /sensitive network/);
  const logout = await route.DELETE(request(undefined, null, 'DELETE'));
  assert.equal(logout.status, 204);
  assert.match(logout.headers.get('set-cookie'), /Max-Age=0/i);
});

test('shared CSRF accepts configured origin, does not trust forwarded host', () => {
  const { isSameOriginRequest } = loadTs('src/lib/server/adminSession.ts');
  const prior = process.env.TRIPMATE_WEB_ORIGIN;
  try {
    process.env.TRIPMATE_WEB_ORIGIN = 'https://public.test';
    assert.equal(isSameOriginRequest(request('https://public.test')), true);
    const forged = new Request('https://web.test/api/admin/session', { headers: { origin: 'https://evil.test', 'x-forwarded-host': 'evil.test' } });
    assert.equal(isSameOriginRequest(forged), false);
  } finally {
    if (prior === undefined) delete process.env.TRIPMATE_WEB_ORIGIN;
    else process.env.TRIPMATE_WEB_ORIGIN = prior;
  }
});

test('production cookies use Secure on both login and logout', async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    let count = 0;
    const route = loadRoute(async () => ++count === 1 ? Response.json(loginResult()) : Response.json({ categories: [], tags: [] }));
    const login = await route.POST(request());
    const logout = await route.DELETE(request(undefined, null, 'DELETE'));
    assert.match(login.headers.get('set-cookie'), /; Secure/i);
    assert.match(logout.headers.get('set-cookie'), /; Secure/i);
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
});

test('backend fetch requires origin-only HTTP config and enforces no cache and no redirects', async () => {
  const { fetchBackend } = loadTs('src/lib/server/backend.ts');
  const prior = process.env.TRIPMATE_API_BASE_URL;
  const originalFetch = global.fetch;
  try {
    for (const value of ['', '/api', 'file:///tmp', 'https://api.test/v1', 'https://user:pass@api.test', 'https://api.test/?x=1']) {
      process.env.TRIPMATE_API_BASE_URL = value;
      await assert.rejects(fetchBackend('/api/v1/auth/login'));
    }
    process.env.TRIPMATE_API_BASE_URL = 'https://api.test';
    for (const path of ['//evil.test', 'https://evil.test', '/\\evil.test']) await assert.rejects(fetchBackend(path));
    global.fetch = async (url, init) => {
      assert.equal(String(url), 'https://api.test/api/v1/auth/login');
      assert.equal(init.cache, 'no-store');
      assert.equal(init.redirect, 'error');
      assert.ok(init.signal instanceof AbortSignal);
      return Response.json({});
    };
    await fetchBackend('/api/v1/auth/login', { cache: 'force-cache', redirect: 'follow' });
  } finally {
    global.fetch = originalFetch;
    if (prior === undefined) delete process.env.TRIPMATE_API_BASE_URL;
    else process.env.TRIPMATE_API_BASE_URL = prior;
  }
});
