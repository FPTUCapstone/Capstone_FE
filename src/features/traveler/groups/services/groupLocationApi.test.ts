import { afterEach, beforeEach, expect, it, vi } from 'vitest';
vi.mock('@/features/auth/session/authSession', () => ({
  AuthStorage: { getContext: () => ({ userId: 42, role: 'Traveler', accessToken: 'test-access' }) },
}));
import { clearGroupLocation, fetchGroupLocations, fetchGroupLocationSharing, publishGroupLocation, setGroupLocationSharing } from './groupLocationApi';

const setting = { groupId: 7, enabled: true, updatedAtUtc: '2026-11-28T10:00:00Z', sessionVersion: '639051912000000001' };
const location = { userId: 42, latitude: 16.047079, longitude: 108.20623, recordedAtUtc: '2026-11-28T10:00:00Z' };
const request = vi.fn();
beforeEach(() => { request.mockReset(); vi.stubGlobal('fetch', request); });
afterEach(() => vi.unstubAllGlobals());
function respond(value: unknown, status = 200) { request.mockResolvedValueOnce(new Response(status === 204 ? null : JSON.stringify(value), { status })); }

it('reads the sharing contract without converting the opaque session to a number', async () => {
  respond(setting);
  expect(await fetchGroupLocationSharing(7)).toEqual(setting);
  expect(request).toHaveBeenCalledWith(expect.stringContaining('/travel-groups/7/location-sharing'), expect.objectContaining({
    method: 'GET', headers: expect.objectContaining({ Authorization: 'Bearer test-access' }), credentials: 'include',
  }));
});
it('accepts nullable timestamps/session for a disabled setting', async () => {
  const disabled = { groupId: 7, enabled: false, updatedAtUtc: null, sessionVersion: null };
  respond(disabled); expect(await fetchGroupLocationSharing(7)).toEqual(disabled);
});
it('writes only the group-specific enabled setting', async () => {
  respond(setting); await setGroupLocationSharing(7, true);
  expect(request).toHaveBeenCalledWith(expect.stringContaining('/7/location-sharing'), expect.objectContaining({ method: 'PUT', body: JSON.stringify({ enabled: true }) }));
});
it('publishes exact coordinates with the unchanged server session', async () => {
  respond(location);
  const payload = { latitude: location.latitude, longitude: location.longitude, sessionVersion: setting.sessionVersion };
  expect(await publishGroupLocation(7, payload)).toEqual(location);
  expect(request).toHaveBeenCalledWith(expect.stringContaining('/7/location'), expect.objectContaining({ method: 'PUT', body: JSON.stringify(payload) }));
});
it('uses authenticated DELETE and accepts its empty 204 response', async () => {
  respond(null, 204); await clearGroupLocation(7);
  expect(request).toHaveBeenCalledWith(expect.stringContaining('/travel-groups/7/location'), expect.objectContaining({
    method: 'DELETE', headers: expect.objectContaining({ Authorization: 'Bearer test-access' }),
  }));
  expect(request.mock.calls[0][1].body).toBeUndefined();
});
it('loads the locations envelope and forwards cancellation', async () => {
  respond({ groupId: 7, locations: [location] }); const abort = new AbortController();
  expect(await fetchGroupLocations(7, abort.signal)).toEqual({ groupId: 7, locations: [location] });
  expect(request).toHaveBeenCalledWith(expect.stringContaining('/7/locations'), expect.objectContaining({ signal: expect.any(AbortSignal) }));
  const forwarded = request.mock.calls[0][1].signal as AbortSignal;
  expect(forwarded.aborted).toBe(false); abort.abort(); expect(forwarded.aborted).toBe(true);
});
it.each([
  { ...setting, groupId: 8 }, { ...setting, sessionVersion: null }, { ...setting, updatedAtUtc: 'invalid' },
  { ...setting, enabled: false },
])('rejects inconsistent sharing responses: %j', async value => {
  respond(value); await expect(fetchGroupLocationSharing(7)).rejects.toMatchObject({ status: 502 });
});
it.each([
  { groupId: 8, locations: [location] }, { groupId: 7, locations: [location, location] },
  { groupId: 7, locations: [{ ...location, latitude: 91 }] },
  { groupId: 7, locations: [{ ...location, recordedAtUtc: 'invalid' }] },
])('rejects wrong-group, duplicate and malformed coordinates: %j', async value => {
  respond(value); await expect(fetchGroupLocations(7)).rejects.toMatchObject({ status: 502 });
});
it('rejects invalid input before sending any request', async () => {
  await expect(fetchGroupLocations(0)).rejects.toMatchObject({ status: 400 });
  await expect(publishGroupLocation(7, { latitude: Number.NaN, longitude: 1, sessionVersion: '123' })).rejects.toMatchObject({ status: 400 });
  await expect(publishGroupLocation(7, { latitude: 1, longitude: 181, sessionVersion: '123' })).rejects.toMatchObject({ status: 400 });
  await expect(publishGroupLocation(7, { latitude: 1, longitude: 1, sessionVersion: '' })).rejects.toMatchObject({ status: 400 });
  expect(request).not.toHaveBeenCalled();
});
it.each([403, 409, 503])('preserves server refusal %s instead of inventing a successful location', async status => {
  respond({}, status);
  await expect(publishGroupLocation(7, { latitude: 1, longitude: 1, sessionVersion: '123' })).rejects.toMatchObject({ status });
});
