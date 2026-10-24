/* eslint-disable @typescript-eslint/no-require-imports */
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('./load-ts.cjs');

test('shared CSRF accepts configured origin, does not trust forwarded host', () => {
  const { isSameOriginRequest } = loadTs('src/lib/server/sameOrigin.ts');
  const prior = process.env.TRIPMATE_WEB_ORIGIN;
  try {
    process.env.TRIPMATE_WEB_ORIGIN = 'https://public.test';
    assert.equal(isSameOriginRequest(new Request('https://web.test/api/admin/payouts', { headers: { origin: 'https://public.test' } })), true);
    const forged = new Request('https://web.test/api/admin/payouts', { headers: { origin: 'https://evil.test', 'x-forwarded-host': 'evil.test' } });
    assert.equal(isSameOriginRequest(forged), false);
  } finally {
    if (prior === undefined) delete process.env.TRIPMATE_WEB_ORIGIN;
    else process.env.TRIPMATE_WEB_ORIGIN = prior;
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

test('production rejects plaintext backend origin before sending credentials or tokens', async () => {
  const { fetchBackend, BackendConfigurationError } = loadTs('src/lib/server/backend.ts');
  const priorBase = process.env.TRIPMATE_API_BASE_URL;
  const priorNodeEnv = process.env.NODE_ENV;
  const originalFetch = global.fetch;
  try {
    process.env.TRIPMATE_API_BASE_URL = 'http://api.test';
    process.env.NODE_ENV = 'production';
    global.fetch = async () => assert.fail('Plaintext backend must not be contacted');
    await assert.rejects(fetchBackend('/api/v1/auth/login'), BackendConfigurationError);
    await assert.rejects(fetchBackend('/api/v1/admin/pois', { headers: { Authorization: 'Bearer token' } }), BackendConfigurationError);

    process.env.TRIPMATE_API_BASE_URL = 'https://api.test';
    global.fetch = async () => Response.json({});
    assert.equal((await fetchBackend('/api/v1/auth/login')).status, 200);

    process.env.NODE_ENV = 'development';
    process.env.TRIPMATE_API_BASE_URL = 'http://localhost:5021';
    assert.equal((await fetchBackend('/api/v1/auth/login')).status, 200);
  } finally {
    global.fetch = originalFetch;
    if (priorBase === undefined) delete process.env.TRIPMATE_API_BASE_URL;
    else process.env.TRIPMATE_API_BASE_URL = priorBase;
    if (priorNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = priorNodeEnv;
  }
});
