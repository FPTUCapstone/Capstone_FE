import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/auth/session/authSession', () => ({
  AuthStorage: { getAccessToken: () => 'operator-token' },
}));
vi.mock('@/lib/authApi', () => ({ getApiBase: () => 'http://api.test/api/v1' }));

import {
  createTourPackage,
  evaluateTourCompleteness,
  getOperatorTourById,
  getOperatorTours,
  removeTourImage,
  setPrimaryTourImage,
  updateTourPackage,
  uploadTourImage,
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
  timeZoneId: 'Asia/Ho_Chi_Minh',
  highlights: 'Cable car',
  travellerRequirements: null,
  mediaCount: 0,
  hasPrimaryImage: false,
  canSubmitForReview: false,
  reviewBlockers: ['primary_image_missing'],
  warnings: [{ code: 'duplicate_poi', dayNo: 1, sequenceNo: 2, poiId: 11 }],
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

const media = [
  { tourMediaId: 9, tourId: 42, deliveryUrl: 'https://cdn.test/b.jpg', caption: null, altText: 'b', sortOrder: 2, isPrimary: false },
  { tourMediaId: 8, tourId: 42, deliveryUrl: 'https://cdn.test/a.jpg', caption: null, altText: 'a', sortOrder: 1, isPrimary: true },
];

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
      .mockResolvedValueOnce(jsonResponse(detail))
      .mockResolvedValueOnce(jsonResponse([]));

    const result = await createTourPackage(payload, { idempotencyKey: 'key-1' });

    expect(result.status).toBe('SUCCESS');
    expect(fetchMock).toHaveBeenCalledTimes(3); // POST + GET detail + media; no separate assign-policy call
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
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ ...detail, status: 'Published' }))
      .mockResolvedValueOnce(jsonResponse([]));

    const tour = await getOperatorTourById('42', { allowDemo: false });

    expect(tour.data?.status).toBe('Published');
  });

  it('fails loudly on an unknown status rather than showing it as a Draft', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ ...detail, status: 'Archived' }))
      .mockResolvedValueOnce(jsonResponse([]));

    await expect(getOperatorTourById('42', { allowDemo: false })).rejects.toThrow(/Archived/);
  });

  it('keeps the selected policy and destinations so a loaded draft can be submitted for review', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(detail)).mockResolvedValueOnce(jsonResponse([]));

    const tour = (await getOperatorTourById('42', { allowDemo: false })).data!;

    expect(tour.cancellationPolicy).toBe('7');
    expect(tour.destinationIds).toEqual([1, 2]);
    expect(evaluateTourCompleteness(tour).items.find((item) => item.key === 'cancellation-policy')?.isComplete).toBe(true);
  });

  it('does not discard per-departure prices, minimum capacity or exact times on a replace-all update', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(detail)).mockResolvedValueOnce(jsonResponse([]));
    const loaded = (await getOperatorTourById('42', { allowDemo: false })).data!;

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ tourId: 42, status: 'Draft' }))
      .mockResolvedValueOnce(jsonResponse(detail))
      .mockResolvedValueOnce(jsonResponse([]));
    await updateTourPackage(
      { ...loaded, id: '42', itinerary: loaded.itinerary, schedules: loaded.schedules },
      { currentTour: loaded },
    );

    const putBody = JSON.parse((fetchMock.mock.calls[2] as [string, RequestInit])[1].body as string);
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

  it('maps server readiness, warnings, terms and ordered media into the tour', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(detail)).mockResolvedValueOnce(jsonResponse(media));

    const tour = (await getOperatorTourById('42', { allowDemo: false })).data!;

    expect(tour.reviewBlockers).toEqual(['primary_image_missing']);
    expect(tour.canSubmitForReview).toBe(false);
    expect(tour.warnings).toEqual([{ code: 'duplicate_poi', dayNo: 1, sequenceNo: 2, poiId: 11 }]);
    expect(tour.highlights).toBe('Cable car');
    expect(tour.timeZoneId).toBe('Asia/Ho_Chi_Minh');
    expect(tour.media.map((item) => item.id)).toEqual(['8', '9']);
    expect(tour.media[0]).toMatchObject({ url: 'https://cdn.test/a.jpg', isPrimary: true });
  });

  it('keeps the cover photo mandatory in the checklist until the server reports no blocker', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(detail)).mockResolvedValueOnce(jsonResponse([]));
    const withoutPhoto = (await getOperatorTourById('42', { allowDemo: false })).data!;
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ ...detail, reviewBlockers: [], canSubmitForReview: true }))
      .mockResolvedValueOnce(jsonResponse(media));
    const withPhoto = (await getOperatorTourById('42', { allowDemo: false })).data!;

    const missing = evaluateTourCompleteness(withoutPhoto);
    expect(missing.isEligibleForSubmission).toBe(false);
    expect(missing.items.find((item) => item.key === 'photos')).toMatchObject({ isMandatory: true, isComplete: false });
    expect(evaluateTourCompleteness(withPhoto).isEligibleForSubmission).toBe(true);
  });

  it('sends edited departure terms and lets the operator clear optional prices', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(detail)).mockResolvedValueOnce(jsonResponse([]));
    const loaded = (await getOperatorTourById('42', { allowDemo: false })).data!;
    const schedules = loaded.schedules.map((schedule) => ({
      ...schedule,
      minimumCapacity: 6,
      childPrice: null,
      adultPrice: 1300000,
      registrationDeadlineDate: '2026-11-10',
    }));
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ tourId: 42, status: 'Draft' }))
      .mockResolvedValueOnce(jsonResponse(detail))
      .mockResolvedValueOnce(jsonResponse([]));

    await updateTourPackage({ ...loaded, id: '42', schedules }, { currentTour: loaded });

    const body = JSON.parse((fetchMock.mock.calls[2] as [string, RequestInit])[1].body as string);
    expect(body.schedules[0]).toMatchObject({
      minimumCapacity: 6,
      childPrice: null,
      adultPrice: 1300000,
      infantPrice: 100000,
      registrationDeadlineAtUtc: '2026-11-10T00:00:00.000Z',
    });
    expect(body.highlights).toBe('Cable car');
    expect(body.timeZoneId).toBe('Asia/Ho_Chi_Minh');
  });

  it('reads every page of the operator list', async () => {
    const row = (id: number) => ({
      id, title: `Tour ${id}`, status: 'Draft', basePrice: 1, durationDays: 1,
      updatedAtUtc: '2026-10-01T00:00:00Z', nextDepartureAtUtc: null, destination: 'Đà Nẵng',
    });
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ items: [row(1), row(2)], page: 1, pageSize: 100, totalCount: 3 }))
      .mockResolvedValueOnce(jsonResponse({ items: [row(3)], page: 2, pageSize: 100, totalCount: 3 }));

    const result = await getOperatorTours({ allowDemo: false });

    expect(result.data?.map((tour) => tour.id)).toEqual(['1', '2', '3']);
    expect(result.data?.[0].destination).toBe('Đà Nẵng');
    expect((fetchMock.mock.calls[1] as [string])[0]).toContain('page=2');
  });

  it('uploads an image as multipart with an idempotency key and without a JSON content type', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(media[1], 201))
      .mockResolvedValueOnce(jsonResponse([media[1]]));
    const file = new File(['x'], 'cover.jpg', { type: 'image/jpeg' });

    const result = await uploadTourImage('42', file, 'Cover', { makePrimary: true, idempotencyKey: 'up-1' });

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://api.test/api/v1/operator/tours/42/media');
    const headers = init.headers as Record<string, string>;
    expect(headers['Idempotency-Key']).toBe('up-1');
    expect(headers['Content-Type']).toBeUndefined();
    const form = init.body as FormData;
    expect(form.get('altText')).toBe('Cover');
    expect(form.get('isPrimary')).toBe('true');
    expect(form.get('file')).toBeInstanceOf(File);
    expect(result).toEqual([{ id: '8', url: 'https://cdn.test/a.jpg', caption: undefined, isPrimary: true }]);
  });

  it('rejects a non-image or oversized file before any request', async () => {
    const text = new File(['x'], 'a.txt', { type: 'text/plain' });
    const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.jpg', { type: 'image/jpeg' });

    await expect(uploadTourImage('42', text, 'alt', { makePrimary: false, idempotencyKey: 'k' })).rejects.toThrow(/Tệp hình ảnh không hợp lệ/);
    await expect(uploadTourImage('42', big, 'alt', { makePrimary: false, idempotencyKey: 'k' })).rejects.toThrow(/Tệp hình ảnh không hợp lệ/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sets the primary image through the order endpoint and deletes through DELETE', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(media)) // list before reorder
      .mockResolvedValueOnce(jsonResponse(media)) // reorder response
      .mockResolvedValueOnce(new Response(null, { status: 204 })) // delete
      .mockResolvedValueOnce(jsonResponse([media[1]])); // list after delete

    await setPrimaryTourImage('42', '9');
    await removeTourImage('42', '9');

    const reorder = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(reorder[1].method).toBe('PUT');
    expect(JSON.parse(reorder[1].body as string)).toEqual({ mediaIds: [8, 9], primaryMediaId: 9 });
    const remove = fetchMock.mock.calls[2] as [string, RequestInit];
    expect(remove[1].method).toBe('DELETE');
    expect(remove[0]).toContain('/operator/tours/42/media/9');
  });
});
