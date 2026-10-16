import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ExternalReviewsError,
  getExternalReviews,
  translateExternalReview,
} from './externalReviewsApi';

const reviewsBody = {
  poiId: 42,
  translationAvailable: true,
  source: 'Tripadvisor',
  rating: 4.5,
  reviewCount: 1234,
  ratingImageUrl: 'https://static.tacdn.com/img2/ratings/traveler/4.5.svg',
  url: 'https://www.tripadvisor.com/Attraction_Review-42',
  reviews: [
    {
      id: 900,
      rating: 5,
      title: 'Amazing view',
      text: 'Worth the climb.',
      language: 'en',
      publishedAt: '2026-09-01T10:00:00Z',
      travelDate: '2026-08',
      author: 'Anna',
      url: 'https://www.tripadvisor.com/ShowUserReviews-900',
      ratingImageUrl: 'https://static.tacdn.com/img2/ratings/traveler/5.0.svg',
    },
  ],
};

describe('external reviews API (§3.6)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads Tripadvisor reviews with the traveler token', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({ status: 200, ok: true, json: async () => reviewsBody });

    const result = await getExternalReviews(42, { accessToken: 'traveler-token' });

    expect(result.source).toBe('Tripadvisor');
    expect(result.reviews[0].title).toBe('Amazing view');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/pois\/42\/external-reviews\?size=5$/),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer traveler-token' }),
      }),
    );
  });

  it('accepts an unlinked POI (source null)', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        poiId: 42,
        translationAvailable: false,
        source: null,
        rating: null,
        reviewCount: 0,
        ratingImageUrl: null,
        url: null,
        reviews: [],
      }),
    });

    const result = await getExternalReviews(42);

    expect(result.source).toBeNull();
  });

  it('rejects a body that does not match the contract', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({ ...reviewsBody, reviews: [{ id: 'x' }] }),
    });

    await expect(getExternalReviews(42)).rejects.toBeInstanceOf(ExternalReviewsError);
  });

  it('translates one review to Vietnamese', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => ({
        reviewId: 900,
        language: 'vi',
        title: 'Cảnh tuyệt đẹp',
        text: 'Đáng để leo.',
        machineTranslated: true,
      }),
    });

    const result = await translateExternalReview(42, 900);

    expect(result.text).toBe('Đáng để leo.');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/pois\/42\/external-reviews\/900\/translation\?target=vi$/),
      expect.anything(),
    );
  });

  it('explains when translation is switched off', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      status: 503,
      ok: false,
      json: async () => ({ errorCode: 'external_reviews.translation_unavailable' }),
    });

    await expect(translateExternalReview(42, 900)).rejects.toMatchObject({
      message: 'Tính năng dịch đang tạm tắt.',
    });
  });
});

describe('external reviews API error bodies', () => {
  it('survives a JSON null error body', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({ status: 500, ok: false, json: async () => null });

    await expect(getExternalReviews(42)).rejects.toMatchObject({
      message: 'Không tải được đánh giá Tripadvisor lúc này.',
    });
  });

  it('survives a non-JSON body', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      ok: true,
      json: async () => {
        throw new SyntaxError('Unexpected token');
      },
    });

    await expect(getExternalReviews(42)).rejects.toBeInstanceOf(ExternalReviewsError);
  });
});
