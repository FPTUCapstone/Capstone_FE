import { beforeEach, describe, expect, it, vi } from 'vitest';
import { proxyConsoleInbox } from './consoleInboxProxy';

const mocks = vi.hoisted(() => ({
  verify: vi.fn(),
  sameOrigin: vi.fn(),
  upstream: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({
  cookies: async () => ({ get: () => ({ value: 'console-cookie-token' }) }),
}));
vi.mock('@/lib/server/adminSession', () => ({
  ADMIN_ACCESS_TOKEN_COOKIE: 'admin-token',
  verifyAdminSessionFromCookies: mocks.verify,
  isSameOriginRequest: mocks.sameOrigin,
  jsonNoStore: (body: unknown, status: number) => Response.json(body, { status }),
}));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: mocks.upstream }));

const request = (userId: number, method = 'GET') => new Request(
  'https://tripmate.test/api/admin/notifications?unreadOnly=true&userId=42',
  { method, headers: { 'X-Notification-Session': String(userId), Authorization: 'Bearer public-token' } },
);

describe('console notification proxy', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.verify.mockReturnValue({ role: 'Staff', userId: 9 });
    mocks.sameOrigin.mockReturnValue(true);
  });

  it('uses the console cookie and forwards only inbox filters', async () => {
    mocks.upstream.mockResolvedValueOnce(Response.json({ items: [], nextBeforeId: null }));
    const response = await proxyConsoleInbox(request(9));
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(mocks.upstream).toHaveBeenCalledWith('/api/v1/notifications?unreadOnly=true', expect.objectContaining({
      headers: { Authorization: 'Bearer console-cookie-token' },
    }));
  });

  it('rejects requests from a previous console account before contacting the API', async () => {
    expect((await proxyConsoleInbox(request(8))).status).toBe(401);
    expect(mocks.upstream).not.toHaveBeenCalled();
  });

  it('requires a same-origin mark-read request and preserves the empty 204 response', async () => {
    mocks.sameOrigin.mockReturnValueOnce(false);
    expect((await proxyConsoleInbox(request(9, 'POST'), '7')).status).toBe(403);
    expect(mocks.upstream).not.toHaveBeenCalled();

    mocks.upstream.mockResolvedValueOnce(new Response(null, { status: 204 }));
    expect((await proxyConsoleInbox(request(9, 'POST'), '7')).status).toBe(204);
    expect(mocks.upstream).toHaveBeenCalledWith('/api/v1/notifications/7/read', expect.objectContaining({ method: 'POST' }));
  });
});
