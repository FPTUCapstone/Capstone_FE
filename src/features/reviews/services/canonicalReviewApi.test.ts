import { afterEach, describe, expect, it, vi } from 'vitest';
import { createReview, getReviewContext, updateReview } from './canonicalReviewApi';

const context = {
  reviewableRecord: { kind: 'serviceBooking', id: 42 }, bookingStatus: 'Completed',
  subject: { kind: 'poi', id: 8 }, summary: { name: 'Museum', departureAtUtc: '2026-10-01T00:00:00Z', bookingReference: 'SB-42' },
  canSubmit: true, submitUnavailableReason: null, existingReviewKind: 'none', review: null,
  editableFields: [], routePacing: { available: false, reason: null },
  cspRating: { available: false, reason: null }, poiRatings: { available: false, reason: null },
};

describe('canonical review API', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('keeps service and commerce booking namespaces distinct on GET', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(context));
    vi.stubGlobal('fetch', fetchMock);
    await getReviewContext({ kind: 'serviceBooking', id: 42 });
    await getReviewContext({ kind: 'commerceBooking', id: 42 });
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/service-bookings/42/review');
    expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/bookings/42/review');
  });

  it('submits exact multipart metadata and files', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ reviewId: 1 }, { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);
    const file = new File(['image'], 'photo.png', { type: 'image/png' });
    await createReview({ kind: 'commerceBooking', id: 7 }, {
      overallRating: 5, title: 'Great', content: 'Excellent trip', publishDisplayName: true, files: [file],
    });
    const form = fetchMock.mock.calls[0][1].body as FormData;
    expect(Array.from(form.keys())).toEqual(['metadata', 'files']);
    expect((form.get('files') as File).name).toBe('photo.png');
    const metadata = form.get('metadata');
    expect(typeof metadata).toBe('string');
    expect(JSON.parse(metadata as string)).toEqual({
      overallRating: 5, title: 'Great', content: 'Excellent trip', poiRatings: [],
      routePacing: null, cspRating: null, publishDisplayName: true,
    });
  });

  it('uses the server version for an exact PUT payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ reviewId: 1 }));
    vi.stubGlobal('fetch', fetchMock);
    await updateReview({ kind: 'serviceBooking', id: 9 }, {
      overallRating: 4, title: 'Updated', content: 'Updated review', publishDisplayName: false, version: 'AAAA',
    });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ overallRating: 4,
      title: 'Updated', content: 'Updated review', publishDisplayName: false, version: 'AAAA' });
  });
});
