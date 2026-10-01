/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadTs } = require('./load-ts.cjs');

function setup(backendMock) {
  const backendMod = loadTs('src/lib/server/backend.ts');
  const mod = loadTs('src/features/public/tours/services/tourProxy.ts', {
    '@/lib/server/backend': {
      BackendConfigurationError: backendMod.BackendConfigurationError,
      fetchBackend: backendMock,
    },
  });
  return { proxyTourRequest: mod.proxyTourRequest, BackendConfigurationError: backendMod.BackendConfigurationError };
}

test('correct /api/v1/tours list URL and query forwarding', async () => {
  let requestedPath = '';
  let requestedInit = null;

  const { proxyTourRequest } = setup(async (path, init) => {
    requestedPath = path;
    requestedInit = init;
    return new Response(JSON.stringify({ page: 1, items: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });

  const query = new URLSearchParams({
    destination: 'Hoi An',
    departureDate: '2026-10-15',
    minPrice: '500000',
    maxPrice: '1500000',
    page: '1',
    pageSize: '20',
  });

  const response = await proxyTourRequest([], query);
  assert.equal(response.status, 200);
  assert.match(requestedPath, /^\/api\/v1\/tours\?/);
  assert.match(requestedPath, /destination=Hoi\+An/);
  assert.match(requestedPath, /departureDate=2026-10-15/);
  assert.match(requestedPath, /minPrice=500000/);
  assert.match(requestedPath, /maxPrice=1500000/);
  assert.match(requestedPath, /page=1/);
  assert.match(requestedPath, /pageSize=20/);
  assert.equal(requestedInit?.headers?.Accept, 'application/json, application/problem+json');
  assert.equal(requestedInit?.headers?.Authorization, undefined);
});

test('correct /api/v1/tours/{id} detail path without query', async () => {
  let requestedPath = '';

  const { proxyTourRequest } = setup(async (path) => {
    requestedPath = path;
    return new Response(JSON.stringify({ tourId: '9007199254740995', title: 'Hoi An Tour' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });

  const response = await proxyTourRequest(['9007199254740995'], new URLSearchParams());
  assert.equal(response.status, 200);
  assert.equal(requestedPath, '/api/v1/tours/9007199254740995');
  const body = await response.json();
  assert.equal(body.tourId, '9007199254740995');
});

test('unsupported query removal prevents query parameter injection and backend 400', async () => {
  let requestedPath = '';

  const { proxyTourRequest } = setup(async (path) => {
    requestedPath = path;
    return new Response(JSON.stringify({ page: 1, items: [] }), { status: 200 });
  });

  const query = new URLSearchParams({
    destination: 'Da Nang',
    unsupportedParam: 'malicious',
    internalFlag: 'true',
    admin: '1',
    sort: 'price',
  });

  await proxyTourRequest([], query);
  assert.ok(!requestedPath.includes('unsupportedParam'));
  assert.ok(!requestedPath.includes('internalFlag'));
  assert.ok(!requestedPath.includes('admin'));
  assert.ok(!requestedPath.includes('sort'));
  assert.ok(requestedPath.includes('destination=Da\+Nang'));
});

test('no Authorization header is ever attached to public tour requests', async () => {
  let capturedHeaders = null;

  const { proxyTourRequest } = setup(async (path, init) => {
    capturedHeaders = init.headers;
    return new Response(JSON.stringify({ page: 1, items: [] }), { status: 200 });
  });

  await proxyTourRequest([]);
  assert.equal(capturedHeaders?.Authorization, undefined);
  assert.equal(capturedHeaders?.authorization, undefined);
});

test('configuration failure returns RFC 7807 503 ProblemDetails', async () => {
  const { proxyTourRequest, BackendConfigurationError } = setup(async () => {
    throw new BackendConfigurationError();
  });

  const response = await proxyTourRequest([]);
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('Content-Type'), 'application/problem+json');
  const problem = await response.json();
  assert.equal(problem.status, 503);
  assert.equal(problem.errorCode, 'Tour.ServiceUnavailable');
  assert.equal(problem.title, 'Dịch vụ tour chưa được cấu hình.');
});

test('upstream network or timeout failure returns RFC 7807 502 ProblemDetails', async () => {
  const { proxyTourRequest } = setup(async () => {
    throw new Error('Connection refused to backend port');
  });

  const response = await proxyTourRequest([]);
  assert.equal(response.status, 502);
  assert.equal(response.headers.get('Content-Type'), 'application/problem+json');
  const problem = await response.json();
  assert.equal(problem.status, 502);
  assert.equal(problem.errorCode, 'Tour.UpstreamUnavailable');
  assert.equal(problem.title, 'Không thể kết nối máy chủ tour.');
});

test('passthrough 400, 404, 500 error status and body without modification', async () => {
  for (const status of [400, 404, 500]) {
    const errorBody = {
      status,
      title: status === 404 ? 'Tour.NotFound' : 'Error',
      detail: `Sample error ${status}`,
    };

    const { proxyTourRequest } = setup(async () => {
      return new Response(JSON.stringify(errorBody), {
        status,
        headers: { 'Content-Type': 'application/problem+json' },
      });
    });

    const response = await proxyTourRequest([status === 404 ? '9999' : '']);
    assert.equal(response.status, status);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    const body = await response.json();
    assert.deepEqual(body, errorBody);
  }
});
