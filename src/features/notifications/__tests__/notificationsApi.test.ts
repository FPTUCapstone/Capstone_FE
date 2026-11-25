import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getNotificationInbox, markNotificationRead, NotificationsApiError } from '../notificationsApi';
import { AuthStorage } from '@/features/auth/session/authSession';

const mockItem = {
  id: 1,
  type: 'TourApproved',
  title: 'Tour approved',
  body: 'Your tour package "Hoi An Walking Tour" was approved.',
  relatedEntityType: 'Tour',
  relatedEntityId: 196,
  createdAtUtc: '2026-11-24T03:55:57.7299068Z',
  isRead: false,
};

describe('Notifications API', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AuthStorage, 'getAccessToken').mockReturnValue('mock-jwt-token');
  });

  it('getNotificationInbox calls the inbox endpoint with auth header and returns parsed response', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ items: [mockItem], nextBeforeId: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const result = await getNotificationInbox();
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe(1);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/notifications'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ Authorization: 'Bearer mock-jwt-token' }),
      })
    );
  });

  it('getNotificationInbox passes unreadOnly, limit and beforeId as query params', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ items: [], nextBeforeId: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await getNotificationInbox({ unreadOnly: true, limit: 10, beforeId: 42 });

    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain('unreadOnly=true');
    expect(calledUrl).toContain('limit=10');
    expect(calledUrl).toContain('beforeId=42');
  });

  it('markNotificationRead sends POST to the read endpoint', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(null, { status: 204 })
    );

    await markNotificationRead(1);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/notifications/1/read'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('uses the HttpOnly console session without attaching the public bearer', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ items: [], nextBeforeId: null }), { status: 200 })
    );

    await getNotificationInbox({ consoleSessionKey: 19 });

    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/admin/notifications?limit=20',
      expect.objectContaining({ method: 'GET', headers: expect.not.objectContaining({ Authorization: expect.anything() }) })
    );
    expect(fetchSpy.mock.calls[0][1]?.headers).toMatchObject({ 'X-Notification-Session': '19' });
  });

  it('throws NotificationsApiError with AUTH_REQUIRED when no access token is present', async () => {
    vi.spyOn(AuthStorage, 'getAccessToken').mockReturnValue(null);
    await expect(getNotificationInbox()).rejects.toThrow(NotificationsApiError);
  });

  it('clears auth and throws on 401', async () => {
    const clearSpy = vi.spyOn(AuthStorage, 'clear').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ title: 'Unauthorized' }), { status: 401 })
    );

    await expect(getNotificationInbox()).rejects.toThrow(NotificationsApiError);
    expect(clearSpy).toHaveBeenCalled();
  });

  it('preserves a new Web session when the previous bearer gets a late 401', async () => {
    const token = vi.mocked(AuthStorage.getAccessToken);
    token.mockReturnValueOnce('previous-token').mockReturnValue('new-token');
    const clearSpy = vi.spyOn(AuthStorage, 'clear').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null, { status: 401 }));

    await expect(getNotificationInbox()).rejects.toThrow(NotificationsApiError);
    expect(clearSpy).not.toHaveBeenCalled();
  });

  it('throws NotificationsApiError on 403', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ title: 'Forbidden' }), { status: 403 })
    );

    await expect(getNotificationInbox()).rejects.toThrow(NotificationsApiError);
  });

  it('throws NotificationsApiError on malformed response body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ items: 'not-an-array' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    await expect(getNotificationInbox()).rejects.toThrow(NotificationsApiError);
  });

  it('throws NotificationsApiError on network failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(getNotificationInbox()).rejects.toThrow(NotificationsApiError);
  });
});
