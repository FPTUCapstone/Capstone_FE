/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('./load-ts.cjs');

function setup(backendMock) {
  const backendMod = loadTs('src/lib/server/backend.ts');
  const mod = loadTs('src/features/public/pois/services/poiProxy.ts', {
    '@/lib/server/backend': {
      BackendConfigurationError: backendMod.BackendConfigurationError,
      fetchBackend: backendMock,
    },
  });
  return { proxyPoiRequest: mod.proxyPoiRequest, BackendConfigurationError: backendMod.BackendConfigurationError };
}

test('correct /api/v1/pois list URL and query forwarding', async () => {
  let requestedPath = '';
  let requestedInit = null;

  const { proxyPoiRequest } = setup(async (path, init) => {
    requestedPath = path;
    requestedInit = init;
    return new Response(JSON.stringify({ page: 1, items: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });

  const query = new URLSearchParams({
    search: 'Hoi An',
    sort: 'distance',
    page: '1',
    pageSize: '20',
  });

  const response = await proxyPoiRequest([], query);
  assert.equal(response.status, 200);
  assert.match(requestedPath, /^\/api\/v1\/pois\?/);
  assert.match(requestedPath, /search=Hoi\+An/);
  assert.match(requestedPath, /sort=distance/);
  assert.match(requestedPath, /page=1/);
  assert.match(requestedPath, /pageSize=20/);
  assert.equal(requestedInit?.headers?.Accept, 'application/json, application/problem+json');
  assert.equal(requestedInit?.headers?.Authorization, undefined);
});

test('correct /api/v1/pois/{id} detail path without query', async () => {
  let requestedPath = '';

  const { proxyPoiRequest } = setup(async (path) => {
    requestedPath = path;
    return new Response(JSON.stringify({ id: 42, name: 'Ba Na Hills' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });

  const response = await proxyPoiRequest(['42'], new URLSearchParams());
  assert.equal(response.status, 200);
  assert.equal(requestedPath, '/api/v1/pois/42');
  const body = await response.json();
  assert.equal(body.id, 42);
});

test('unsupported query removal prevents query parameter injection', async () => {
  let requestedPath = '';

  const { proxyPoiRequest } = setup(async (path) => {
    requestedPath = path;
    return new Response(JSON.stringify({ page: 1, items: [] }), { status: 200 });
  });

  const query = new URLSearchParams({
    search: 'Da Nang',
    unsupportedParam: 'malicious',
    internalFlag: 'true',
    admin: '1',
  });

  await proxyPoiRequest([], query);
  assert.ok(!requestedPath.includes('unsupportedParam'));
  assert.ok(!requestedPath.includes('internalFlag'));
  assert.ok(!requestedPath.includes('admin'));
  assert.ok(requestedPath.includes('search=Da\+Nang'));
});

test('no Authorization header is ever attached to public POI requests', async () => {
  let capturedHeaders = null;

  const { proxyPoiRequest } = setup(async (path, init) => {
    capturedHeaders = init.headers;
    return new Response(JSON.stringify({ page: 1, items: [] }), { status: 200 });
  });

  await proxyPoiRequest([]);
  assert.equal(capturedHeaders?.Authorization, undefined);
  assert.equal(capturedHeaders?.authorization, undefined);
});

test('configuration failure returns RFC 7807 503 ProblemDetails', async () => {
  const { proxyPoiRequest, BackendConfigurationError } = setup(async () => {
    throw new BackendConfigurationError();
  });

  const response = await proxyPoiRequest([]);
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('Content-Type'), 'application/problem+json');
  const problem = await response.json();
  assert.equal(problem.status, 503);
  assert.equal(problem.errorCode, 'Poi.ServiceUnavailable');
  assert.equal(problem.title, 'Dịch vụ khám phá chưa được cấu hình.');
});

test('upstream network or timeout failure returns RFC 7807 502 ProblemDetails', async () => {
  const { proxyPoiRequest } = setup(async () => {
    throw new Error('Connection refused to backend port');
  });

  const response = await proxyPoiRequest([]);
  assert.equal(response.status, 502);
  assert.equal(response.headers.get('Content-Type'), 'application/problem+json');
  const problem = await response.json();
  assert.equal(problem.status, 502);
  assert.equal(problem.errorCode, 'Poi.UpstreamUnavailable');
  assert.equal(problem.title, 'Không thể kết nối máy chủ khám phá.');
});

test('passthrough 400, 404, 500 error status and body without modification', async () => {
  for (const status of [400, 404, 500]) {
    const errorBody = {
      status,
      title: status === 404 ? 'Poi.NotFound' : 'Error',
      detail: `Sample error ${status}`,
    };

    const { proxyPoiRequest } = setup(async () => {
      return new Response(JSON.stringify(errorBody), {
        status,
        headers: { 'Content-Type': 'application/problem+json' },
      });
    });

    const response = await proxyPoiRequest([status === 404 ? '9999' : '']);
    assert.equal(response.status, status);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    const body = await response.json();
    assert.deepEqual(body, errorBody);
  }
});
