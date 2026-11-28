import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const s = vi.hoisted(() => ({ auth: true, groups: vi.fn(), history: vi.fn(), post: vi.fn(), members: vi.fn(), direct: vi.fn() }));
vi.mock('@/features/auth/session/useWebSession', () => ({ useWebSession: () => ({ status: s.auth ? 'authenticated' : 'unauthenticated', context: s.auth ? { userId: 42, fullName: 'Host', role: 'Traveler' } : null }) }));
vi.mock('../services/chatNotifications', () => ({ subscribeToChatChanges: () => () => undefined }));
vi.mock('../services/travelGroupApi', async original => ({ ...(await original<object>()), fetchGroupConversations: s.groups, fetchGroupMessages: s.history, postGroupMessage: s.post, fetchChatMembers: s.members }));
vi.mock('../services/directChatApi', async original => ({ ...(await original<object>()), fetchDirectConversations: s.direct }));
vi.mock('../services/chatGroupApi', async original => ({ ...(await original<object>()), fetchChatGroupConversations: vi.fn(async () => ({ items: [], nextBeforeGroupId: null })) }));
import { GroupChatHub } from '../components/GroupChatHub';
const group = { groupId: 73, groupName: 'Nhóm trong database', itineraryId: 91, itineraryTitle: 'Trip', itinerarySourceType: 'Manual', hostUserId: 42, memberCount: 2, status: 'Active', lastMessage: null, lastMessageAtUtc: null };
const message = { messageId: 804, groupId: 73, senderUserId: 42, senderName: 'Host', messageType: 'text', content: 'Tin được lưu', createdAtUtc: '2026-11-23T00:00:00Z', isReadByMe: false, readByCount: 0, isPresentByMe: false, presentCount: 0, paidUserIds: [], pollVoteCounts: {} };
beforeEach(() => { vi.resetAllMocks(); s.auth = true; s.groups.mockResolvedValue({ items: [group], nextBeforeGroupId: null }); s.direct.mockResolvedValue({ items: [], nextBeforeConversationId: null }); s.history.mockResolvedValue([]); s.members.mockResolvedValue([{ memberId: 42, displayName: 'Host', isHost: true }, { memberId: 43, displayName: 'Member', isHost: false }]); });
afterEach(cleanup);
it('keeps group actions compact and exposes invite-code entry in the conversation picker', async () => {
  render(<GroupChatHub dock />);
  fireEvent(window, new Event('tripmate:toggle-messenger'));
  const picker = await screen.findByRole('complementary', { name: 'Danh sách trò chuyện' });
  expect(within(picker).getByRole('button', { name: 'Nhập mã mời nhóm du lịch' })).toBeDefined();
  fireEvent.click(within(picker).getByRole('button', { name: 'Mở Nhóm trong database' }));
  expect(await screen.findByRole('button', { name: 'Thông tin nhóm và thành viên' })).toBeDefined();
  expect(screen.queryByRole('button', { name: 'Mời vào nhóm du lịch' })).toBeNull();
});
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

it('provides exit navigation and unread filtering in the messenger workspace', async () => {
  render(<GroupChatHub />);
  await screen.findByRole('button', { name: 'Mở Nhóm trong database' });
  expect(screen.getByRole('link', { name: 'Quay lại TripMate' }).getAttribute('href')).toBe('/itineraries');
  fireEvent.click(screen.getByRole('button', { name: 'Chưa đọc' }));
  expect(screen.queryByRole('button', { name: 'Mở Nhóm trong database' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Bạn bè và lời mời' })).toBeDefined();
});

it('opens header picker, minimizes to a bubble and restores the draft without navigating', async () => {
  render(<GroupChatHub dock />);
  fireEvent(window, new Event('tripmate:toggle-messenger'));
  await screen.findByRole('button', { name: 'Mở Nhóm trong database' });
  fireEvent.click(screen.getByRole('button', { name: 'Mở Nhóm trong database' }));
  const input = await screen.findByRole('textbox', { name: 'Nội dung tin nhắn' });
  fireEvent.change(input, { target: { value: 'Bản nháp cần giữ' } });
  fireEvent.click(screen.getByRole('button', { name: 'Thu nhỏ cuộc trò chuyện' }));
  expect(screen.queryByRole('textbox', { name: 'Nội dung tin nhắn' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Mở lại Nhóm trong database' }));
  expect((screen.getByRole('textbox', { name: 'Nội dung tin nhắn' }) as HTMLTextAreaElement).value).toBe('Bản nháp cần giữ');
  fireEvent.click(screen.getByRole('button', { name: 'Đóng cuộc trò chuyện' }));
  expect(screen.queryByRole('button', { name: 'Mở lại Nhóm trong database' })).toBeNull();
});
