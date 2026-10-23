import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { POST as postReviewRoute } from '../../../../app/api/v1/reviews/route';
import { tripReviewEn } from '../resources/en';
import { PENDING_BE_INTEGRATION_ERROR_CODE } from './tripReviewBff';

describe('Legacy review BFF stub (UC-33): POST /api/v1/reviews', () => {
  it('POST /api/v1/reviews explicitly returns 501 PENDING_BE_INTEGRATION with English resource-backed text and no-store header', async () => {
    const req = new Request('https://tripmate.example/api/v1/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tripId: 'trip-01',
        rating: 5,
        title: 'Great trip',
        comment: 'Very enjoyable experience.',
        publishWithDisplayName: true,
      }),
    });
    const res = await postReviewRoute(req);

    expect(res.status).toBe(501);
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(res.headers.get('Content-Type')).toContain('application/problem+json');

    const body = await res.json();
    expect(body.status).toBe(501);
    expect(body.title).toBe(tripReviewEn.bff.notImplementedTitle);
    expect(body.errorCode).toBe(PENDING_BE_INTEGRATION_ERROR_CODE);
    expect(body.detail).toBe(tripReviewEn.bff.tripReviewPendingDetail);
    expect(body.detail).not.toMatch(/MSG\d+|BR-\d+/);
  });
});
