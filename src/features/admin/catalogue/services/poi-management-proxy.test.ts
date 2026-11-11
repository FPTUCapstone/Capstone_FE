import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { cookiesMock, fetchBackendMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  fetchBackendMock: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: cookiesMock }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: fetchBackendMock }));
vi.mock('@/lib/server/adminSession', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/server/adminSession')>();
  return { ...actual, verifyAdminSessionFromCookies: vi.fn(actual.verifyAdminSessionFromCookies) };
});

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_SESSION_SEAL_COOKIE,
  ADMIN_SESSION_SECRET_ENV,
  createAdminSessionSeal,
  verifyAdminSessionFromCookies,
} from '@/lib/server/adminSession';
import { proxyPoiManagementList } from './poi-management-proxy';

const TEST_SECRET = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8').toString('base64url');
const ROUTE = 'http://localhost:3001/api/admin/pois';

function payload() {
  return {
    page: 1, pageSize: 20, totalCount: 1, totalPages: 1,
    metadata: { categories: [{ id: 7, name: 'Attraction' }, { id: 8, name: 'Empty' }] },
    items: [{
      id: '9007199254740993', name: 'Lake', categoryId: 7, categoryName: 'Attraction', address: null,
      latitude: 16, longitude: 108, status: 'Active', openingHours: [],
    }],
  };
}

function sealedCookies(role: 'Administrator' | 'Staff', token = `${role.toLowerCase()}-token`) {
  const seal = createAdminSessionSeal({
    token, role, expiresAt: new Date(Date.now() + 10 * 60 * 1000), secret: TEST_SECRET,
  })!;
  return {
    get: (name: string) => name === ADMIN_ACCESS_TOKEN_COOKIE ? { value: token }
      : name === ADMIN_SESSION_SEAL_COOKIE ? { value: seal.seal } : undefined,
  };
}

function request(query = '') {
  return new Request(`${ROUTE}${query ? `?${query}` : ''}`);
}

function assertNoStore(response: Response) {
  expect(response.headers.get('Cache-Control')).toBe('no-store');
}

let previousSecret: string | undefined;

beforeEach(async () => {
  vi.clearAllMocks();
  previousSecret = process.env[ADMIN_SESSION_SECRET_ENV];
  process.env[ADMIN_SESSION_SECRET_ENV] = TEST_SECRET;
  const actual = await vi.importActual<typeof import('@/lib/server/adminSession')>('@/lib/server/adminSession');
  vi.mocked(verifyAdminSessionFromCookies).mockImplementation(actual.verifyAdminSessionFromCookies);
  cookiesMock.mockResolvedValue(sealedCookies('Administrator'));
});

afterEach(() => {
  if (previousSecret === undefined) delete process.env[ADMIN_SESSION_SECRET_ENV];
  else process.env[ADMIN_SESSION_SECRET_ENV] = previousSecret;
});

describe('POI management-list BFF GET', () => {
  it('fails closed for missing, unsealed and expired sessions and never calls the backend', async () => {
    cookiesMock.mockResolvedValueOnce({ get: () => undefined });
    const missing = await proxyPoiManagementList(request());
    expect(missing.status).toBe(401);
    assertNoStore(missing);

    cookiesMock.mockResolvedValueOnce({
      get: (name: string) => name === ADMIN_ACCESS_TOKEN_COOKIE ? { value: 'unsealed-token' } : undefined,
    });
    const unsealed = await proxyPoiManagementList(request());
    expect(unsealed.status).toBe(401);
    expect(unsealed.headers.getSetCookie().some(value => value.includes('Max-Age=0'))).toBe(true);
    assertNoStore(unsealed);

    const now = Date.now();
    const expired = createAdminSessionSeal({
      token: 'expired-token', role: 'Staff', expiresAt: new Date(now - 60_000),
      nowMs: now - 120_000, secret: TEST_SECRET,
    })!;
    cookiesMock.mockResolvedValueOnce({
      get: (name: string) => name === ADMIN_ACCESS_TOKEN_COOKIE ? { value: 'expired-token' }
        : name === ADMIN_SESSION_SEAL_COOKIE ? { value: expired.seal } : undefined,
    });
    const expiredResponse = await proxyPoiManagementList(request());
    expect(expiredResponse.status).toBe(401);
    assertNoStore(expiredResponse);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('authenticates before query validation so an anonymous malformed request remains 401', async () => {
    cookiesMock.mockResolvedValue({ get: () => undefined });
    const response = await proxyPoiManagementList(request('page=0&status='));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ errorCode: 'POI_MANAGEMENT_ACCESS_REQUIRED' });
    assertNoStore(response);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it.each(['Administrator', 'Staff'] as const)('allows a sealed active %s session without an Origin header', async role => {
    cookiesMock.mockResolvedValue(sealedCookies(role));
    fetchBackendMock.mockResolvedValue(Response.json({ ...payload(), internalToken: 'do-not-return' }));
    const response = await proxyPoiManagementList(request('page=1&pageSize=20&search=lake%20%26%20park&categoryId=7&status=Active&url=https://evil.test'));
    expect(response.status).toBe(200);
    assertNoStore(response);
    const [path, init] = fetchBackendMock.mock.calls[0];
    expect(path).toBe('/api/v1/admin/pois?page=1&pageSize=20&search=lake+%26+park&categoryId=7&status=Active');
    expect(init).toMatchObject({ method: 'GET', headers: { Authorization: `Bearer ${role.toLowerCase()}-token` } });
    expect(JSON.stringify(await response.json())).not.toContain('internalToken');
  });

  it('forwards the exact request abort signal to the backend boundary', async () => {
    fetchBackendMock.mockResolvedValue(Response.json(payload()));
    const incoming = request();
    const response = await proxyPoiManagementList(incoming);
    expect(response.status).toBe(200);
    expect(fetchBackendMock.mock.calls[0][1].signal).toBe(incoming.signal);
    assertNoStore(response);
  });

  it('rejects a role outside the management contract with 403 and preserves its cookies', async () => {
    vi.mocked(verifyAdminSessionFromCookies).mockReturnValue({ role: 'Traveler' } as never);
    const response = await proxyPoiManagementList(request());
    expect(response.status).toBe(403);
    assertNoStore(response);
    expect(response.headers.getSetCookie()).toEqual([]);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it.each([
    'page=1&Page=2',
    'status=',
    'status=%20%20',
    'categoryId=',
    'categoryId=%20',
  ])('rejects invalid or duplicate recognized query values before the backend: %s', async query => {
    const response = await proxyPoiManagementList(request(query));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ errorCode: 'POI_MANAGEMENT_INVALID_QUERY' });
    assertNoStore(response);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('clears the session only for upstream 401 and maps a currently inactive actor 403 safely', async () => {
    fetchBackendMock.mockResolvedValueOnce(Response.json({ detail: 'private' }, { status: 401 }));
    const unauthenticated = await proxyPoiManagementList(request());
    expect(unauthenticated.status).toBe(401);
    expect(unauthenticated.headers.getSetCookie().some(value => value.includes('Max-Age=0'))).toBe(true);
    assertNoStore(unauthenticated);

    fetchBackendMock.mockResolvedValueOnce(Response.json({ detail: 'inactive account private detail' }, { status: 403 }));
    const forbidden = await proxyPoiManagementList(request());
    expect(forbidden.status).toBe(403);
    expect(forbidden.headers.getSetCookie()).toEqual([]);
    expect(await forbidden.json()).toEqual({ errorCode: 'POI_MANAGEMENT_ACCESS_REQUIRED' });
    assertNoStore(forbidden);
  });

  it('sanitizes upstream validation fields and category-not-found without forwarding messages', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({
      errorCode: 'POI_MANAGEMENT_CATEGORY_NOT_FOUND', detail: 'SQL secret',
      errors: { CategoryId: ['raw database detail'], token: ['bearer secret'] },
    }, { status: 400 }));
    const response = await proxyPoiManagementList(request('categoryId=2147483647'));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      errorCode: 'POI_MANAGEMENT_CATEGORY_NOT_FOUND',
      errors: { categoryId: ['Review this filter value.'] },
    });
    assertNoStore(response);
  });

  it('maps network, 5xx, unexpected status, invalid JSON and malformed DTO to safe retryable 503', async () => {
    const replies: Array<Response | Error> = [
      new Error('private backend origin'),
      Response.json({ detail: 'database password' }, { status: 500 }),
      Response.json({ token: 'private' }, { status: 302 }),
      new Response('<html>not json</html>', { status: 200 }),
      Response.json({ items: [] }, { status: 200 }),
    ];
    for (const reply of replies) {
      if (reply instanceof Error) fetchBackendMock.mockRejectedValueOnce(reply);
      else fetchBackendMock.mockResolvedValueOnce(reply);
      const response = await proxyPoiManagementList(request());
      expect(response.status).toBe(503);
      const body = await response.json();
      expect(body).toEqual({ errorCode: 'POI_MANAGEMENT_UNAVAILABLE' });
      expect(JSON.stringify(body)).not.toContain('private');
      assertNoStore(response);
    }
  });
});
