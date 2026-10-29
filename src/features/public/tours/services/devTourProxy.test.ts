import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { isDevTourSearchEnabled, proxyDevTourRequest } from './devTourProxy';

const origin = 'http://127.0.0.1:3017';
const request = (query = '', headers: HeadersInit = {}) => new Request(`${origin}/api/dev/tours/search${query}`, { headers });

describe('local development Search V2 boundary', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('TM70_SEARCH_DEV_ENABLED', 'true');
    vi.stubEnv('TM70_SEARCH_DEV_ORIGIN', origin);
    vi.stubEnv('TM70_SEARCH_DEV_BACKEND_ORIGIN', 'http://127.0.0.1:5077');
    vi.stubEnv('TM70_SEARCH_DEV_KEY', 'ephemeral-test-only-key-32-characters');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ page: 1, pageSize: 20, totalCount: 0, totalPages: 0, asOfUtc: '2026-10-17T00:00:00Z', items: [] })));
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it('keeps the credential on the server and forwards only approved query keys', async () => {
    const response = await proxyDevTourRequest(request('?keyword=sea&mode=semantic'), 'search');
    expect(response.status).toBe(200);
    const [url, options] = vi.mocked(fetch).mock.calls[0];
    expect(String(url)).toBe('http://127.0.0.1:5077/api/dev/tours/search?keyword=sea&mode=semantic');
    expect(options).toMatchObject({ cache: 'no-store', redirect: 'error', headers: { 'X-TM70-Dev-Key': 'ephemeral-test-only-key-32-characters' } });
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.text()).not.toContain('ephemeral-test');
  });

  it.each(['production', 'test'])('fails closed outside the development runtime: %s', async (environment) => {
    vi.stubEnv('NODE_ENV', environment);
    expect(isDevTourSearchEnabled()).toBe(false);
    expect((await proxyDevTourRequest(request(), 'search')).status).toBe(404);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    ['TM70_SEARCH_DEV_ENABLED', 'false'], ['TM70_SEARCH_DEV_KEY', ''],
    ['TM70_SEARCH_DEV_ORIGIN', 'http://public.example'],
    ['TM70_SEARCH_DEV_BACKEND_ORIGIN', 'https://public.example'],
  ])('rejects invalid server configuration %s', async (key, value) => {
    vi.stubEnv(key, value);
    expect((await proxyDevTourRequest(request(), 'search')).status).toBe(404);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    { origin: 'https://foreign.example' }, { 'sec-fetch-site': 'cross-site' },
    { 'x-forwarded-for': '127.0.0.1' }, { forwarded: 'for=127.0.0.1' },
    { host: 'foreign.example' },
  ])('rejects untrusted browser or forwarding headers %j', async (headers) => {
    expect((await proxyDevTourRequest(request('', Object.fromEntries(Object.entries(headers).filter((entry): entry is [string, string] => typeof entry[1] === 'string'))), 'search')).status).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects a different URL origin and ambiguous duplicate filters', async () => {
    expect((await proxyDevTourRequest(new Request('http://localhost:3017/api/dev/tours/search'), 'search')).status).toBe(403);
    expect((await proxyDevTourRequest(request('?mode=semantic&mode=lexical'), 'search')).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(['Keyword=sea', 'secret=discard', 'departureDate=2027-01-01'])('rejects unknown or noncanonical V2 filters %s', async (query) => {
    expect((await proxyDevTourRequest(request(`?${query}`), 'search')).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('accepts the exact forwarding metadata that the pinned Next server generates on a loopback bind', async () => {
    expect((await proxyDevTourRequest(request('', { 'x-forwarded-for': '127.0.0.1', 'x-forwarded-host': '127.0.0.1:3017', 'x-forwarded-port': '3017', 'x-forwarded-proto': 'http' }), 'search')).status).toBe(200);
  });

  it('accepts Next internal localhost URL only with the exact external Host and full generated loopback metadata', async () => {
    const internal = new Request('http://localhost:3017/api/dev/tours/search', { headers: { host: '127.0.0.1:3017', 'x-forwarded-for': '127.0.0.1', 'x-forwarded-host': '127.0.0.1:3017', 'x-forwarded-port': '3017', 'x-forwarded-proto': 'http' } });
    expect((await proxyDevTourRequest(internal, 'search')).status).toBe(200);
  });

  it('passes cancellation upstream and hides internal failure details', async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ detail: 'database-secret' }, { status: 503 }));
    const response = await proxyDevTourRequest(request(), 'search');
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('database-secret');
    expect(vi.mocked(fetch).mock.calls[0][1]?.signal).toBeDefined();
  });

  it('rejects a non-loopback peer claim or forwarding chain even when every other header matches', async () => {
    for (const address of ['192.0.2.1', '127.0.0.1, 192.0.2.1']) {
      expect((await proxyDevTourRequest(request('', { 'x-forwarded-for': address, 'x-forwarded-host': '127.0.0.1:3017', 'x-forwarded-port': '3017', 'x-forwarded-proto': 'http' }), 'search')).status).toBe(403);
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  it('does not forward browser credentials and strips unrecognized upstream success fields', async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json([{ categoryId: 1, code: 'SEA', name: 'Sea', internalSecret: 'must-not-leak' }]));
    const response = await proxyDevTourRequest(request('', { authorization: 'Bearer browser-token', cookie: 'session=private', 'X-TM70-Dev-Key': 'browser-key' }), 'categories');
    expect(await response.json()).toEqual([{ categoryId: 1, code: 'SEA', name: 'Sea' }]);
    const options = vi.mocked(fetch).mock.calls[0][1];
    expect(options?.headers).toEqual({ Accept: 'application/json', 'X-TM70-Dev-Key': 'ephemeral-test-only-key-32-characters' });
  });

  it.each([200, 503])('forwards only the bounded Backend trace header on HTTP %s', async (status) => {
    const upstream = status === 200
      ? Response.json([{ categoryId: 1, code: 'SEA', name: 'Sea' }], { status })
      : Response.json({ errorCode: 'DevSearch.IndexIncomplete', detail: 'private-detail' }, { status });
    upstream.headers.set('X-TM70-Trace-Id', '0HNABC:00000001');
    upstream.headers.set('X-Private-Header', 'must-not-leak');
    upstream.headers.set('Set-Cookie', 'private-session=secret');
    vi.mocked(fetch).mockResolvedValue(upstream);
    const response = await proxyDevTourRequest(request(), 'categories');
    expect(response.status).toBe(status);
    expect(response.headers.get('X-TM70-Trace-Id')).toBe('0HNABC:00000001');
    expect(response.headers.get('X-Private-Header')).toBeNull();
    expect(response.headers.get('Set-Cookie')).toBeNull();
    expect(await response.text()).not.toContain('private-detail');
  });

  it.each(['', 'x'.repeat(257), 'bad\r\nInjected: value', 'contains spaces', 'unsafe<value>', 'safe\n', 'safe\r\n'])('discards invalid trace header %j', async (trace) => {
    const upstream = Response.json([]);
    const readHeader = upstream.headers.get.bind(upstream.headers);
    vi.spyOn(upstream.headers, 'get').mockImplementation((name) => name.toLowerCase() === 'x-tm70-trace-id' ? trace : readHeader(name));
    vi.mocked(fetch).mockResolvedValue(upstream);
    expect((await proxyDevTourRequest(request(), 'categories')).headers.get('X-TM70-Trace-Id')).toBeNull();
  });

  it('preserves a safe trace when malformed upstream JSON becomes a safe gateway error', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('invalid-json', { headers: { 'X-TM70-Trace-Id': 'safe-trace-1' } }));
    const response = await proxyDevTourRequest(request(), 'search');
    expect(response.status).toBe(502);
    expect(response.headers.get('X-TM70-Trace-Id')).toBe('safe-trace-1');
  });
});
