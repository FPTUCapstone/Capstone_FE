import { afterEach, describe, expect, it, vi } from 'vitest';

import { defaultActiveTripsSearch } from './activeTrips';
import { fetchActiveTrips } from './activeTripsService';

afterEach(() => vi.unstubAllGlobals());

describe('activeTripsService', () => {
  it('requests the same-origin proxy with fixed page size and parses the payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({
      summary: { activeTrips: 0, tripsWithOpenAlerts: 0, travelersOnTrip: 0 },
      pageNumber: 1, pageSize: 20, totalCount: 0, totalPages: 0, items: [],
    }));
    vi.stubGlobal('fetch', fetchMock);

    await fetchActiveTrips({ ...defaultActiveTripsSearch(), keyword: 'trip' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/trips/active?keyword=trip&pageSize=20',
      expect.objectContaining({ headers: { Accept: 'application/json' } }),
    );
  });

  it('retains response status in safe service errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ title: 'Denied' }, { status: 403 })));
    await expect(fetchActiveTrips(defaultActiveTripsSearch())).rejects.toMatchObject({ status: 403 });
  });

  it('uses the date message only from the typed BFF contract', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({
      errorCode: 'ActiveTrips.InvalidDateRange', title: 'The submitted Start Date range is logically invalid.',
    }, { status: 400 })));
    await expect(fetchActiveTrips(defaultActiveTripsSearch())).rejects.toMatchObject({
      status: 400, serverMessage: 'The submitted Start Date range is logically invalid.', errorCode: 'ActiveTrips.InvalidDateRange',
    });
  });

  it('does not render an arbitrary upstream 400 title', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({
      errorCode: 'unexpected', title: 'Internal implementation detail',
    }, { status: 400 })));
    await expect(fetchActiveTrips(defaultActiveTripsSearch())).rejects.toMatchObject({
      status: 400, serverMessage: undefined,
    });
  });

  it('accepts only the BFF generic filter error code', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({
      errorCode: 'ActiveTrips.InvalidFilter', title: 'One or more filters are invalid. Please review and try again.',
    }, { status: 400 })));
    await expect(fetchActiveTrips(defaultActiveTripsSearch())).rejects.toMatchObject({
      status: 400, errorCode: 'ActiveTrips.InvalidFilter',
    });
  });

  it('treats malformed success payloads as unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ items: [] })));
    await expect(fetchActiveTrips(defaultActiveTripsSearch())).rejects.toMatchObject({ status: 0 });
  });
});
