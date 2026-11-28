import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { FriendsPanel } from '../components/FriendsPanel';
const api = vi.hoisted(() => ({ list: vi.fn(), change: vi.fn(), search: vi.fn() }));
vi.mock('../services/friendshipsApi', () => ({ fetchFriendships: api.list, changeFriendship: api.change }));
vi.mock('../services/directChatApi', () => ({ searchChatUsers: api.search }));
beforeEach(() => { vi.resetAllMocks(); api.list.mockResolvedValue([]); api.search.mockResolvedValue([]); });
afterEach(() => { cleanup(); vi.useRealTimers(); });
it('clears a failed list refresh when retry succeeds', async () => {
  api.list.mockRejectedValueOnce(new Error('offline'));
  render(<FriendsPanel userId={1} onClose={vi.fn()} onOpen={vi.fn()} />);
  await screen.findByRole('alert');
  fireEvent.click(screen.getByRole('button', { name: 'Thử lại' }));
  await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  expect(await screen.findByText('Chưa có bạn bè. Tìm người để kết nối cùng chuyến đi.')).toBeTruthy();
});
it('refreshes the current user search along with friendship state', async () => {
  render(<FriendsPanel userId={1} onClose={vi.fn()} onOpen={vi.fn()} />);
  await screen.findByText('Chưa có bạn bè. Tìm người để kết nối cùng chuyến đi.');
  fireEvent.click(screen.getByRole('button', { name: 'Tìm người' }));
  vi.useFakeTimers();
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Friend' } });
  await act(async () => { await vi.advanceTimersByTimeAsync(300); });
  expect(api.search).toHaveBeenCalledTimes(1);
  api.search.mockResolvedValueOnce([{ userId: 2, displayName: 'Friend', avatarUrl: null }]);
  fireEvent.click(screen.getByRole('button', { name: 'Tải lại bạn bè' }));
  await act(async () => { await vi.advanceTimersByTimeAsync(300); });
  expect(api.search).toHaveBeenCalledTimes(2); expect(screen.getByText('Friend')).toBeTruthy();
});
it('does not offer friendship mutations from a stale list after refresh fails', async () => {
  api.list.mockResolvedValueOnce([{ userId: 2, displayName: 'Friend', avatarUrl: null, status: 'Pending', requestedByUserId: 2 }]).mockRejectedValueOnce(new Error('offline'));
  render(<FriendsPanel userId={1} onClose={vi.fn()} onOpen={vi.fn()} />);
  await screen.findByText('Chưa có bạn bè. Tìm người để kết nối cùng chuyến đi.');
  fireEvent.click(screen.getByRole('button', { name: 'Lời mời' }));
  fireEvent.click(screen.getByRole('button', { name: 'Tải lại bạn bè' }));
  await screen.findByRole('alert');
  expect((screen.getByRole('button', { name: 'Chấp nhận' }) as HTMLButtonElement).disabled).toBe(true);
  expect(api.change).not.toHaveBeenCalled();
});
