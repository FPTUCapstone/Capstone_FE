import { afterEach, expect, it, vi } from 'vitest';
import { AuthStorage } from '@/features/auth/session/authSession';
import { fetchDirectMessages, searchChatUsers, sendDirectMessage } from './directChatApi';
vi.mock('@/features/auth/session/authSession', () => ({ AuthStorage: { getContext: vi.fn(() => ({ userId: 42, accessToken: 'access' })) } }));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });
it('requires a meaningful search and sends a trimmed encoded query with no account dump', async () => {
  const request = vi.fn().mockResolvedValue(new Response(JSON.stringify([{ userId: 43, displayName: 'A B', avatarUrl: null }])));
  vi.stubGlobal('fetch', request);
  expect(await searchChatUsers(' ')).toEqual([]); expect(request).not.toHaveBeenCalled();
  expect(await searchChatUsers(' A B ')).toHaveLength(1);
  expect(request.mock.calls[0][0]).toMatch(/search=A\+B/);
});
it('rejects history for a different conversation and missing read state', async () => {
  const row = { messageId: 1, conversationId: 13, senderUserId: 43, senderName: 'Member', content: 'Private', createdAtUtc: '2026-11-24T00:00:00Z', clientMessageId: 'key', isReadByOther: false };
  const request = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify([row])))
    .mockResolvedValueOnce(new Response(JSON.stringify([{ ...row, conversationId: 12, isReadByOther: undefined }])));
  vi.stubGlobal('fetch', request);
  await expect(fetchDirectMessages(12)).rejects.toMatchObject({ status: 502 });
  await expect(fetchDirectMessages(12)).rejects.toMatchObject({ status: 502 });
});
it('rejects null entries in user search without crashing', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('[null]')));
  await expect(searchChatUsers('Member')).rejects.toMatchObject({ status: 502 });
});
it('uses a stable client message ID for retries and does not replay server failures', async () => {
  expect(AuthStorage.getContext()?.userId).toBe(42);
  const request = vi.fn().mockResolvedValue(new Response('{}', { status: 503 })); vi.stubGlobal('fetch', request);
  await expect(sendDirectMessage(12, 'Hello', 'one-client-key')).rejects.toMatchObject({ status: 503 });
  expect(request).toHaveBeenCalledTimes(1);
  expect(JSON.parse(request.mock.calls[0][1].body)).toEqual({ content: 'Hello', clientMessageId: 'one-client-key' });
});
