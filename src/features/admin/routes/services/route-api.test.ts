import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRoute, loadRouteOptions, RouteApiError, validateRoute } from './route-api';

const input = { fromPoiId: 1, toPoiId: 2, distanceKm: 2.5, estimatedDurationMinutes: 10, transportMode: 'Walking' as const, routeNote: null };
const route = { ...input, id: 9, fromPoiName: 'Origin', toPoiName: 'Destination', status: 'Active', createdAtUtc: '2026-11-13T00:00:00Z', messageCode: 'MSG139' };
afterEach(() => vi.unstubAllGlobals());
describe('UC-54 route contract', () => {
  it.each([
    ['Routes.DuplicateSubmission', 'This route creation has already been submitted. Check Routes List before retrying.'],
    ['Routes.DuplicateRoute', 'A route with these endpoints and transport mode already exists.'],
  ])('preserves an allowlisted conflict explanation for %s', async (errorCode, message) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ errorCode, title: 'Untrusted upstream detail' }, { status: 409 })));
    await expect(createRoute(input, 'key')).rejects.toMatchObject({ status: 409, message, errorCode });
  });
  it('sends canonical fields and the operation identifier', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json(route, { status: 201 }));
    vi.stubGlobal('fetch', fetcher);
    expect((await createRoute(input, 'operation-key')).id).toBe(9);
    expect(fetcher.mock.calls[0][1].headers['Idempotency-Key']).toBe('operation-key');
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual(input);
  });
  it.each([{}, { ...route, status: 'Inactive' }, { ...route, messageCode: 'MSG129' }])('never reports malformed success as creation', async body => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(body, { status: 201 })));
    await expect(createRoute(input, 'key')).rejects.toBeInstanceOf(RouteApiError);
  });
  it('maps approved endpoint validation error and field details', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ errorCode: 'MSG141', title: 'Select two different Active points of interest.', errors: { ToPoiId: ['Select two different Active points of interest.'] } }, { status: 400 })));
    await expect(createRoute(input, 'key')).rejects.toMatchObject({ message: 'Select two different Active points of interest.', errorCode: 'MSG141' });
  });
  it('rejects arbitrary modes from the options service', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ pois: [], transportModes: ['Plane'] })));
    await expect(loadRouteOptions()).rejects.toBeInstanceOf(RouteApiError);
  });
  it('validates distinct endpoints, positivity, storage precision and optional note', () => {
    expect(validateRoute(input)).toEqual({});
    expect(validateRoute({ ...input, fromPoiId: null, toPoiId: null })).toMatchObject({ fromPoiId: 'This field is required.', toPoiId: 'This field is required.' });
    expect(validateRoute({ ...input, toPoiId: 1 })).toHaveProperty('toPoiId');
    for (const value of [0, -1, NaN, Infinity]) expect(validateRoute({ ...input, distanceKm: value })).toHaveProperty('distanceKm');
    for (const value of [0, -1, 1.2]) expect(validateRoute({ ...input, estimatedDurationMinutes: value })).toHaveProperty('estimatedDurationMinutes');
    expect(validateRoute({ ...input, distanceKm: 1.234 })).toHaveProperty('distanceKm');
    expect(validateRoute({ ...input, routeNote: 'a'.repeat(2001) })).toHaveProperty('routeNote');
  });
});
