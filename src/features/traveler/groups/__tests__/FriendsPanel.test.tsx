import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { FriendsPanel } from '../components/FriendsPanel';
const api = vi.hoisted(() => ({ list: vi.fn(), change: vi.fn(), search: vi.fn() }));
vi.mock('../services/friendshipsApi', () => ({ fetchFriendships: api.list, changeFriendship: api.change }));
vi.mock('../services/directChatApi', () => ({ searchChatUsers: api.search }));
beforeEach(() => { vi.clearAllMocks(); api.list.mockResolvedValue([]); api.change.mockResolvedValue(undefined); api.search.mockResolvedValue([]); });
afterEach(cleanup);
it('only offers acceptance for an incoming request and cancels outgoing requests', async () => {
  api.list.mockResolvedValue([
    { userId: 2, displayName: 'Incoming', avatarUrl: null, status: 'Pending', requestedByUserId: 2 },
    { userId: 3, displayName: 'Outgoing', avatarUrl: null, status: 'Pending', requestedByUserId: 1 },
  ]);
  render(<FriendsPanel userId={1} onClose={vi.fn()} onOpen={vi.fn()} />);
  await screen.findByText('Chưa có bạn bè. Tìm người để kết nối cùng chuyến đi.');
  fireEvent.click(screen.getByRole('button', { name: 'Lời mời' }));
  expect(screen.getAllByRole('button', { name: 'Chấp nhận' })).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Chấp nhận' }));
  await waitFor(() => expect(api.change).toHaveBeenCalledWith(2, 'accept', expect.any(AbortSignal)));
});
it('keeps errors visible after a failed friendship mutation', async () => {
  api.list.mockResolvedValue([{ userId: 2, displayName: 'Friend', avatarUrl: null, status: 'Pending', requestedByUserId: 1 }]);
  api.change.mockRejectedValue(new Error('offline'));
  render(<FriendsPanel userId={1} onClose={vi.fn()} onOpen={vi.fn()} />);
  await screen.findByText('Chưa có bạn bè. Tìm người để kết nối cùng chuyến đi.');
  fireEvent.click(screen.getByRole('button', { name: 'Lời mời' }));
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Hủy lời mời' })));
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(screen.getByText('Đã gửi lời mời')).toBeTruthy();
});
