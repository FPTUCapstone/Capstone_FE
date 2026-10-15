import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cookiesMock, fetchBackendMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  fetchBackendMock: vi.fn(),
}));
vi.mock('next/headers', () => ({ cookies: cookiesMock }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: fetchBackendMock }));

import { proxyTravelerProfile } from './travelerProfileProxy';

function request(method = 'GET', body?: FormData, origin = 'http://localhost:3001') {
  const url = 'http://localhost:3001/api/traveler/profile';
  if (method === 'GET') return new Request(url);
  const fields = Array.from(body?.entries() ?? []);
  const multipart = fields.map(([name, value]) =>
    `--test\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`).join('') + '--test--\r\n';
  return new Request(url, {
    method,
    headers: { Origin: origin, 'Content-Type': 'multipart/form-data; boundary=test' },
    body: multipart,
  });
}

describe('traveler profile BFF', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookiesMock.mockResolvedValue({ get: () => ({ value: 'refresh' }) });
    fetchBackendMock.mockImplementation(async (path: string) => path === '/api/v1/auth/web/refresh'
      ? Response.json({ data: { role: 'Traveler', accessToken: 'secret-token' } })
      : Response.json({ userId: 1, fullName: 'Traveler', email: 'a@example.com' }));
  });

  it('rejects cross-origin PUT before accessing credentials', async () => {
    const response = await proxyTravelerProfile(request('PUT', new FormData(), 'https://attacker.test'));
    expect(response.status).toBe(403);
    expect(cookiesMock).not.toHaveBeenCalled();
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('rejects a missing refresh cookie', async () => {
    cookiesMock.mockResolvedValue({ get: () => undefined });
    expect((await proxyTravelerProfile(request())).status).toBe(401);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('forwards multipart with server-side token and does not return it', async () => {
    const body = new FormData();
    body.set('fullName', 'Traveler');
    const put = request('PUT', body);
    const response = await proxyTravelerProfile(put);
    expect(response.status).toBe(200);
    expect(fetchBackendMock.mock.calls[1][0]).toBe('/api/v1/traveler/profile');
    expect(fetchBackendMock.mock.calls[1][1].headers.Authorization).toBe('Bearer secret-token');
    expect(fetchBackendMock.mock.calls[1][1].body.get('fullName')).toBe('Traveler');
    expect(JSON.stringify(await response.json())).not.toContain('secret-token');
  });

  it('rejects an oversized streamed multipart request without Content-Length before parsing or forwarding', async () => {
    let chunkCount = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new Uint8Array(1024 * 1024));
        if (++chunkCount === 7) controller.close();
      },
    });
    const oversized = new Request('http://localhost:3001/api/traveler/profile', {
      method: 'PUT',
      headers: {
        Origin: 'http://localhost:3001',
        'Content-Type': 'multipart/form-data; boundary=large',
      },
      body,
      duplex: 'half',
    } as RequestInit & { duplex: 'half' });

    const response = await proxyTravelerProfile(oversized);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ errorCode: 'MSG19' });
    expect(fetchBackendMock.mock.calls.some(([path]) => path === '/api/v1/traveler/profile')).toBe(false);
  });

  it('denies non-Traveler role without calling the profile endpoint', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({ data: {
      role: 'Administrator', accessToken: 'admin-token' } }));
    expect((await proxyTravelerProfile(request())).status).toBe(403);
    expect(fetchBackendMock).toHaveBeenCalledTimes(1);
  });

  it('redacts upstream internal errors', async () => {
    fetchBackendMock.mockImplementation(async (path: string) => path === '/api/v1/auth/web/refresh'
      ? Response.json({ data: { role: 'Traveler', accessToken: 'secret-token' } })
      : Response.json({ detail: 'SQL password leaked' }, { status: 500 }));
    const response = await proxyTravelerProfile(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ errorCode: 'MSG127' });
  });

  it('passes through only the catalog code for a duplicate phone conflict', async () => {
    fetchBackendMock.mockImplementation(async (path: string) => path === '/api/v1/auth/web/refresh'
      ? Response.json({ data: { role: 'Traveler', accessToken: 'secret-token' } })
      : Response.json({ errorCode: 'MSG_PHONE_DUP', detail: 'SQL unique index details' }, { status: 409 }));
    const response = await proxyTravelerProfile(request('PUT', new FormData()));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ errorCode: 'MSG_PHONE_DUP' });
  });
});
