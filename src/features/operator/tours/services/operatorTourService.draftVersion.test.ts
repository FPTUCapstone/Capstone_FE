import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/auth/session/authSession', () => ({
  AuthStorage: { getAccessToken: () => 'operator-token' },
}));
vi.mock('@/lib/apiBase', () => ({ getApiBase: () => 'http://api.test/api/v1' }));

import {
  createOrResumeDraftVersion,
  discardDraftVersion,
  OperatorTourValidationError,
  saveDraftVersion,
  submitDraftVersion,
} from './operatorTourService';
import type { ApiPendingChange } from './operatorTourApi';
import type { TourPackageDto, UpdateTourPackagePayload } from '../types/tourLifecycle';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function problemResponse(status: number, errorCode: string) {
  return new Response(JSON.stringify({ title: 'failed', errorCode }), { status, headers: { 'Content-Type': 'application/json' } });
}

const liveTour: TourPackageDto = {
  id: '42',
  tourCode: 'TP-0042',
  operatorUserId: 101,
  title: 'Tour Bà Nà (đã duyệt)',
  destination: 'Đà Nẵng',
  destinationIds: [1, 2],
  category: '3',
  durationDays: 1,
  basePrice: 1000000,
  childPrice: 800000,
  maxCapacity: 12,
  description: 'Mô tả gốc',
  cancellationPolicy: '7',
  status: 'Approved',
  version: 1,
  itinerary: [{ dayNo: 1, activities: [{ id: '1-1', time: '08:00', poiId: 11, poiName: 'Bà Nà', stayDurationMinutes: 60, transport: '' }] }],
  schedules: [
    { id: '5', departureDate: '2026-11-20', returnDate: '2026-11-20', totalCapacity: 12, reservedCapacity: 4, status: 'Scheduled' },
  ],
  media: [],
  createdAt: '2026-10-01',
  updatedAt: '2026-10-01',
};

const pendingChange: ApiPendingChange = {
  id: 55,
  tourId: 42,
  status: 'Draft',
  categoryId: 3,
  title: 'Tour Bà Nà (bản nháp)',
  description: 'Mô tả gốc',
  basePrice: 1200000,
  durationDays: 1,
  inclusions: null,
  exclusions: null,
  highlights: null,
  travellerRequirements: null,
  timeZoneId: 'Asia/Ho_Chi_Minh',
  destinationIds: [1, 2],
  destinationSummary: 'Đà Nẵng',
  cancellationPolicyTemplateId: 7,
  itineraryItems: [{ dayNo: 1, sequenceNo: 1, poiId: 11, plannedTime: '08:00:00', stayDurationMinutes: 60, notes: null }],
  schedules: [
    {
      scheduleId: 5,
      startAtUtc: '2026-11-20T01:30:00+00:00',
      endAtUtc: '2026-11-20T09:30:00+00:00',
      meetingPoint: null,
      totalCapacity: 8,
      minimumCapacity: 4,
      registrationDeadlineAtUtc: null,
      adultPrice: 1200000,
      childPrice: 800000,
      infantPrice: null,
    },
  ],
  createdAtUtc: '2026-11-20T00:00:00Z',
  updatedAtUtc: '2026-11-20T00:00:00Z',
  submittedAtUtc: null,
  reviewedAtUtc: null,
  rejectionReason: null,
};

const updatePayload: UpdateTourPackagePayload = {
  id: '42',
  title: 'Tour Bà Nà (bản nháp)',
  destination: 'Đà Nẵng',
  destinationIds: [1, 2],
  durationDays: 1,
  basePrice: 1200000,
  maxCapacity: 8,
  description: 'Mô tả gốc',
  cancellationPolicy: '7',
  itinerary: liveTour.itinerary,
  schedules: [
    { id: '5', departureDate: '2026-11-20', returnDate: '2026-11-20', totalCapacity: 8, reservedCapacity: 4, status: 'Scheduled' },
  ],
};

describe('draft-version functions against the TM-82 backend contract', () => {
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

  it('createOrResumeDraftVersion creates then loads the draft, mapped onto TourPackageDto', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 55, tourId: 42, status: 'Draft', isNew: true }, 201));
    fetchMock.mockResolvedValueOnce(jsonResponse(pendingChange));
    const result = await createOrResumeDraftVersion('42', liveTour);
    expect(result.id).toBe('55'); // the draft version's own id, not the live tour's
    expect(result.status).toBe('Draft');
    expect(result.title).toBe('Tour Bà Nà (bản nháp)');
    expect(result.basePrice).toBe(1200000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('createOrResumeDraftVersion throws if create succeeds but current returns nothing (contract violation)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 55, tourId: 42, status: 'Draft', isNew: true }, 201));
    fetchMock.mockResolvedValueOnce(problemResponse(404, 'operator_tour.pending_change_not_found'));
    await expect(createOrResumeDraftVersion('42', liveTour)).rejects.toThrow(/Không tìm thấy bản nháp/);
  });

  it('saveDraftVersion runs client-side BR-61 validation before calling the server', async () => {
    const overCapacity: UpdateTourPackagePayload = {
      ...updatePayload,
      schedules: [{ ...updatePayload.schedules[0], totalCapacity: 2 }], // below reservedCapacity: 4
    };
    await expect(saveDraftVersion('42', '55', overCapacity, liveTour)).rejects.toBeInstanceOf(OperatorTourValidationError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('saveDraftVersion PUTs the mapped payload and returns the freshly reloaded draft', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 55, tourId: 42, status: 'Draft' }));
    fetchMock.mockResolvedValueOnce(jsonResponse(pendingChange));
    const result = await saveDraftVersion('42', '55', updatePayload, liveTour);
    expect(result.status).toBe('SUCCESS');
    expect(result.data?.id).toBe('55');

    const [, saveInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const sentBody = JSON.parse(saveInit.body as string);
    // The existing schedule's numeric id must round-trip as scheduleId, never null (spec §4 — a
    // lost id here would silently create a duplicate schedule instead of updating the existing one).
    expect(sentBody.schedules[0].scheduleId).toBe(5);
  });

  it('saveDraftVersion sends scheduleId: null for a client-only new schedule row', async () => {
    const withNewSchedule: UpdateTourPackagePayload = {
      ...updatePayload,
      schedules: [
        ...updatePayload.schedules,
        { id: 'sch-user-2', departureDate: '2026-12-01', returnDate: '2026-12-01', totalCapacity: 10, reservedCapacity: 0, status: 'Scheduled' },
      ],
    };
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 55, tourId: 42, status: 'Draft' }));
    fetchMock.mockResolvedValueOnce(jsonResponse(pendingChange));
    await saveDraftVersion('42', '55', withNewSchedule, liveTour);
    const [, saveInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const sentBody = JSON.parse(saveInit.body as string);
    expect(sentBody.schedules).toHaveLength(2);
    expect(sentBody.schedules[0].scheduleId).toBe(5);
    expect(sentBody.schedules[1].scheduleId).toBeNull();
  });

  it('saveDraftVersion surfaces a 409 schedule_has_active_bookings (MSG143) as a thrown error', async () => {
    fetchMock.mockResolvedValueOnce(problemResponse(409, 'operator_tour.schedule_has_active_bookings'));
    await expect(saveDraftVersion('42', '55', updatePayload, liveTour)).rejects.toMatchObject({
      status: 409, code: 'operator_tour.schedule_has_active_bookings',
    });
  });

  it('discardDraftVersion DELETEs with no further loads', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(discardDraftVersion('42', '55')).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('submitDraftVersion POSTs submit then reloads the draft (now PendingReview)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 55, tourId: 42, status: 'PendingReview' }));
    fetchMock.mockResolvedValueOnce(jsonResponse({ ...pendingChange, status: 'PendingReview' }));
    const result = await submitDraftVersion('42', '55', liveTour);
    expect(result.status).toBe('SUCCESS');
    expect(result.data?.status).toBe('PendingReview');
  });

  it('submitDraftVersion surfaces a 400 pending_change_review_prerequisites_missing (BR-101)', async () => {
    fetchMock.mockResolvedValueOnce(problemResponse(400, 'operator_tour.pending_change_review_prerequisites_missing'));
    await expect(submitDraftVersion('42', '55', liveTour)).rejects.toMatchObject({
      status: 400, code: 'operator_tour.pending_change_review_prerequisites_missing',
    });
  });
});
