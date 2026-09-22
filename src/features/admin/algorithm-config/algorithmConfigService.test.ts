import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthStorage } from '@/features/auth/session/authSession';
import { getAlgorithmParameters, updateAlgorithmParameters } from './algorithmConfigService';
import { validateParameters } from './algorithmConfig';
const values = { bufferTimeMinutes: 15, defaultTravelSpeedKmh: 30, reroutingSearchRadiusKm: 5, weatherAlertThresholdSeverity: 'Severe' as const };
const dto = { ...values, updatedAtUtc: '2026-09-21T02:00:00Z', updatedAtLocal: '21/09/2026 09:00:00' };
vi.mock('@/features/auth/session/authSession', () => ({ AuthStorage: { getAccessToken: vi.fn(() => 'memory-token'), clear: vi.fn() } }));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });
describe('algorithm configuration contract', () => {
 it('reads bare DTO using memory bearer token', async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json(dto)); vi.stubGlobal('fetch', fetch);
  expect(await getAlgorithmParameters()).toEqual(dto);
  expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer memory-token');
 });
 it('sends only four editable keys', async () => {
  const fetch = vi.fn().mockResolvedValue(Response.json(dto)); vi.stubGlobal('fetch', fetch);
  await updateAlgorithmParameters(dto);
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual(values);
 });
 it.each([400, 422, 403, 500])('preserves status and root errorCode for %i', async status => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ title: 'private database exception', errorCode: 'admin.algorithm_config_invalid_value' }, { status })));
  await expect(getAlgorithmParameters()).rejects.toMatchObject({ status, errorCode: 'admin.algorithm_config_invalid_value' });
 });
 it('clears expired session on 401', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, {status:401})));
  await expect(getAlgorithmParameters()).rejects.toMatchObject({status:401}); expect(AuthStorage.clear).toHaveBeenCalled();
 });
 it('rejects malformed successful payloads', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({message:'ok'})));
  await expect(updateAlgorithmParameters(values)).rejects.toThrow();
 });
 it('accepts the BE UTC+7 display timestamp contract', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(dto)));
  await expect(getAlgorithmParameters()).resolves.toEqual(dto);
 });
 it.each([5,60])('accepts buffer boundary %i', value => expect(validateParameters({...values,bufferTimeMinutes:value})).toEqual({}));
 it.each([4,61,5.5,NaN])('rejects invalid buffer %s', value => expect(validateParameters({...values,bufferTimeMinutes:value})).toHaveProperty('bufferTimeMinutes'));
 it.each([10,120])('accepts speed boundary %i', value => expect(validateParameters({...values,defaultTravelSpeedKmh:value})).toEqual({}));
 it.each([1,50])('accepts radius boundary %i', value => expect(validateParameters({...values,reroutingSearchRadiusKm:value})).toEqual({}));
 it('rejects invalid speed, radius and severity', () => expect(Object.keys(validateParameters({...values,defaultTravelSpeedKmh:Infinity,reroutingSearchRadiusKm:0,weatherAlertThresholdSeverity:'Unknown'}))).toHaveLength(3));
});
