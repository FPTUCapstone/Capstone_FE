import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { GroupDetailsDialog } from '../components/GroupDetailsDialog';
import { groupThread, chatGroupThread } from '../components/useMessenger';
const api = vi.hoisted(() => ({ travel: vi.fn(), independent: vi.fn(), userId: 42, role: 'Traveler',
  travelLeave: vi.fn(), chatLeave: vi.fn(), pending: vi.fn(), pendingChat: vi.fn() }));
vi.mock('@/features/auth/session/authSession', async original => ({ ...(await original<object>()), AuthStorage: { getContext: () => ({ userId: api.userId, role: api.role, status: 'Active' }) } }));
vi.mock('../services/travelGroupApi', async original => ({ ...(await original<object>()), fetchChatMembers: api.travel }));
vi.mock('../services/chatGroupMembersApi', () => ({ fetchChatGroupMembers: api.independent }));
vi.mock('../services/groupLeaveApi', () => ({ leaveTravelGroup: api.travelLeave, leaveChatGroup: api.chatLeave,
  hasPendingGroupLeave: api.pending, getPendingChatGroupLeave: api.pendingChat }));
const group = { groupId: 1, groupName: 'Trip', memberCount: 2, hostUserId: 42, lastMessage: null, lastMessageAtUtc: null, unreadCount: 0 };
const travel = groupThread({ ...group, itineraryId: 2, itineraryTitle: 'Real itinerary', itinerarySourceType: 'Manual', status: 'Active' });
beforeEach(() => { vi.resetAllMocks(); api.userId = 42; api.role = 'Traveler'; api.pending.mockReturnValue(false); api.pendingChat.mockReturnValue(null); api.travel.mockResolvedValue([{ memberId: 42, displayName: 'Host', isHost: true }, { memberId: 43, displayName: 'Member', isHost: false }]); api.independent.mockResolvedValue([{ memberId: 42, displayName: 'Chat host', isHost: true }]); });
afterEach(cleanup);
it('shows real travel members, host invitations and the Web location entry point', async () => {
  const invite = vi.fn(), location = vi.fn(); render(<GroupDetailsDialog thread={travel} onClose={vi.fn()} onInvite={invite} onLocation={location} />);
  expect(await screen.findByText('Host')).toBeTruthy(); expect(screen.getByText('Member')).toBeTruthy();
  expect(api.travel).toHaveBeenCalledWith(1); expect(api.independent).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Mã mời / QR vào nhóm' })); expect(invite).toHaveBeenCalledOnce();
  expect(screen.getByText('Chia sẻ vị trí trong nhóm')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Thiết lập và xem vị trí' }));
  expect(location).toHaveBeenCalledOnce();
});
it('loads independent members without travel APIs, invitation tools, location guidance or contact details', async () => {
  api.independent.mockResolvedValue([{ memberId: 42, displayName: 'Chat host', isHost: true, email: 'private@example.com', phoneNumber: '0901234567' }]);
  render(<GroupDetailsDialog thread={chatGroupThread(group)} onClose={vi.fn()} onInvite={vi.fn()} />);
  expect(await screen.findByText('Chat host')).toBeTruthy(); expect(api.travel).not.toHaveBeenCalled();
  expect(api.independent).toHaveBeenCalledWith(1, expect.any(AbortSignal));
  expect(screen.queryByRole('button', { name: 'Mã mời / QR vào nhóm' })).toBeNull();
  expect(screen.queryByText(/Thiết lập chia sẻ vị trí/)).toBeNull();
  expect(screen.queryByText('private@example.com')).toBeNull(); expect(screen.queryByText('0901234567')).toBeNull();
});
it.each(['member', 'closed'] as const)('hides invitations for a %s even if a callback is supplied', async mode => {
  if (mode === 'member') api.userId = 43;
  render(<GroupDetailsDialog thread={mode === 'closed' ? { ...travel, group: { ...travel.group!, status: 'Closed' } } : travel} onClose={vi.fn()} onInvite={vi.fn()} />);
  await screen.findByText('Member'); expect(screen.queryByRole('button', { name: 'Mã mời / QR vào nhóm' })).toBeNull();
});
it('keeps member errors visible and retries without inventing fallback members', async () => {
  api.travel.mockRejectedValueOnce(new Error('offline'));
  render(<GroupDetailsDialog thread={travel} onClose={vi.fn()} />);
  await screen.findByRole('alert'); expect(screen.queryByText('Host')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
  expect(await screen.findByText('Member')).toBeTruthy(); expect(screen.queryByRole('alert')).toBeNull();
});
it('ignores late travel members after switching to an independent group with the same ID', async () => {
  let resolve!: (value: unknown) => void; api.travel.mockReturnValueOnce(new Promise(yes => { resolve = yes; }));
  const { rerender } = render(<GroupDetailsDialog thread={travel} onClose={vi.fn()} />);
  rerender(<GroupDetailsDialog thread={chatGroupThread(group)} onClose={vi.fn()} />);
  await screen.findByText('Chat host');
  await act(async () => resolve([{ memberId: 43, displayName: 'Wrong group member', isHost: false }]));
  await waitFor(() => expect(screen.queryByText('Wrong group member')).toBeNull());
});
it('requires an explicit eligible host selection before leaving an independent group', async () => {
  api.independent.mockResolvedValue([{ memberId: 42, displayName: 'Chat host', isHost: true, canReceiveHost: false },
    { memberId: 43, displayName: 'Eligible member', isHost: false, canReceiveHost: true },
    { memberId: 44, displayName: 'Unknown eligibility', isHost: false }]);
  const left = vi.fn(), close = vi.fn();
  render(<GroupDetailsDialog thread={chatGroupThread(group)} onClose={close} onLeft={left} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Rời nhóm' }));
  expect(screen.getByText('Bạn có chắc muốn rời nhóm “Trip”?')).toBeTruthy();
  expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Xác nhận rời nhóm' }).disabled).toBe(true);
  expect(screen.queryByRole('option', { name: 'Unknown eligibility' })).toBeNull();
  fireEvent.change(screen.getByLabelText('Chọn trưởng nhóm thay thế'), { target: { value: '43' } });
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận rời nhóm' }));
  await waitFor(() => expect(left).toHaveBeenCalledOnce());
  expect(api.chatLeave).toHaveBeenCalledWith(1, 43); expect(api.travelLeave).not.toHaveBeenCalled(); expect(close).toHaveBeenCalledOnce();
});
it('disables host leave and explains adding a replacement when no eligibility is confirmed', async () => {
  render(<GroupDetailsDialog thread={chatGroupThread(group)} onClose={vi.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Rời nhóm' }));
  expect(screen.getByText(/Chưa có thành viên đủ điều kiện/)).toBeTruthy();
  expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Xác nhận rời nhóm' }).disabled).toBe(true);
  expect(api.chatLeave).not.toHaveBeenCalled();
});
it.each(['Traveler', 'TourOperator', 'Administrator', 'Staff', 'ServiceProvider'])('allows an Active independent nonhost with role %s to leave without replacement', async role => {
  api.role = role;
  api.independent.mockResolvedValue([{ memberId: 42, displayName: 'Me', isHost: false }, { memberId: 43, displayName: 'Chat host', isHost: true }]);
  render(<GroupDetailsDialog thread={chatGroupThread(group)} onClose={vi.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Rời nhóm' }));
  expect(screen.queryByRole('combobox')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận rời nhóm' }));
  await waitFor(() => expect(api.chatLeave).toHaveBeenCalledWith(1, null));
});
it('keeps travel leave bodyless and does not show manual host selection', async () => {
  render(<GroupDetailsDialog thread={travel} onClose={vi.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Rời nhóm' }));
  expect(screen.queryByRole('combobox')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận rời nhóm' }));
  await waitFor(() => expect(api.travelLeave).toHaveBeenCalledWith(1));
  expect(api.chatLeave).not.toHaveBeenCalled();
});
it('blocks Escape, backdrop, closing and duplicate confirmation while saving', async () => {
  let finish!: () => void;
  api.chatLeave.mockReturnValue(new Promise<void>(resolve => { finish = resolve; }));
  api.independent.mockResolvedValue([{ memberId: 42, displayName: 'Me', isHost: false }]);
  const close = vi.fn(), left = vi.fn(); render(<GroupDetailsDialog thread={chatGroupThread(group)} onClose={close} onLeft={left} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Rời nhóm' }));
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận rời nhóm' }));
  fireEvent.keyDown(document, { key: 'Escape' }); fireEvent.pointerDown(screen.getByRole('dialog'));
  fireEvent.click(screen.getByRole('button', { name: 'Đóng thông tin nhóm' }));
  fireEvent.click(screen.getByRole('button', { name: 'Đang rời nhóm…' }));
  expect(close).not.toHaveBeenCalled(); expect(left).not.toHaveBeenCalled(); expect(api.chatLeave).toHaveBeenCalledOnce();
  await act(async () => finish()); expect(left).toHaveBeenCalledOnce();
});
it('restores the exact pending host payload after remount even if membership loading now fails', async () => {
  api.pendingChat.mockReturnValue({ replacementHostUserId: 43 }); api.pending.mockReturnValue(true);
  api.independent.mockRejectedValue(new Error('membership no longer accessible'));
  render(<GroupDetailsDialog thread={chatGroupThread(group)} onClose={vi.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Rời nhóm' }));
  expect(screen.getByRole<HTMLSelectElement>('combobox').value).toBe('43');
  fireEvent.click(screen.getByRole('button', { name: 'Xác nhận rời nhóm' }));
  await waitFor(() => expect(api.chatLeave).toHaveBeenCalledWith(1, 43));
});
