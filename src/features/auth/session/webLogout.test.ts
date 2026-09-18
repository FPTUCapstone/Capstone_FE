import { afterEach, expect, it, vi } from 'vitest';
import { webLogout } from '@/lib/authApi';
import { AuthStorage } from './authSession';

// UC-05: the logout contract is cookie-credential, body-free, and
// status-based — a 200 direct DTO succeeds even when the body is empty or
// non-JSON, because success must never depend on envelope parsing.
afterEach(() => { vi.unstubAllGlobals(); AuthStorage.clear(); });

it('sends POST /auth/web/logout with cookie credentials and no credential body', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'Signed out successfully.' }), { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  await webLogout();
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toMatch(/\/auth\/web\/logout$/);
  expect(options.method).toBe('POST');
  expect(options.credentials).toBe('include');
});

it('carries no body, no Content-Type and no Authorization header for logout', async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
  await webLogout();
  const [, options] = fetchMock.mock.calls[0];
  expect(options.body).toBeUndefined();
  expect(options.headers).toBeUndefined();
});

it('resolves on HTTP 200 with the JSON message DTO', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'Signed out successfully.' }), { status: 200 })));
  await expect(webLogout()).resolves.toBeUndefined();
});

it('resolves on HTTP 200 with an empty body', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
  await expect(webLogout()).resolves.toBeUndefined();
});

it('resolves on HTTP 200 with a non-JSON body', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('OK - plain text', { status: 200 })));
  await expect(webLogout()).resolves.toBeUndefined();
});

it('maps a network failure to the safe NETWORK ApiError convention', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network down')));
  await expect(webLogout()).rejects.toMatchObject({ code: 'NETWORK', status: 0 });
});

it('maps an unexpected 500 ProblemDetails to the existing ApiError convention', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ title: 'An unexpected error occurred.', errorCode: 'MSG127' }), { status: 500 })));
  await expect(webLogout()).rejects.toMatchObject({ status: 500, code: 'MSG127' });
});

it('treats a rejected non-2xx as failure without inventing a success envelope', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 503 })));
  await expect(webLogout()).rejects.toMatchObject({ status: 503 });
});
