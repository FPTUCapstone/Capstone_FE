import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/auth/session/authSession', () => ({
  AuthStorage: { getAccessToken: () => 'operator-token' },
}));
vi.mock('@/lib/apiBase', () => ({ getApiBase: () => 'http://api.test/api/v1' }));

import {
  addOperatorTourDeparture,
  createTourPackage,
  evaluateTourCompleteness,
  getOperatorTourById,
  getOperatorTours,
  OperatorTourValidationError,
  removeTourImage,
  reorderTourImages,
  setPrimaryTourImage,
  updateTourPackage,
  uploadTourImage,
  submitTourForApproval,
} from './operatorTourService';
import { submitTour, type ApiTourDetail } from './operatorTourApi';
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
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-15T00:00:00Z'));
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it.each(['  Staff note  ', '', '😀'.repeat(2000)])('sends a trimmed optional submission note and keeps confirmed success without a detail reload', async (note) => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ...detail, reviewBlockers: [], canSubmitForReview: true }));
    fetchMock.mockResolvedValueOnce(jsonResponse([{ tourMediaId: 1, deliveryUrl: '/cover.jpg', sortOrder: 0, isPrimary: true }]));
    const loaded = await getOperatorTourById('42');
    fetchMock.mockClear();
    fetchMock.mockResolvedValueOnce(jsonResponse({ tourId: 42, status: 'Pending', submittedAtUtc: '2026-11-18T12:00:00Z' }));
    const result = await submitTourForApproval('42', { currentTour: loaded.data!, note });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ submissionNote: note.trim() || null });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.data).toMatchObject({ status: 'Pending', submissionNote: note.trim() || null, submittedAtUtc: '2026-11-18T12:00:00Z' });
  });

  it('rejects a note exceeding 4000 UTF-16 units before sending', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ...detail, reviewBlockers: [], canSubmitForReview: true }));
    fetchMock.mockResolvedValueOnce(jsonResponse([{ tourMediaId: 1, deliveryUrl: '/cover.jpg', sortOrder: 0, isPrimary: true }]));
    const loaded = await getOperatorTourById('42');
    fetchMock.mockClear();
    await expect(submitTourForApproval('42', { currentTour: loaded.data!, note: '😀'.repeat(2001) })).rejects.toThrow(/4[.,]?000/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['required_fields_missing', 'itinerary_missing'])('explains server readiness blocker %s even when local fields look complete', async (blocker) => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ...detail, reviewBlockers: [blocker], canSubmitForReview: false }));
    fetchMock.mockResolvedValueOnce(jsonResponse([{ tourMediaId: 1, deliveryUrl: '/cover.jpg', sortOrder: 0, isPrimary: true }]));
    const loaded = await getOperatorTourById('42');
    const checklist = evaluateTourCompleteness(loaded.data!);
    expect(checklist.isEligibleForSubmission).toBe(false);
    expect(checklist.items.some((item) => !item.isComplete && item.isMandatory)).toBe(true);
  });

  it('retains submission metadata from detail reads', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ...detail, submissionNote: 'For Staff', submittedAtUtc: '2026-11-18T12:00:00Z' }));
    fetchMock.mockResolvedValueOnce(jsonResponse([]));
    expect((await getOperatorTourById('42')).data).toMatchObject({ submissionNote: 'For Staff', submittedAtUtc: '2026-11-18T12:00:00Z' });
  });

  it.each([
    null,
    { tourId: 42, status: 'Draft' },
    { tourId: 43, status: 'Pending' },
    { tourId: 42, status: 'Pending', submittedAtUtc: 'not a date' },
  ])('fails safely on an unrecognized submission response %j', async (response) => {
    fetchMock.mockResolvedValueOnce(jsonResponse(response));
    await expect(submitTour(42, null)).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  });

  it.each([
    { reviewBlockers: ['new_server_blocker'], canSubmitForReview: false },
    { reviewBlockers: [], canSubmitForReview: false },
  ])('never allows submission when server readiness denies it: %j', async (readiness) => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ...detail, ...readiness }));
    fetchMock.mockResolvedValueOnce(jsonResponse(media));
    const loaded = await getOperatorTourById('42');
    expect(evaluateTourCompleteness(loaded.data!).isEligibleForSubmission).toBe(false);
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

  it('adds a new departure to a Published tour without altering existing completed departures', async () => {
    const publishedWithCompleted: ApiTourDetail = {
      ...detail,
      status: 'Published',
      departures: [
        {
          ...detail.departures[0],
          id: 4,
          startAtUtc: '2026-10-01T01:00:00+00:00',
          endAtUtc: '2026-10-01T11:00:00+00:00',
          status: 'Completed',
          isCompleted: true,
          reservedCapacity: 5,
        },
      ],
    };
    const updatedAfterAdd: ApiTourDetail = {
      ...publishedWithCompleted,
      departures: [
        ...publishedWithCompleted.departures,
        {
          id: 99,
          startAtUtc: '2026-11-25T00:00:00Z',
          endAtUtc: '2026-11-25T23:59:59Z',
          meetingPoint: 'Sân bay Đà Nẵng',
          minimumCapacity: 3,
          totalCapacity: 25,
          reservedCapacity: 0,
          registrationDeadlineAtUtc: '2026-11-20T00:00:00Z',
          adultPrice: 1500000,
          childPrice: 800000,
          infantPrice: 0,
          status: 'Scheduled',
          isCompleted: false,
        },
      ],
    };
    fetchMock
      .mockResolvedValueOnce(jsonResponse(publishedWithCompleted))
      .mockResolvedValueOnce(jsonResponse(media))
      .mockResolvedValueOnce(jsonResponse({ tourId: 42, scheduleId: 99, status: 'Scheduled' }, 201))
      .mockResolvedValueOnce(jsonResponse(updatedAfterAdd))
      .mockResolvedValueOnce(jsonResponse(media));

    const loaded = (await getOperatorTourById('42', { allowDemo: false })).data!;
    expect(loaded.schedules[0].isCompleted).toBe(true);

    const added = await addOperatorTourDeparture(
      '42',
      {
        id: 'new',
        departureDate: '2026-11-25',
        returnDate: '2026-11-25',
        totalCapacity: 25,
        reservedCapacity: 0,
        minimumCapacity: 3,
        adultPrice: 1500000,
        childPrice: 800000,
        infantPrice: 0,
        registrationDeadlineDate: '2026-11-20',
        meetingPoint: 'Sân bay Đà Nẵng',
        status: 'Scheduled',
      },
      { allowDemo: false, currentTour: loaded, idempotencyKey: 'dep-key-1' },
    );

    expect(added.status).toBe('SUCCESS');
    expect(added.data?.schedules).toHaveLength(2);
    const postCall = fetchMock.mock.calls[2] as [string, RequestInit];
    expect(postCall[0]).toBe('http://api.test/api/v1/operator/tours/42/departures');
    expect((postCall[1].headers as Record<string, string>)['Idempotency-Key']).toBe('dep-key-1');
  });

  it('rejects duplicate departure date or invalid deadline before calling the backend and blocks Inactive edits', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ...detail, status: 'Published' })).mockResolvedValueOnce(jsonResponse([]));
    const published = (await getOperatorTourById('42', { allowDemo: false })).data!;

    await expect(
      addOperatorTourDeparture(
        '42',
        { ...published.schedules[0], registrationDeadlineDate: '2026-10-25' },
        { allowDemo: false, currentTour: published, idempotencyKey: 'k-dup' },
      ),
    ).rejects.toMatchObject({ errors: { schedules: expect.stringMatching(/trùng lặp/i) } });

    await expect(
      addOperatorTourDeparture(
        '42',
        {
          id: 'n',
          departureDate: '2026-12-01',
          returnDate: '2026-12-01',
          totalCapacity: 10,
          reservedCapacity: 0,
          registrationDeadlineDate: '2026-10-01',
          status: 'Scheduled',
        },
        { allowDemo: false, currentTour: published, idempotencyKey: 'k-dead' },
      ),
    ).rejects.toMatchObject({ errors: { schedules: expect.stringMatching(/Hạn đăng ký/i) } });

    const inactive = { ...published, status: 'Inactive' as const };
    const inactiveResult = await updateTourPackage({ ...inactive, schedules: published.schedules }, { currentTour: inactive });
    expect(inactiveResult.status).toBe('ERROR');
    expect(inactiveResult.message).toMatch(/Ngừng hoạt động/i);
  });

  it('reorders media images and maps poiName + departure counts', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse(media))
      .mockResolvedValueOnce(jsonResponse({ ...detail, itineraryItems: [{ ...detail.itineraryItems[0], poiName: 'Cầu Vàng' }] }))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({
        items: [{
          id: 42, title: 'Tour', status: 'Published', basePrice: 1000000, durationDays: 1,
          updatedAtUtc: '2026-10-01T00:00:00Z', nextDepartureAtUtc: null, destination: 'Đà Nẵng',
          upcomingDepartureCount: 2, completedDepartureCount: 1, totalDepartureCount: 3,
        }],
        page: 1, pageSize: 100, totalCount: 1,
      }));

    await reorderTourImages('42', ['9', '8'], '8');
    const detailMapped = (await getOperatorTourById('42')).data!;
    const listMapped = (await getOperatorTours()).data!;

    expect(detailMapped.itinerary[0].activities[0].poiName).toBe('Cầu Vàng');
    expect(listMapped[0]).toMatchObject({ upcomingDepartureCount: 2, completedDepartureCount: 1, totalDepartureCount: 3 });
  });

  it('maps BE 400 ValidationProblemDetails fieldErrors to OperatorTourValidationError on create and update (DH-06)', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        {
          title: 'One or more validation errors occurred.',
          errors: {
            Title: ['Title is too long.'],
            BasePrice: ['BasePrice must be positive.'],
            'Schedules[0].StartAtUtc': ['StartAtUtc must be in the future.'],
            'ItineraryItems[0].PlannedTime': ['Invalid time.'],
          },
        },
        400,
      ),
    );

    await expect(createTourPackage(payload, { idempotencyKey: 'key-dh06' })).rejects.toSatisfy(
      (err: unknown) =>
        err instanceof OperatorTourValidationError &&
        err.errors.title === 'Title is too long.' &&
        err.errors.basePrice === 'BasePrice must be positive.' &&
        err.errors.schedules === 'StartAtUtc must be in the future.' &&
        err.errors.itinerary === 'Invalid time.',
    );

    fetchMock.mockResolvedValueOnce(jsonResponse(detail)).mockResolvedValueOnce(jsonResponse([]));
    const loaded = (await getOperatorTourById('42', { allowDemo: false })).data!;
    fetchMock.mockResolvedValueOnce(
      jsonResponse(
        {
          title: 'One or more validation errors occurred.',
          errors: {
            CancellationPolicyTemplateId: ['Invalid policy.'],
          },
        },
        400,
      ),
    );

    await expect(
      updateTourPackage({ ...loaded, id: '42', schedules: loaded.schedules }, { currentTour: loaded }),
    ).rejects.toSatisfy(
      (err: unknown) =>
        err instanceof OperatorTourValidationError &&
        err.errors.cancellationPolicy === 'Invalid policy.',
    );
  });

  it('preserves meetingLatitude and meetingLongitude on create and update', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ tourId: 42, status: 'Draft' }, 201))
      .mockResolvedValueOnce(jsonResponse(detail))
      .mockResolvedValueOnce(jsonResponse([]));

    const payloadWithCoords: CreateTourPackagePayload = {
      ...payload,
      schedules: [
        {
          ...payload.schedules[0],
          meetingLatitude: 16.0544,
          meetingLongitude: 108.2022,
        },
      ],
    };

    await createTourPackage(payloadWithCoords, { idempotencyKey: 'key-coords-1' });
    const createBody = JSON.parse((fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string);
    expect(createBody.schedules[0]).toMatchObject({
      meetingLatitude: 16.0544,
      meetingLongitude: 108.2022,
    });

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ ...detail, departures: [{ ...detail.departures[0], meetingLatitude: 16.0544, meetingLongitude: 108.2022 }] }))
      .mockResolvedValueOnce(jsonResponse([]));
    const loaded = (await getOperatorTourById('42', { allowDemo: false })).data!;

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ tourId: 42, status: 'Draft' }))
      .mockResolvedValueOnce(jsonResponse(detail))
      .mockResolvedValueOnce(jsonResponse([]));

    await updateTourPackage({ ...loaded, id: '42', schedules: loaded.schedules }, { currentTour: loaded });
    const updateBody = JSON.parse((fetchMock.mock.calls[5] as [string, RequestInit])[1].body as string);
    expect(updateBody.schedules[0]).toMatchObject({
      meetingLatitude: 16.0544,
      meetingLongitude: 108.2022,
    });
  });
});
