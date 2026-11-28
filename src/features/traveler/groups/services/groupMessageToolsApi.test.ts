import { afterEach, expect, it, vi } from 'vitest';
import { editGroupMessage, fetchImportantMessages, fetchPollVoters } from './groupMessageToolsApi';
vi.mock('@/features/auth/session/authSession', () => ({ AuthStorage: { getContext: vi.fn(() => ({ userId: 42, accessToken: 'access' })) } }));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });
const message = { messageId: 3, groupId: 1, senderUserId: 42, senderName: 'Host', content: 'Đi đâu?', messageType: 'poll', createdAtUtc: '2026-11-24T00:00:00Z', readByCount: 0, isReadByMe: false, presentCount: 0, isPresentByMe: false, paidUserIds: [], pollVoteCounts: {}, revision: 1 };
it('uses a separate descending cursor for important messages outside the history window', async () => {
  const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ items: [message], nextBeforeMessageId: 3 }))); vi.stubGlobal('fetch', request);
  expect((await fetchImportantMessages(1, 99)).items).toEqual([message]);
  expect(request.mock.calls[0][0]).toMatch(/messages\/important\?limit=20&beforeMessageId=99$/);
});
it('rejects cross-group highlights, stalled cursors and invalid voter identities', async () => {
  const request = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ items: [{ ...message, groupId: 2 }], nextBeforeMessageId: null })))
    .mockResolvedValueOnce(new Response(JSON.stringify({ items: [message], nextBeforeMessageId: 99 })))
    .mockResolvedValueOnce(new Response(JSON.stringify([{ userId: 0, displayName: 'Invalid', avatarUrl: null, optionIndex: 9, votedAtUtc: 'invalid' }]))); vi.stubGlobal('fetch', request);
  await expect(fetchImportantMessages(1)).rejects.toMatchObject({ status: 502 });
  await expect(fetchImportantMessages(1)).rejects.toMatchObject({ status: 502 });
  await expect(fetchPollVoters(1, 3)).rejects.toMatchObject({ status: 502 });
});
it('sends the exact edit revision and retry key, and reports interaction conflicts safely', async () => {
  const request = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(message))).mockResolvedValueOnce(new Response(JSON.stringify({ detail: 'conflict' }), { status: 409 })); vi.stubGlobal('fetch', request);
  const payload = { content: 'Đi đâu?', metadataJson: '{}', expectedRevision: 0, clientRequestId: 'test-key' };
  expect(await editGroupMessage(1, 3, payload)).toEqual(message);
  expect(request.mock.calls[0][1].method).toBe('PUT');
  expect(JSON.parse(request.mock.calls[0][1].body)).toEqual(payload);
  await expect(editGroupMessage(1, 3, payload)).rejects.toMatchObject({ status: 409, message: expect.stringContaining('đã có người tương tác') });
});
