/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('./load-ts.cjs');

const { getApiProxyRewrites } = loadTs('src/lib/server/apiProxyRewrites.ts');

test('proxies /api/v1 to the configured HTTPS backend origin', () => {
  assert.deepEqual(getApiProxyRewrites('https://api.test', 'production'), [
    { source: '/api/v1/:path*', destination: 'https://api.test/api/v1/:path*' },
  ]);
});

test('ignores a trailing slash on the backend origin', () => {
  assert.deepEqual(getApiProxyRewrites('https://api.test/', 'production'), [
    { source: '/api/v1/:path*', destination: 'https://api.test/api/v1/:path*' },
  ]);
});

test('allows a plain-HTTP backend only outside production', () => {
  assert.equal(getApiProxyRewrites('http://localhost:5021', 'development').length, 1);
  assert.deepEqual(getApiProxyRewrites('http://localhost:5021', 'production'), []);
});

test('returns no rewrites when the backend origin is missing or empty', () => {
  assert.deepEqual(getApiProxyRewrites(undefined, 'production'), []);
  assert.deepEqual(getApiProxyRewrites('', 'production'), []);
});

test('rejects origins that are not a bare scheme+host+port', () => {
  for (const value of [
    'not a url',
    'ftp://api.test',
    'https://user:pass@api.test',
    'https://api.test/some/path',
    'https://api.test?x=1',
    'https://api.test#frag',
  ]) {
    assert.deepEqual(getApiProxyRewrites(value, 'production'), [], value);
  }
});
