import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/auth/session/authSession', () => ({
  AuthStorage: { getAccessToken: () => 'operator-token' },
}));
vi.mock('@/lib/authApi', () => ({ getApiBase: () => 'http://api.test/api/v1' }));

import {
  createTourPackage,
  evaluateTourCompleteness,
  getOperatorTourById,
  updateTourPackage,
} from './operatorTourService';
import type { ApiTourDetail } from './operatorTourApi';
import type { CreateTourPackagePayload } from '../types/tourLifecycle';

const detail: ApiTourDetail = {
  id: 42,
  title: 'Tour Bà Nà',
  destination: 'Đà Nẵng, Quảng Nam',
  description: 'Mô tả',
  categoryId: null,
  basePrice: 1000000,
  durationDays: 1,
  status: 'Draft',
  rejectionReason: null,
  inclusions: 'Xe đưa đón',
  exclusions: null,
  destinations: [
    { destinationId: 1, name: 'Đà Nẵng' },
    { destinationId: 2, name: 'Quảng Nam' },
  ],
  cancellationPolicyTemplateId: 7,
  itineraryItems: [{ dayNo: 1, sequenceNo: 1, poiId: 11, plannedTime: '08:00:00', stayDurationMinutes: 60, notes: null }],
  departures: [
    {
      id: 5,
      startAtUtc: '2026-11-20T01:30:00+00:00',
      endAtUtc: '2026-11-20T09:30:00+00:00',
      meetingPoint: 'Khách sạn',
      minimumCapacity: 4,
      totalCapacity: 30,
      reservedCapacity: 0,
      registrationDeadlineAtUtc: '2026-11-18T00:00:00+00:00',
      adultPrice: 1200000,
      childPrice: 800000,
      infantPrice: 100000,
      status: 'Scheduled',
    },
  ],
};

const payload: CreateTourPackagePayload = {
  title: 'Tour Bà Nà',
  destination: 'Đà Nẵng',
  destinationIds: [1, 2],
  durationDays: 1,
  basePrice: 1000000,
  maxCapacity: 30,
  description: 'Mô tả',
  cancellationPolicy: '7',
  itinerary: [
    {
      dayNo: 1,
      activities: [{ id: 'a', time: '08:00', poiId: 11, poiName: 'Bà Nà', stayDurationMinutes: 60, transport: '' }],
    },
  ],
  schedules: [
    { id: 's', departureDate: '2026-11-20', returnDate: '2026-11-20', totalCapacity: 30, reservedCapacity: 0, status: 'Scheduled' },
  ],
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('operatorTourService against the UC-35 backend contract', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates with destinationIds and the policy template in ONE request, using the caller idempotency key', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ tourId: 42, status: 'Draft' }, 201))
      .mockResolvedValueOnce(jsonResponse(detail));

    const result = await createTourPackage(payload, { idempotencyKey: 'key-1' });

    expect(result.status).toBe('SUCCESS');
    expect(fetchMock).toHaveBeenCalledTimes(2); // POST + GET detail; no separate assign-policy call
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://api.test/api/v1/operator/tours');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['Idempotency-Key']).toBe('key-1');
    const body = JSON.parse(init.body as string);
    expect(body.destinationIds).toEqual([1, 2]);
    expect(body.cancellationPolicyTemplateId).toBe(7);
    expect(body).not.toHaveProperty('destination');
  });

  it('refuses to call the backend without a catalogue destination', async () => {
    await expect(createTourPackage({ ...payload, destinationIds: [] })).rejects.toThrow(/điểm đến/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('maps a Published tour as Published instead of an editable Draft', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ...detail, status: 'Published' }));

    const tour = await getOperatorTourById('42', { allowDemo: false });

    expect(tour.data?.status).toBe('Published');
  });

  it('fails loudly on an unknown status rather than showing it as a Draft', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ...detail, status: 'Archived' }));

    await expect(getOperatorTourById('42', { allowDemo: false })).rejects.toThrow(/Archived/);
  });

  it('keeps the selected policy and destinations so a loaded draft can be submitted for review', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(detail));

    const tour = (await getOperatorTourById('42', { allowDemo: false })).data!;

    expect(tour.cancellationPolicy).toBe('7');
    expect(tour.destinationIds).toEqual([1, 2]);
    expect(evaluateTourCompleteness(tour).items.find((item) => item.key === 'cancellation-policy')?.isComplete).toBe(true);
  });

  it('does not discard per-departure prices, minimum capacity or exact times on a replace-all update', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(detail));
    const loaded = (await getOperatorTourById('42', { allowDemo: false })).data!;

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ tourId: 42, status: 'Draft' }))
      .mockResolvedValueOnce(jsonResponse(detail));
    await updateTourPackage(
      { ...loaded, id: '42', itinerary: loaded.itinerary, schedules: loaded.schedules },
      { currentTour: loaded },
    );

    const putBody = JSON.parse((fetchMock.mock.calls[1] as [string, RequestInit])[1].body as string);
    expect(putBody.schedules[0]).toMatchObject({
      startAtUtc: '2026-11-20T01:30:00+00:00',
      minimumCapacity: 4,
      adultPrice: 1200000,
      childPrice: 800000,
      infantPrice: 100000,
      registrationDeadlineAtUtc: '2026-11-18T00:00:00+00:00',
    });
  });

  it('shows the first field message from a ProblemDetails validation error', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        { title: 'One or more validation errors occurred.', errors: { destinationIds: ['Between 1 and 10 unique destinations are required.'] } },
        400,
      ),
    );

    await expect(createTourPackage(payload, { idempotencyKey: 'key-2' })).rejects.toThrow(
      'Between 1 and 10 unique destinations are required.',
    );
  });
});
