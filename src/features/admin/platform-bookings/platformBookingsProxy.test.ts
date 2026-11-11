import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { cookiesMock, fetchBackendMock } = vi.hoisted(() => ({ cookiesMock: vi.fn(), fetchBackendMock: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: cookiesMock }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: fetchBackendMock }));

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_SESSION_SEAL_COOKIE,
  ADMIN_SESSION_SECRET_ENV,
  createAdminSessionSeal,
} from '@/lib/server/adminSession';
import { proxyPlatformBookings } from './platformBookingsProxy';

const testSecret = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8').toString('base64url');
let priorSecret: string | undefined;

function mockSession(role: 'Administrator' | 'Staff', token = 'staff-token') {
  const sealed = createAdminSessionSeal({ token, role, expiresAt: new Date(Date.now() + 600_000), secret: testSecret })!;
  cookiesMock.mockResolvedValue({
    get: (name: string) => name === ADMIN_ACCESS_TOKEN_COOKIE ? { value: token } : name === ADMIN_SESSION_SEAL_COOKIE ? { value: sealed.seal } : undefined,
  });
}

function request(query = '') { return new Request(`http://localhost:3000/api/admin/bookings${query}`); }

beforeEach(() => {
  vi.clearAllMocks();
  priorSecret = process.env[ADMIN_SESSION_SECRET_ENV];
  process.env[ADMIN_SESSION_SECRET_ENV] = testSecret;
  mockSession('Staff');
});

afterEach(() => {
  if (priorSecret === undefined) delete process.env[ADMIN_SESSION_SECRET_ENV];
  else process.env[ADMIN_SESSION_SECRET_ENV] = priorSecret;
});

describe('platform bookings proxy', () => {
  it('forwards only allowed query fields and forces the server page size', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({ items: [] }));
    const response = await proxyPlatformBookings(request('?keyword=BK-12&status=Confirmed&pageNumber=2&pageSize=999&internal=true'));
    expect(response.status).toBe(200);
    const [path, init] = fetchBackendMock.mock.calls[0];
    expect(path).toBe('/api/v1/admin/bookings?keyword=BK-12&status=Confirmed&pageNumber=2&pageSize=20');
    expect(init.headers.Authorization).toBe('Bearer staff-token');
  });

  it('requires a valid Staff session before calling the backend', async () => {
    cookiesMock.mockResolvedValue({ get: () => undefined });
    expect((await proxyPlatformBookings(request())).status).toBe(401);
    mockSession('Administrator');
    expect((await proxyPlatformBookings(request())).status).toBe(403);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('clears the session only for an upstream 401 response', async () => {
    fetchBackendMock.mockResolvedValue(new Response('expired', { status: 401 }));
    const response = await proxyPlatformBookings(request());
    expect(response.status).toBe(401);
    expect(response.headers.getSetCookie().some(value => value.startsWith(`${ADMIN_ACCESS_TOKEN_COOKIE}=`) && value.includes('Max-Age=0'))).toBe(true);
  });

  it('does not leak backend problem details and maps backend outages to retryable 503', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({ title: 'Invalid booking range.', errorCode: 'booking.invalid_range', detail: 'private', traceId: 'private-trace' }, { status: 400 }));
    await expect((await proxyPlatformBookings(request())).json()).resolves.toEqual({ title: 'Invalid booking range.', errorCode: 'booking.invalid_range' });
    fetchBackendMock.mockResolvedValue(new Response('unavailable', { status: 503 }));
    expect((await proxyPlatformBookings(request())).status).toBe(503);
  });
});
