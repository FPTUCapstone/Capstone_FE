import { beforeEach, describe, expect, it, vi } from 'vitest';

const { resolveWebSessionMock, fetchBackendMock } = vi.hoisted(() => ({
  resolveWebSessionMock: vi.fn(),
  fetchBackendMock: vi.fn(),
}));
vi.mock('@/lib/server/webSession', () => ({ resolveWebSession: resolveWebSessionMock }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: fetchBackendMock }));

import { proxyAlgorithmParameters } from './algorithmConfigProxy';

const values = { bufferTimeMinutes: 15, defaultTravelSpeedKmh: 30, reroutingSearchRadiusKm: 5, weatherAlertThresholdSeverity: 'Severe' };
const dto = { ...values, updatedAtUtc: '2026-09-21T02:00:00Z', updatedAtLocal: '21/09/2026 09:00:00' };
const UPSTREAM = '/api/v1/admin/system-configs/algorithm-parameters';
const SAME_ORIGIN = 'http://localhost:3000';
const ROUTE_URL = `${SAME_ORIGIN}/api/admin/system-configs/algorithm-parameters`;

function session(role: 'Administrator' | 'Staff' = 'Administrator') {
  return { accessToken: 'admin-token', role };
}

function jsonRequest(method: 'GET' | 'PUT', init: { origin?: string; body?: string; contentType?: string } = {}) {
  const headers: Record<string, string> = {};
  if (init.origin) headers.origin = init.origin;
  if (init.contentType) headers['content-type'] = init.contentType;
  return new Request(ROUTE_URL, { method, headers, body: method === 'PUT' ? init.body : undefined });
}

beforeEach(() => {
  vi.clearAllMocks();
  resolveWebSessionMock.mockResolvedValue(session());
});

describe('algorithm parameters proxy', () => {
  it('forwards the resolved access token to the upstream GET and passes the DTO through', async () => {
    fetchBackendMock.mockResolvedValue(new Response(JSON.stringify(dto), { status: 200, headers: { 'content-type': 'application/json' } }));
    const res = await proxyAlgorithmParameters(jsonRequest('GET'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(dto);
    const [path, init] = fetchBackendMock.mock.calls[0];
    expect(path).toBe(UPSTREAM);
    expect(init.method).toBe('GET');
    expect(init.headers.Authorization).toBe('Bearer admin-token');
  });

  it('returns 401 without touching the backend when there is no web session', async () => {
    resolveWebSessionMock.mockResolvedValue(null);
    const res = await proxyAlgorithmParameters(jsonRequest('GET'));
    expect(res.status).toBe(401);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('returns 403 for a Staff session without touching the backend', async () => {
    resolveWebSessionMock.mockResolvedValue(session('Staff'));
    const res = await proxyAlgorithmParameters(jsonRequest('GET'));
    expect(res.status).toBe(403);
    expect(fetchBackendMock).not.toHaveBeenCalled();
    expect(res.headers.getSetCookie()).toEqual([]);
  });

  it('forwards the PUT body of a same-origin JSON request', async () => {
    fetchBackendMock.mockResolvedValue(new Response(JSON.stringify(dto), { status: 200 }));
    const res = await proxyAlgorithmParameters(jsonRequest('PUT', { origin: SAME_ORIGIN, body: JSON.stringify(values), contentType: 'application/json' }));
    expect(res.status).toBe(200);
    const [, init] = fetchBackendMock.mock.calls[0];
    expect(init.method).toBe('PUT');
    expect(init.headers.Authorization).toBe('Bearer admin-token');
    expect(JSON.parse(init.body)).toEqual(values);
  });

  it('rejects a PUT without an origin header', async () => {
    const res = await proxyAlgorithmParameters(jsonRequest('PUT', { body: JSON.stringify(values), contentType: 'application/json' }));
    expect(res.status).toBe(403);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('rejects a cross-origin PUT', async () => {
    const res = await proxyAlgorithmParameters(jsonRequest('PUT', { origin: 'http://evil.example', body: JSON.stringify(values), contentType: 'application/json' }));
    expect(res.status).toBe(403);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('requires JSON content for PUT', async () => {
    const res = await proxyAlgorithmParameters(jsonRequest('PUT', { origin: SAME_ORIGIN, body: 'buffer=15', contentType: 'text/plain' }));
    expect(res.status).toBe(415);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('rejects malformed PUT JSON before contacting the backend', async () => {
    const res = await proxyAlgorithmParameters(jsonRequest('PUT', { origin: SAME_ORIGIN, body: '{not-json', contentType: 'application/json' }));
    expect(res.status).toBe(400);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('answers 401 when upstream rejects the token and passes upstream 403 through', async () => {
    fetchBackendMock.mockResolvedValueOnce(new Response(JSON.stringify({ title: 'denied' }), { status: 401 }));
    const unauthRes = await proxyAlgorithmParameters(jsonRequest('GET'));
    expect(unauthRes.status).toBe(401);

    fetchBackendMock.mockResolvedValueOnce(new Response(JSON.stringify({ title: 'forbidden' }), { status: 403 }));
    const forbiddenRes = await proxyAlgorithmParameters(jsonRequest('GET'));
    expect(forbiddenRes.status).toBe(403);
    expect(forbiddenRes.headers.getSetCookie()).toEqual([]);
  });

  it.each([[502, 503], [500, 503]])('maps upstream %i to %i', async (upstream, expected) => {
    fetchBackendMock.mockResolvedValue(new Response('boom', { status: upstream }));
    const res = await proxyAlgorithmParameters(jsonRequest('GET'));
    expect(res.status).toBe(expected);
  });

  it('maps a backend connection failure to 503', async () => {
    fetchBackendMock.mockRejectedValue(new TypeError('failed'));
    const res = await proxyAlgorithmParameters(jsonRequest('GET'));
    expect(res.status).toBe(503);
  });
});
