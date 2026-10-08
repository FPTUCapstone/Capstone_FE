import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { POST as postReviewRoute } from '../../../../app/api/v1/reviews/route';
import { GET as getTripDetailRoute } from '../../../../app/api/v1/traveler/trips/[tripId]/route';
import { GET as getTripListRoute } from '../../../../app/api/v1/traveler/trips/route';
import {
  PENDING_BE_INTEGRATION_ERROR_CODE,
  validateSafeTripIdSegment,
} from './tripReviewBff';

describe('Trip & Review Verified Next.js BFF Route Handlers (UC-32 / UC-33)', () => {
  it('GET /api/v1/traveler/trips explicitly returns 501 PENDING_BE_INTEGRATION with no-store header', async () => {
    const req = new Request('https://tripmate.example/api/v1/traveler/trips?status=Completed');
    const res = await getTripListRoute(req);

    expect(res.status).toBe(501);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(res.headers.get('Content-Type')).toContain('application/problem+json');

    const body = await res.json();
    expect(body.status).toBe(501);
    expect(body.errorCode).toBe(PENDING_BE_INTEGRATION_ERROR_CODE);
    expect(body.detail).toContain('chờ kích hoạt dịch vụ máy chủ');
  });

  it('GET /api/v1/traveler/trips/[tripId] explicitly returns 501 PENDING_BE_INTEGRATION for valid tripId', async () => {
    const req = new Request('https://tripmate.example/api/v1/traveler/trips/trip-01');
    const res = await getTripDetailRoute(req, {
      params: Promise.resolve({ tripId: 'trip-01' }),
    });

    expect(res.status).toBe(501);
    expect(res.headers.get('Cache-Control')).toBe('no-store');

    const body = await res.json();
    expect(body.status).toBe(501);
    expect(body.errorCode).toBe(PENDING_BE_INTEGRATION_ERROR_CODE);
  });

  it('GET /api/v1/traveler/trips/[tripId] rejects dot segments and path traversal with 400 Bad Request', async () => {
    for (const invalidId of ['', '   ', '.', '..', '../secret', 'a/b', 'a\\b']) {
      expect(validateSafeTripIdSegment(invalidId)).toBeNull();
      const req = new Request('https://tripmate.example/api/v1/traveler/trips/invalid');
      const res = await getTripDetailRoute(req, {
        params: Promise.resolve({ tripId: invalidId }),
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.errorCode).toBe('INVALID_TRIP_ID');
    }
  });

  it('POST /api/v1/reviews explicitly returns 501 PENDING_BE_INTEGRATION with no-store header', async () => {
    const req = new Request('https://tripmate.example/api/v1/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripId: 'trip-01',
        rating: 5,
        title: 'Tuyệt vời',
        comment: 'Trải nghiệm rất tốt.',
        publishWithDisplayName: true,
      }),
    });
    const res = await postReviewRoute(req);

    expect(res.status).toBe(501);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(res.headers.get('Content-Type')).toContain('application/problem+json');

    const body = await res.json();
    expect(body.status).toBe(501);
    expect(body.errorCode).toBe(PENDING_BE_INTEGRATION_ERROR_CODE);
    expect(body.detail).toContain('chờ kích hoạt API máy chủ');
  });
});
