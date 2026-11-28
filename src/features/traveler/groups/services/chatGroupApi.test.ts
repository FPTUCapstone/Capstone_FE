import { afterEach, expect, it, vi } from 'vitest';
import { createChatGroup, fetchChatGroupConversations, fetchChatGroupMessages, markChatGroupRead, sendChatGroupMessage } from './chatGroupApi';

vi.mock('@/features/auth/session/authSession', () => ({ AuthStorage: { getContext: vi.fn(() => ({ userId: 42, accessToken: 'access' })) } }));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });
const group = { groupId: 1, groupName: 'Friends', memberCount: 2, hostUserId: 42, lastMessage: null, lastMessageAtUtc: null, unreadCount: 0 };
const message = { messageId: 3, groupId: 1, senderUserId: 43, senderName: 'Friend', content: 'Hello', createdAtUtc: '2026-11-24T00:00:00Z', clientMessageId: 'nonce' };
it('creates with the supplied retry GUID and forwards cancellation', async () => {
  const request = vi.fn().mockResolvedValue(new Response(JSON.stringify(group))); vi.stubGlobal('fetch', request);
  const signal = new AbortController().signal;
  expect(await createChatGroup('Friends', [43], '12345678-1234-4234-8234-123456789012', signal)).toEqual(group);
  expect(request.mock.calls[0][0]).toMatch(/\/chat-groups$/);
  expect(request.mock.calls[0][1].signal).toBe(signal);
  expect(JSON.parse(request.mock.calls[0][1].body)).toEqual({ name: 'Friends', memberUserIds: [43], clientRequestId: '12345678-1234-4234-8234-123456789012' });
});
it('uses independent list and message cursors and maps only text interaction defaults', async () => {
  const request = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ items: [group], nextBeforeGroupId: 1 })))
    .mockResolvedValueOnce(new Response(JSON.stringify([message]))); vi.stubGlobal('fetch', request);
  expect((await fetchChatGroupConversations(9)).items).toEqual([group]);
  expect(request.mock.calls[0][0]).toMatch(/chat-groups\?limit=50&beforeGroupId=9$/);
  expect(await fetchChatGroupMessages(1, 8)).toEqual([{ ...message, messageType: 'text', readByCount: 0, isReadByMe: false, presentCount: 0, isPresentByMe: false, paidUserIds: [], pollVoteCounts: {}, myPollVoteOption: null }]);
  expect(request.mock.calls[1][0]).toMatch(/chat-groups\/1\/messages\?limit=50&beforeMessageId=8$/);
});
it('rejects malformed list data, cross-group messages and descending history', async () => {
  const request = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ ...group, hostUserId: 0 }], nextBeforeGroupId: null })))
    .mockResolvedValueOnce(new Response(JSON.stringify([{ ...message, groupId: 2 }])))
    .mockResolvedValueOnce(new Response(JSON.stringify([message, { ...message, messageId: 2 }]))); vi.stubGlobal('fetch', request);
  await expect(fetchChatGroupConversations()).rejects.toMatchObject({ status: 502 });
  await expect(fetchChatGroupMessages(1)).rejects.toMatchObject({ status: 502 });
  await expect(fetchChatGroupMessages(1)).rejects.toMatchObject({ status: 502 });
});
it('sends a text-only payload with a stable nonce and posts the read cursor', async () => {
  const request = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(message))).mockResolvedValueOnce(new Response(null, { status: 204 })); vi.stubGlobal('fetch', request);
  expect(await sendChatGroupMessage(1, 'Hello', 'nonce')).toMatchObject({ messageType: 'text', clientMessageId: 'nonce' });
  expect(JSON.parse(request.mock.calls[0][1].body)).toEqual({ content: 'Hello', clientMessageId: 'nonce' });
  await markChatGroupRead(1, 3);
  expect(request.mock.calls[1][0]).toMatch(/chat-groups\/1\/read$/);
  expect(JSON.parse(request.mock.calls[1][1].body)).toEqual({ throughMessageId: 3 });
});
