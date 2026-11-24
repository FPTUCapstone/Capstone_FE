import { afterEach, expect, it, vi } from 'vitest';
import { AuthStorage } from '@/features/auth/session/authSession';
import { fetchGroupConversations, fetchGroupMessages, votePollOption } from './travelGroupApi';

vi.mock('@/features/auth/session/authSession', () => ({ AuthStorage: { getContext: vi.fn(() => ({ userId: 42, accessToken: 'test-access' })) } }));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

it('loads real conversations with the authenticated identity and exact group IDs', async () => {
  const data = { items: [{ groupId: 73, groupName: 'Database group', itineraryId: 91, itineraryTitle: 'Trip', itinerarySourceType: 'Manual', hostUserId: 42, memberCount: 2, status: 'Active', lastMessage: null, lastMessageAtUtc: null }], nextBeforeGroupId: null };
  const request = vi.fn().mockResolvedValue(new Response(JSON.stringify(data)));
  vi.stubGlobal('fetch', request);
  expect(await fetchGroupConversations()).toEqual(data);
  expect(request.mock.calls[0][0]).toMatch(/travel-groups\/conversations/);
  expect(request.mock.calls[0][1].headers.Authorization).toBe('Bearer test-access');
});

it('does not invent a current user or issue guest mutations', async () => {
  vi.mocked(AuthStorage.getContext).mockReturnValueOnce(null);
  const request = vi.fn(); vi.stubGlobal('fetch', request);
  await expect(votePollOption(73, 804, 0)).rejects.toMatchObject({ status: 401 });
  expect(request).not.toHaveBeenCalled();
});

it('rejects malformed message data instead of replacing it with sample messages', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify([{ messageId: 'bad' }]))));
  await expect(fetchGroupMessages(73)).rejects.toMatchObject({ status: 502 });
});
