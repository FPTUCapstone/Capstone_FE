import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/auth/session/authSession', () => ({
  AuthStorage: { getAccessToken: () => 'operator-token' },
}));
vi.mock('@/lib/apiBase', () => ({ getApiBase: () => 'http://api.test/api/v1' }));

import {
  createOrResumePendingChange,
  discardPendingChange,
  getCurrentPendingChange,
  OperatorTourApiError,
  savePendingChange,
  submitPendingChange,
  type ApiPendingChange,
  type ApiPendingChangeSaveBody,
} from './operatorTourApi';

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function problemResponse(status: number, errorCode: string, title = 'failed') {
  return new Response(JSON.stringify({ title, errorCode }), { status, headers: { 'Content-Type': 'application/json' } });
}

const pendingChange: ApiPendingChange = {
  id: 55,
  tourId: 42,
  status: 'Draft',
  categoryId: 3,
  title: 'Tour Bà Nà (bản nháp)',
  description: 'Mô tả cập nhật',
  basePrice: 1200000,
  durationDays: 1,
  inclusions: null,
  exclusions: null,
  highlights: null,
  travellerRequirements: null,
  timeZoneId: 'Asia/Ho_Chi_Minh',
  destinationIds: [1, 2],
  destinationSummary: 'Đà Nẵng, Quảng Nam',
  cancellationPolicyTemplateId: 7,
  itineraryItems: [{ dayNo: 1, sequenceNo: 1, poiId: 11, plannedTime: '08:00:00', stayDurationMinutes: 60, notes: null }],
  schedules: [
    {
      scheduleId: 5,
      startAtUtc: '2026-11-20T01:30:00+00:00',
      endAtUtc: '2026-11-20T09:30:00+00:00',
      meetingPoint: 'Khách sạn',
      totalCapacity: 8,
      minimumCapacity: 4,
      registrationDeadlineAtUtc: '2026-11-18T00:00:00+00:00',
      adultPrice: 1200000,
      childPrice: 800000,
      infantPrice: 100000,
    },
  ],
  createdAtUtc: '2026-11-20T00:00:00Z',
  updatedAtUtc: '2026-11-20T00:00:00Z',
  submittedAtUtc: null,
  reviewedAtUtc: null,
  rejectionReason: null,
};

describe('operatorTourApi pending-change functions (TM-82 / UC-36)', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('createOrResumePendingChange POSTs with no body and parses isNew', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 55, tourId: 42, status: 'Draft', isNew: true }, 201));
    const result = await createOrResumePendingChange(42);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/v1/operator/tours/42/pending-changes',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result).toEqual({ id: 55, tourId: 42, status: 'Draft', isNew: true });
  });

  it('createOrResumePendingChange returns isNew: false on idempotent resume (200)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 55, tourId: 42, status: 'PendingReview', isNew: false }, 200));
    const result = await createOrResumePendingChange(42);
    expect(result.isNew).toBe(false);
  });

  it('getCurrentPendingChange GETs and returns the full payload on 200', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(pendingChange));
    const result = await getCurrentPendingChange(42);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/v1/operator/tours/42/pending-changes/current',
      expect.objectContaining({ headers: expect.any(Object) }),
    );
    expect(result).toEqual(pendingChange);
  });

  it('getCurrentPendingChange returns null (not a throw) on 404 pending_change_not_found', async () => {
    fetchMock.mockResolvedValueOnce(problemResponse(404, 'operator_tour.pending_change_not_found'));
    const result = await getCurrentPendingChange(42);
    expect(result).toBeNull();
  });

  it('getCurrentPendingChange still throws on a different 404 (e.g. tour not found)', async () => {
    fetchMock.mockResolvedValueOnce(problemResponse(404, 'operator_tour.not_found'));
    await expect(getCurrentPendingChange(42)).rejects.toBeInstanceOf(OperatorTourApiError);
  });

  it('getCurrentPendingChange still throws on a non-404 failure (e.g. 403)', async () => {
    fetchMock.mockResolvedValueOnce(problemResponse(403, 'operator_tour.access_required'));
    await expect(getCurrentPendingChange(42)).rejects.toMatchObject({ status: 403 });
  });

  it('savePendingChange PUTs the body to the pending-change id and returns the saved result', async () => {
    const body: ApiPendingChangeSaveBody = {
      title: 'Tour Bà Nà (bản nháp)',
      description: 'Mô tả cập nhật',
      basePrice: 1200000,
      durationDays: 1,
      destinationIds: [1, 2],
      cancellationPolicyTemplateId: 7,
      itineraryItems: pendingChange.itineraryItems,
      schedules: pendingChange.schedules,
    };
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 55, tourId: 42, status: 'Draft' }));
    const result = await savePendingChange(42, 55, body);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/v1/operator/tours/42/pending-changes/55',
      expect.objectContaining({ method: 'PUT', body: JSON.stringify(body) }),
    );
    expect(result).toEqual({ id: 55, tourId: 42, status: 'Draft' });
  });

  it('savePendingChange surfaces a 409 schedule_has_active_bookings failure (BR-61/MSG143)', async () => {
    fetchMock.mockResolvedValueOnce(problemResponse(409, 'operator_tour.schedule_has_active_bookings'));
    await expect(savePendingChange(42, 55, {
      title: 't', description: 'd', basePrice: 1, durationDays: 1, destinationIds: [1],
      cancellationPolicyTemplateId: 1, itineraryItems: [], schedules: [],
    })).rejects.toMatchObject({ status: 409, code: 'operator_tour.schedule_has_active_bookings' });
  });

  it('discardPendingChange DELETEs and resolves without a body on 204', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(discardPendingChange(42, 55)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/v1/operator/tours/42/pending-changes/55',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('discardPendingChange throws on a 409 invalid_state (not Draft/Rejected)', async () => {
    fetchMock.mockResolvedValueOnce(problemResponse(409, 'operator_tour.invalid_state'));
    await expect(discardPendingChange(42, 55)).rejects.toMatchObject({ status: 409 });
  });

  it('submitPendingChange POSTs to the submit sub-path and returns the result', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ id: 55, tourId: 42, status: 'PendingReview' }));
    const result = await submitPendingChange(42, 55);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/v1/operator/tours/42/pending-changes/55/submit',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result).toEqual({ id: 55, tourId: 42, status: 'PendingReview' });
  });

  it('submitPendingChange surfaces a 400 pending_change_review_prerequisites_missing (BR-101)', async () => {
    fetchMock.mockResolvedValueOnce(problemResponse(400, 'operator_tour.pending_change_review_prerequisites_missing'));
    await expect(submitPendingChange(42, 55)).rejects.toMatchObject({
      status: 400, code: 'operator_tour.pending_change_review_prerequisites_missing',
    });
  });

  it('a network failure on any pending-change call surfaces as OperatorTourApiError status 0', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('network down'));
    await expect(createOrResumePendingChange(42)).rejects.toMatchObject({ status: 0, code: 'NETWORK' });
  });
});
