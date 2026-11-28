import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { GroupLocationDialog } from '../components/GroupLocationDialog';
import type { Thread } from '../components/useMessenger';

const api = vi.hoisted(() => ({
  setting: vi.fn(), locations: vi.fn(), members: vi.fn(), enable: vi.fn(), publish: vi.fn(), clear: vi.fn(), locate: vi.fn(),
  owner: { userId: 42, role: 'Traveler' }, listener: null as (() => void) | null,
}));
vi.mock('@/features/auth/session/authSession', () => ({ AuthStorage: {
  getContext: () => api.owner,
  subscribe: (listener: () => void) => { api.listener = listener; return () => { api.listener = null; }; },
} }));
vi.mock('../services/travelGroupApi', () => ({ fetchChatMembers: api.members }));
vi.mock('../services/groupLocationApi', () => ({
  fetchGroupLocationSharing: api.setting, fetchGroupLocations: api.locations, setGroupLocationSharing: api.enable,
  publishGroupLocation: api.publish, clearGroupLocation: api.clear,
}));
const thread: Thread = {
  key: 'group:7', id: 7, kind: 'group', title: 'Chuyến đi', preview: null, updatedAt: null, unread: 0,
  group: { groupId: 7, groupName: 'Chuyến đi', itineraryId: 8, itineraryTitle: 'Huế', itinerarySourceType: 'Manual',
    hostUserId: 42, memberCount: 2, status: 'Active', lastMessage: null, lastMessageAtUtc: null },
};
const sessionVersion = '639051912000000001';
function fix(timestamp = Date.now()): GeolocationPosition {
  return { timestamp, coords: { latitude: 16.047079, longitude: 108.20623, accuracy: 10, altitude: null, altitudeAccuracy: null, heading: null, speed: null }, toJSON: () => ({}) } as GeolocationPosition;
}
async function flush() { await act(async () => { await Promise.resolve(); }); }
async function open() { const result = render(<GroupLocationDialog thread={thread} onClose={vi.fn()} />); await flush(); return result; }
async function start() {
  fireEvent.click(screen.getByRole('checkbox'));
  fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu chia sẻ vị trí' }));
  await flush();
}
beforeEach(() => {
  vi.resetAllMocks(); api.owner = { userId: 42, role: 'Traveler' }; api.listener = null;
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
  vi.stubGlobal('isSecureContext', true);
  vi.stubGlobal('navigator', Object.create(navigator, { geolocation: { value: { getCurrentPosition: api.locate } } }));
  api.setting.mockResolvedValue({ groupId: 7, enabled: false, updatedAtUtc: null, sessionVersion: null });
  api.members.mockResolvedValue([{ memberId: 42, displayName: 'Lan', isHost: true }]);
  api.locations.mockResolvedValue({ groupId: 7, locations: [] });
  api.enable.mockImplementation(async (_id, enabled) => ({ groupId: 7, enabled, updatedAtUtc: new Date().toISOString(), sessionVersion: enabled ? sessionVersion : null }));
  api.publish.mockResolvedValue({ userId: 42, latitude: 16.047079, longitude: 108.20623, recordedAtUtc: new Date().toISOString() });
  api.clear.mockResolvedValue(undefined);
  api.locate.mockImplementation(success => success(fix()));
});
afterEach(async () => { cleanup(); await flush(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('is view-only on open even if sharing is enabled on the server; consent and a click are required', async () => {
  api.setting.mockResolvedValue({ groupId: 7, enabled: true, updatedAtUtc: new Date().toISOString(), sessionVersion });
  await open();
  expect(screen.getByRole('button', { name: 'Bắt đầu chia sẻ vị trí' }).hasAttribute('disabled')).toBe(true);
  expect(api.locate).not.toHaveBeenCalled(); expect(api.enable).not.toHaveBeenCalled();
  expect(screen.getByText(/Các thành viên Traveler đang hoạt động/)).toBeTruthy();
  cleanup(); await flush(); expect(api.clear).not.toHaveBeenCalled();
});
it('shows named active members and exact coordinates, omitting old, future and unknown-member fixes', async () => {
  const row = { userId: 42, latitude: 16.047079, longitude: 108.20623, recordedAtUtc: new Date().toISOString() };
  api.locations.mockResolvedValue({ groupId: 7, locations: [row, { ...row, userId: 999 },
    { ...row, userId: 43, recordedAtUtc: new Date(Date.now() - 121_000).toISOString() },
    { ...row, userId: 44, recordedAtUtc: new Date(Date.now() + 60_000).toISOString() }] });
  api.members.mockResolvedValue([{ memberId: 42, displayName: 'Lan', isHost: true },
    { memberId: 43, displayName: 'Old', isHost: false }, { memberId: 44, displayName: 'Future', isHost: false }]);
  await open(); expect(screen.getByText('Lan')).toBeTruthy(); expect(screen.getAllByRole('listitem')).toHaveLength(1);
  expect(screen.getByText('Vĩ độ: 16.047079 · Kinh độ: 108.206230')).toBeTruthy();
});
it('requests fresh fixes every 15 seconds using the same server-issued session', async () => {
  vi.useFakeTimers(); await open(); await start();
  expect(api.locate).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), { enableHighAccuracy: true, maximumAge: 0, timeout: 10_000 });
  await act(async () => { await vi.advanceTimersByTimeAsync(15_000); });
  expect(api.enable.mock.calls.filter(call => call[1] === true)).toHaveLength(1);
  expect(api.publish).toHaveBeenCalledTimes(2);
  for (const call of api.publish.mock.calls) expect(call).toEqual([7, { latitude: 16.047079, longitude: 108.20623, sessionVersion }]);
});
it('stops, disables and clears on hide and requires consent again on return', async () => {
  vi.useFakeTimers(); await open(); await start();
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
  fireEvent(document, new Event('visibilitychange')); await flush();
  expect(api.enable).toHaveBeenCalledWith(7, false); expect(api.clear).toHaveBeenCalledWith(7);
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
  fireEvent(document, new Event('visibilitychange'));
  await act(async () => { await vi.advanceTimersByTimeAsync(30_000); });
  expect(api.publish).toHaveBeenCalledTimes(1); expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false);
});
it('clears after an in-flight publish finishes on unmount', async () => {
  let finish!: () => void;
  api.publish.mockReturnValueOnce(new Promise<void>(resolve => { finish = resolve; }));
  const result = await open(); await start(); result.unmount(); await flush();
  expect(api.clear).not.toHaveBeenCalled();
  await act(async () => { finish(); });
  expect(api.clear).toHaveBeenCalledWith(7); expect(api.enable).toHaveBeenLastCalledWith(7, false);
});
it('never publishes a late GPS callback after the page hides', async () => {
  let success!: PositionCallback;
  api.locate.mockImplementationOnce(callback => { success = callback; });
  await open(); await start();
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden'); fireEvent(document, new Event('visibilitychange'));
  await act(async () => { success(fix()); });
  expect(api.publish).not.toHaveBeenCalled(); expect(api.enable).not.toHaveBeenCalled();
});
it('clears a late enable response without publishing after hide', async () => {
  let finish!: (value: unknown) => void;
  api.enable.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  await open(); await start();
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden'); fireEvent(document, new Event('visibilitychange'));
  await act(async () => { finish({ groupId: 7, enabled: true, updatedAtUtc: new Date().toISOString(), sessionVersion }); });
  expect(api.publish).not.toHaveBeenCalled(); expect(api.clear).toHaveBeenCalledWith(7);
});
it('rejects cached coordinates before enabling sharing', async () => {
  api.locate.mockImplementationOnce(success => success(fix(Date.now() - 16_000)));
  await open(); await start(); expect(screen.getByRole('alert').textContent).toContain('Vị trí đã cũ');
  expect(api.enable).not.toHaveBeenCalled(); expect(api.publish).not.toHaveBeenCalled();
});
it('explains browser permission denial without enabling a server session', async () => {
  api.locate.mockImplementationOnce((_success, failure) => failure({ code: 1 }));
  await open(); await start(); expect(screen.getByRole('alert').textContent).toContain('chưa cho phép');
  expect(api.enable).not.toHaveBeenCalled();
});
it.each([2, 3])('explains GPS failure code %s and leaves sharing off', async code => {
  api.locate.mockImplementationOnce((_success, failure) => failure({ code }));
  await open(); await start(); expect(screen.getByRole('alert')).toBeTruthy();
  expect(api.enable).not.toHaveBeenCalled(); expect(api.publish).not.toHaveBeenCalled();
});
it('requires a secure browser context before requesting GPS', async () => {
  vi.stubGlobal('isSecureContext', false); await open(); await start();
  expect(screen.getByRole('alert').textContent).toContain('HTTPS');
  expect(api.locate).not.toHaveBeenCalled(); expect(api.enable).not.toHaveBeenCalled();
});
it('does not publish a GPS fix that expires while the enable request is pending', async () => {
  vi.useFakeTimers(); let finish!: (value: unknown) => void;
  api.enable.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
  await open(); await start();
  await act(async () => { await vi.advanceTimersByTimeAsync(16_000); });
  await act(async () => { finish({ groupId: 7, enabled: true, updatedAtUtc: new Date().toISOString(), sessionVersion }); });
  expect(api.publish).not.toHaveBeenCalled(); expect(api.clear).toHaveBeenCalledWith(7);
  expect(screen.getByRole('alert').textContent).toContain('Vị trí đã cũ');
});
it('removes a member fix once it expires even before the next successful server refresh', async () => {
  vi.useFakeTimers();
  api.locations.mockResolvedValueOnce({ groupId: 7, locations: [{ userId: 42, latitude: 1, longitude: 2, recordedAtUtc: new Date(Date.now() - 119_000).toISOString() }] });
  await open(); expect(screen.getByText('Lan')).toBeTruthy();
  await act(async () => { await vi.advanceTimersByTimeAsync(2000); });
  expect(screen.queryByText('Lan')).toBeNull();
});
it('offers a retry when server cleanup cannot be confirmed', async () => {
  await open(); await start(); api.clear.mockRejectedValueOnce(new Error('offline'));
  fireEvent.click(screen.getByRole('button', { name: 'Dừng và xóa vị trí' })); await flush();
  expect(screen.getByRole('alert').textContent).toContain('chưa xác nhận xóa');
  fireEvent.click(screen.getByRole('button', { name: 'Dừng và xóa lại trên máy chủ' })); await flush();
  expect(api.clear).toHaveBeenCalledTimes(2); expect(screen.queryByRole('alert')).toBeNull();
});
it('stops on a server session conflict instead of silently enabling a new session', async () => {
  api.publish.mockRejectedValueOnce(new Error('Phiên chia sẻ đã hết hạn.'));
  await open(); await start(); expect(api.enable.mock.calls.filter(call => call[1] === true)).toHaveLength(1);
  expect(api.clear).toHaveBeenCalledWith(7); expect(screen.getByRole('alert').textContent).toContain('hết hạn');
});
it('discards coordinates on read failure and allows a manual refresh', async () => {
  api.locations.mockRejectedValueOnce(new Error('offline')); await open();
  expect(screen.getByRole('alert').textContent).toContain('offline');
  fireEvent.click(screen.getByRole('button', { name: 'Làm mới' })); await flush();
  expect(screen.queryByRole('alert')).toBeNull(); expect(screen.getByText('Chưa có vị trí mới được chia sẻ.')).toBeTruthy();
});
it.each(['TourOperator', 'Administrator', 'Staff'])('does not call travel GPS APIs for role %s', async role => {
  api.owner.role = role; await open(); expect(screen.getByRole('alert')).toBeTruthy();
  expect(api.setting).not.toHaveBeenCalled(); expect(api.locations).not.toHaveBeenCalled(); expect(api.locate).not.toHaveBeenCalled();
});
it.each(['independent', 'direct', 'closed', 'missing-itinerary'] as const)('rejects an ineligible %s conversation without API calls', async mode => {
  const invalid: Thread = { ...thread, ...(mode === 'independent' ? { chatGroup: true } : mode === 'direct' ? { kind: 'direct' as const }
    : { group: { ...thread.group!, ...(mode === 'closed' ? { status: 'Closed' as const } : { itineraryId: 0 }) } }) };
  render(<GroupLocationDialog thread={invalid} onClose={vi.fn()} />); await flush();
  expect(screen.getByRole('alert')).toBeTruthy(); expect(api.setting).not.toHaveBeenCalled(); expect(api.locations).not.toHaveBeenCalled();
});
it('discards the previous group and resets consent when the parent changes the thread', async () => {
  const result = await open(); await start();
  result.rerender(<GroupLocationDialog thread={{ ...thread, key: 'group:9', id: 9, group: { ...thread.group!, groupId: 9 } }} onClose={vi.fn()} />);
  await flush(); expect(api.clear).toHaveBeenCalledWith(7); expect(api.publish).toHaveBeenCalledTimes(1);
  expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false);
});
it('does not clear or publish another account’s location after an identity change', async () => {
  await open(); await start();
  await act(async () => { api.owner = { userId: 99, role: 'Traveler' }; api.listener?.(); });
  expect(api.clear).not.toHaveBeenCalled(); expect(api.publish).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('alert').textContent).toContain('Tài khoản đã thay đổi');
});
it('uses the shared Escape handler and keeps the dialog at the 384px design width', async () => {
  const close = vi.fn(); render(<GroupLocationDialog thread={thread} onClose={close} />); await flush();
  expect(screen.getByRole('dialog').firstElementChild?.className).toContain('max-w-sm');
  fireEvent.keyDown(document, { key: 'Escape' }); expect(close).toHaveBeenCalledOnce();
});
