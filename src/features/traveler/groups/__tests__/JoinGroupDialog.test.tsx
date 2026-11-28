import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { JoinGroupDialog } from '../components/JoinGroupDialog';
const api = vi.hoisted(() => ({ join: vi.fn() }));
vi.mock('../services/travelGroupApi', async original => ({ ...(await original<object>()), joinTravelGroup: api.join }));
const joined = { groupId: 1, groupName: 'Real trip', itineraryId: 2 };
beforeEach(() => vi.resetAllMocks());
afterEach(cleanup);
it('validates invitation codes before calling the existing join API', async () => {
  render(<JoinGroupDialog onClose={vi.fn()} onJoined={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('Mã mời'), { target: { value: 'invalid!' } });
  fireEvent.click(screen.getByRole('button', { name: 'Tham gia nhóm' }));
  expect(await screen.findByRole('alert')).toBeTruthy(); expect(api.join).not.toHaveBeenCalled();
});
it('reuses the idempotency key on failure and passes the server group to the async integration callback', async () => {
  api.join.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(joined);
  const onJoined = vi.fn().mockResolvedValue(undefined); const close = vi.fn();
  render(<JoinGroupDialog onClose={close} onJoined={onJoined} />);
  fireEvent.change(screen.getByLabelText('Mã mời'), { target: { value: 'AB12CD34' } });
  fireEvent.click(screen.getByRole('button', { name: 'Tham gia nhóm' }));
  await screen.findByRole('alert'); expect(onJoined).not.toHaveBeenCalled(); expect(close).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Tham gia nhóm' }));
  await waitFor(() => expect(close).toHaveBeenCalledOnce());
  expect(api.join.mock.calls[0][0]).toBe('AB12CD34');
  expect(api.join.mock.calls[0][1].idempotencyKey).toMatch(/^[\da-f-]{36}$/i);
  expect(api.join.mock.calls[1][1].idempotencyKey).toBe(api.join.mock.calls[0][1].idempotencyKey);
  expect(onJoined).toHaveBeenCalledWith(joined, expect.any(AbortSignal));
});
it('waits for the parent refresh and prevents duplicate submissions', async () => {
  api.join.mockResolvedValue(joined);
  let resolve!: () => void; const close = vi.fn(); const onJoined = vi.fn(() => new Promise<void>(yes => { resolve = yes; }));
  render(<JoinGroupDialog onClose={close} onJoined={onJoined} />);
  fireEvent.change(screen.getByLabelText('Mã mời'), { target: { value: 'AB12CD34' } });
  fireEvent.click(screen.getByRole('button', { name: 'Tham gia nhóm' }));
  await waitFor(() => expect(onJoined).toHaveBeenCalledWith(joined, expect.any(AbortSignal)));
  expect(close).not.toHaveBeenCalled(); expect((screen.getByRole('button', { name: 'Đang tham gia…' }) as HTMLButtonElement).disabled).toBe(true);
  await act(async () => resolve()); expect(close).toHaveBeenCalledOnce(); expect(api.join).toHaveBeenCalledOnce();
});
it('retries only opening the confirmed group when the parent refresh fails', async () => {
  api.join.mockResolvedValue(joined); const onJoined = vi.fn().mockRejectedValueOnce(new Error('refresh failed')).mockResolvedValueOnce(undefined);
  const close = vi.fn(); render(<JoinGroupDialog onClose={close} onJoined={onJoined} />);
  fireEvent.change(screen.getByLabelText('Mã mời'), { target: { value: 'AB12CD34' } });
  fireEvent.click(screen.getByRole('button', { name: 'Tham gia nhóm' }));
  await screen.findByRole('alert'); expect(close).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Mở nhóm đã tham gia' }));
  await waitFor(() => expect(close).toHaveBeenCalledOnce()); expect(api.join).toHaveBeenCalledOnce(); expect(onJoined).toHaveBeenCalledTimes(2);
});
it('does not invoke parent callbacks after the dialog is unmounted', async () => {
  let resolve!: (value: typeof joined) => void; api.join.mockReturnValueOnce(new Promise(yes => { resolve = yes; }));
  const onJoined = vi.fn(); const close = vi.fn(); const { unmount } = render(<JoinGroupDialog onClose={close} onJoined={onJoined} />);
  fireEvent.change(screen.getByLabelText('Mã mời'), { target: { value: 'AB12CD34' } });
  fireEvent.click(screen.getByRole('button', { name: 'Tham gia nhóm' })); unmount();
  await act(async () => resolve(joined)); expect(onJoined).not.toHaveBeenCalled(); expect(close).not.toHaveBeenCalled();
});
it('aborts the parent refresh callback on close and normalizes code case for retries', async () => {
  api.join.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(joined);
  let signal!: AbortSignal;
  const onJoined = vi.fn((_group: typeof joined, pendingSignal?: AbortSignal) => { signal = pendingSignal!; return new Promise<void>(() => undefined); });
  const { unmount } = render(<JoinGroupDialog onClose={vi.fn()} onJoined={onJoined} />);
  fireEvent.change(screen.getByLabelText('Mã mời'), { target: { value: 'ab12cd34' } });
  fireEvent.click(screen.getByRole('button', { name: 'Tham gia nhóm' })); await screen.findByRole('alert');
  fireEvent.change(screen.getByLabelText('Mã mời'), { target: { value: 'AB12CD34' } });
  fireEvent.click(screen.getByRole('button', { name: 'Tham gia nhóm' }));
  await waitFor(() => expect(onJoined).toHaveBeenCalledOnce());
  expect(api.join.mock.calls[0][0]).toBe('AB12CD34');
  expect(api.join.mock.calls[0][1].idempotencyKey).toBe(api.join.mock.calls[1][1].idempotencyKey);
  expect(signal.aborted).toBe(false); unmount(); expect(signal.aborted).toBe(true);
});
