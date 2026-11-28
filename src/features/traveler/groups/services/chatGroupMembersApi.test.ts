import { afterEach, expect, it, vi } from 'vitest';
import { fetchChatGroupMembers } from './chatGroupMembersApi';
vi.mock('@/features/auth/session/authSession', () => ({ AuthStorage: { getContext: vi.fn(() => ({ userId: 42, accessToken: 'access' })) } }));
afterEach(() => vi.unstubAllGlobals());
const members = [{ userId: 42, displayName: 'Host', avatarUrl: null, isHost: true }, { userId: 43, displayName: 'Friend', avatarUrl: null, isHost: false }];
it('uses the confirmed members endpoint and adapts only the public member fields', async () => {
  const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({ groupId: 1, groupName: 'Friends', memberCount: 2, members }))); vi.stubGlobal('fetch', request);
  const signal = new AbortController().signal;
  expect(await fetchChatGroupMembers(1, signal)).toEqual([{ memberId: 42, displayName: 'Host', isHost: true, canReceiveHost: false }, { memberId: 43, displayName: 'Friend', isHost: false, canReceiveHost: false }]);
  expect(request.mock.calls[0][0]).toMatch(/\/chat-groups\/1\/members$/); expect(request.mock.calls[0][1].signal).toBe(signal);
});
it('preserves only explicit boolean host eligibility', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ groupId: 1, groupName: 'Friends', memberCount: 2,
    members: [{ ...members[0], canReceiveHost: false }, { ...members[1], canReceiveHost: true }] }))));
  expect((await fetchChatGroupMembers(1)).map(member => member.canReceiveHost)).toEqual([false, true]);
});
it.each(['true', 1, null])('rejects nonboolean host eligibility %j', async canReceiveHost => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ groupId: 1, groupName: 'Friends', memberCount: 2,
    members: [members[0], { ...members[1], canReceiveHost }] }))));
  await expect(fetchChatGroupMembers(1)).rejects.toMatchObject({ status: 502 });
});
it.each([{ groupId: 2, members }, { groupId: 1, members: [null] }, { groupId: 1, members: [{ ...members[0], isHost: 'true' }] }])('rejects malformed or cross-group membership data', async payload => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ groupName: 'Friends', memberCount: 2, ...payload }))));
  await expect(fetchChatGroupMembers(1)).rejects.toMatchObject({ status: 502 });
});
