import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const s = vi.hoisted(() => ({ auth: true, groups: vi.fn(), history: vi.fn(), post: vi.fn(), members: vi.fn(), direct: vi.fn() }));
vi.mock('@/features/auth/session/useWebSession', () => ({ useWebSession: () => ({ status: s.auth ? 'authenticated' : 'unauthenticated', context: s.auth ? { userId: 42, fullName: 'Host', role: 'Traveler' } : null }) }));
vi.mock('../services/chatNotifications', () => ({ subscribeToChatChanges: () => () => undefined }));
vi.mock('../services/travelGroupApi', async original => ({ ...(await original<object>()), fetchGroupConversations: s.groups, fetchGroupMessages: s.history, postGroupMessage: s.post, fetchChatMembers: s.members }));
vi.mock('../services/directChatApi', async original => ({ ...(await original<object>()), fetchDirectConversations: s.direct }));
import { GroupChatHub } from '../components/GroupChatHub';
const group = { groupId: 73, groupName: 'Nhóm trong database', itineraryId: 91, itineraryTitle: 'Trip', itinerarySourceType: 'Manual', hostUserId: 42, memberCount: 2, status: 'Active', lastMessage: null, lastMessageAtUtc: null };
const message = { messageId: 804, groupId: 73, senderUserId: 42, senderName: 'Host', messageType: 'text', content: 'Tin được lưu', createdAtUtc: '2026-11-23T00:00:00Z', isReadByMe: false, readByCount: 0, isPresentByMe: false, presentCount: 0, paidUserIds: [], pollVoteCounts: {} };
beforeEach(() => { vi.resetAllMocks(); s.auth = true; s.groups.mockResolvedValue({ items: [group], nextBeforeGroupId: null }); s.direct.mockResolvedValue({ items: [], nextBeforeConversationId: null }); s.history.mockResolvedValue([]); s.members.mockResolvedValue([{ memberId: 42, displayName: 'Host', isHost: true }, { memberId: 43, displayName: 'Member', isHost: false }]); });
afterEach(cleanup);
it('does not load sample conversations or allow guest sending', async () => {
  s.auth = false; render(<GroupChatHub />);
  expect(await screen.findByRole('link', { name: /Đăng nhập/ })).toBeDefined();
  expect(screen.queryByPlaceholderText('Nhập tin nhắn...')).toBeNull(); expect(s.groups).not.toHaveBeenCalled();
});
it('only displays a sent message after the server confirms persistence and uses the real ID', async () => {
  let finish!: (v: unknown) => void; s.post.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
  render(<GroupChatHub />); await screen.findByRole('button', { name: 'Mở Nhóm trong database' });
  const input = await screen.findByPlaceholderText('Nhập tin nhắn...'); fireEvent.change(input, { target: { value: 'Tin được lưu' } });
  fireEvent.click(screen.getByRole('button', { name: 'Gửi tin nhắn' }));
  await waitFor(() => expect(s.post).toHaveBeenCalled()); expect(within(screen.getByRole('log')).queryByText('Tin được lưu')).toBeNull();
  expect(s.post.mock.calls[0][0]).toBe(73); finish(message);
  expect(await screen.findByText('Tin được lưu')).toBeDefined();
});
it('retains the draft on failure and never creates a ghost success message', async () => {
  s.post.mockRejectedValue(new Error('unavailable')); render(<GroupChatHub />);
  const input = await screen.findByPlaceholderText('Nhập tin nhắn...'); fireEvent.change(input, { target: { value: 'Chưa được lưu' } });
  fireEvent.click(screen.getByRole('button', { name: 'Gửi tin nhắn' }));
  await screen.findByRole('alert'); expect((input as HTMLInputElement).value).toBe('Chưa được lưu');
  expect(within(screen.getByRole('log')).queryByText('Chưa được lưu')).toBeNull();
});
