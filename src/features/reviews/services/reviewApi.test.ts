import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tripReviewEn } from '@/features/trips/resources/en';
import { submitTripReview } from './reviewApi';

function setNodeEnv(val?: string) {
  (process.env as Record<string, string | undefined>).NODE_ENV = val;
}

describe('reviewApi Service (REVIEW-4, REVIEW-5, REVIEW-6, REVIEW-8, REVIEW-9)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('Validation constraints', () => {
    it('REVIEW-4: Rejects submission if title is missing or empty (MSG01)', async () => {
      await expect(
        submitTripReview({
          tripId: 'trip-1',
          title: '   ',
          rating: 5,
          comment: 'A very enjoyable and informative trip.',
          publishWithDisplayName: true,
        })
      ).rejects.toMatchObject({
        name: 'ReviewApiError',
        statusCode: 400,
        message: tripReviewEn.validation.titleRequired,
        details: { errorCode: 'MSG01' },
      });
    });

    it('REVIEW-4: Rejects submission if rating is missing or invalid (0 or >5)', async () => {
      await expect(
        submitTripReview({
          tripId: 'trip-1',
          title: 'Wonderful trip',
          rating: 0,
          comment: 'A very enjoyable and informative trip.',
          publishWithDisplayName: true,
        })
      ).rejects.toMatchObject({
        name: 'ReviewApiError',
        statusCode: 400,
        message: tripReviewEn.validation.ratingRequired,
        details: { errorCode: 'MSG66' },
      });

      await expect(
        submitTripReview({
          tripId: 'trip-1',
          title: 'Wonderful trip',
          rating: 6,
          comment: 'A very enjoyable and informative trip.',
          publishWithDisplayName: true,
        })
      ).rejects.toMatchObject({
        name: 'ReviewApiError',
        statusCode: 400,
        message: tripReviewEn.validation.ratingRequired,
        details: { errorCode: 'MSG66' },
      });
    });

    it('BR-93: Rejects fractional ratings (4.5, 1.5) and non-finite ratings (NaN, Infinity) without calling fetch in both Production and Demo modes', async () => {
      const fetchSpy = vi.fn();
      global.fetch = fetchSpy;
      setNodeEnv('test');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';

      for (const invalidRating of [4.5, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
        for (const allowDemo of [false, true]) {
          await expect(
            submitTripReview(
              {
                tripId: 'trip-1',
                title: 'Wonderful trip',
                rating: invalidRating,
                comment: 'A very enjoyable and informative trip.',
                publishWithDisplayName: true,
              },
              { allowDemo }
            )
          ).rejects.toMatchObject({
            name: 'ReviewApiError',
            statusCode: 400,
            message: tripReviewEn.validation.ratingRequired,
            details: { errorCode: 'MSG66' },
          });
        }
      }

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('BR-93: Accepts integer boundary ratings 1 and 5 in both Demo and Production modes', async () => {
      setNodeEnv('test');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';

      for (const validRating of [1, 5]) {
        const demoRes = await submitTripReview(
          {
            tripId: 'trip-demo-01',
            title: 'Valid boundary rating',
            rating: validRating,
            comment: 'Valid review comment.',
            publishWithDisplayName: true,
          },
          { allowDemo: true }
        );
        expect(demoRes.status).toBe('SUCCESS');

        global.fetch = vi.fn().mockResolvedValue({
          status: 201,
          ok: true,
          json: async () => ({ reviewId: `rev-${validRating}` }),
        });

        const prodRes = await submitTripReview(
          {
            tripId: 'trip-prod-01',
            title: 'Valid boundary rating',
            rating: validRating,
            comment: 'Valid review comment.',
            publishWithDisplayName: true,
          },
          { allowDemo: false }
        );
        expect(prodRes.status).toBe('SUCCESS');
        expect(prodRes.reviewId).toBe(`rev-${validRating}`);
      }
    });

    it('Accepts a review title of 150 characters (including after trimming) and rejects 151 characters without calling fetch in both Production and Demo modes', async () => {
      setNodeEnv('test');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';

      const exact150 = 'T'.repeat(150);
      const padded150 = `   ${exact150}   `;
      const over151 = 'T'.repeat(151);

      // 150 chars accepted in Demo
      const demo150 = await submitTripReview(
        {
          tripId: 'trip-demo-01',
          title: exact150,
          rating: 5,
          comment: 'Valid comment.',
          publishWithDisplayName: true,
        },
        { allowDemo: true }
      );
      expect(demo150.status).toBe('SUCCESS');

      // 150 chars after trimming accepted in Production and sent trimmed
      const fetchMock = vi.fn().mockResolvedValue({
        status: 201,
        ok: true,
        json: async () => ({ reviewId: 'rev-150' }),
      });
      global.fetch = fetchMock;

      const prod150 = await submitTripReview(
        {
          tripId: 'trip-prod-01',
          title: padded150,
          rating: 5,
          comment: 'Valid comment.',
          publishWithDisplayName: true,
        },
        { allowDemo: false }
      );
      expect(prod150.status).toBe('SUCCESS');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const sentBody = JSON.parse(fetchMock.mock.calls[0][1].body as string);
      expect(sentBody.title).toBe(exact150);
      expect(sentBody.title).toHaveLength(150);

      // 151 chars rejected before fetch in both Production and Demo
      const rejectFetchSpy = vi.fn();
      global.fetch = rejectFetchSpy;

      for (const allowDemo of [false, true]) {
        await expect(
          submitTripReview(
            {
              tripId: 'trip-1',
              title: over151,
              rating: 5,
              comment: 'Valid comment.',
              publishWithDisplayName: true,
            },
            { allowDemo }
          )
        ).rejects.toMatchObject({
          name: 'ReviewApiError',
          statusCode: 400,
          message: tripReviewEn.validation.titleMaxLength,
          details: { errorCode: 'REVIEW_TITLE_TOO_LONG' },
        });
      }

      expect(rejectFetchSpy).not.toHaveBeenCalled();
    });

    it('Accepts valid short comment (1-500 chars per SRS §3.7.2, removing invented 20-char limit)', async () => {
      setNodeEnv('test');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';

      const result = await submitTripReview(
        {
          tripId: 'trip-demo-01',
          title: 'Very good',
          rating: 5,
          comment: 'Excellent!', // 10 chars
          publishWithDisplayName: true,
        },
        { allowDemo: true }
      );
      expect(result.status).toBe('SUCCESS');
    });

    it('REVIEW-5: Rejects submission if comment is empty (MSG01)', async () => {
      await expect(
        submitTripReview({
          tripId: 'trip-1',
          title: 'Great trip',
          rating: 5,
          comment: '   ',
          publishWithDisplayName: true,
        })
      ).rejects.toMatchObject({
        name: 'ReviewApiError',
        statusCode: 400,
        message: tripReviewEn.validation.commentRequired,
        details: { errorCode: 'MSG01' },
      });
    });

    it('REVIEW-6: Rejects submission if comment exceeds 500 characters', async () => {
      const longComment = 'A'.repeat(501);
      await expect(
        submitTripReview({
          tripId: 'trip-1',
          title: 'Review Title',
          rating: 5,
          comment: longComment,
          publishWithDisplayName: true,
        })
      ).rejects.toMatchObject({
        name: 'ReviewApiError',
        statusCode: 400,
        message: tripReviewEn.validation.commentMaxLength,
        details: { errorCode: 'MSG123' },
      });
    });

    it('CR-09: Validation error messages do not render raw MSGxxx or BR-xxx codes while preserving internal errorCode', async () => {
      for (const msg of [
        tripReviewEn.validation.ratingRequired,
        tripReviewEn.validation.titleRequired,
        tripReviewEn.validation.titleMaxLength,
        tripReviewEn.validation.commentRequired,
        tripReviewEn.validation.commentMaxLength,
      ]) {
        expect(msg).not.toMatch(/MSG\d+|BR-\d+/);
      }
    });
  });

  describe('Real mode truthfulness & BFF differentiation (REVIEW-8)', () => {
    it('REVIEW-8: Returns PENDING_BE_INTEGRATION ONLY on 501 with PENDING_BE_INTEGRATION errorCode in real mode without reporting fake success', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        status: 501,
        ok: false,
        json: async () => ({
          status: 501,
          errorCode: 'PENDING_BE_INTEGRATION',
          detail: 'Untrusted raw backend detail',
        }),
      });

      const result501 = await submitTripReview(
        {
          tripId: 'trip-1',
          title: 'Wonderful trip',
          rating: 5,
          comment: 'Great service and well-timed schedule.',
          publishWithDisplayName: true,
        },
        { allowDemo: false }
      );

      expect(result501.status).toBe('PENDING_BE_INTEGRATION');
      expect(result501.message).toBe(tripReviewEn.bff.tripReviewPendingDetail);
      expect(result501.message).not.toMatch(/MSG\d+|BR-\d+/);
      expect(result501.reviewId).toBeUndefined();
    });

    it('rejects a generic 501 without PENDING_BE_INTEGRATION errorCode as ReviewApiError system failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        status: 501,
        ok: false,
        json: async () => ({ title: 'Not Implemented' }),
      });

      await expect(
        submitTripReview(
          {
            tripId: 'trip-1',
            title: 'Wonderful trip',
            rating: 5,
            comment: 'Great quality.',
            publishWithDisplayName: true,
          },
          { allowDemo: false }
        )
      ).rejects.toMatchObject({
        name: 'ReviewApiError',
        statusCode: 501,
        message: tripReviewEn.errors.systemError,
        details: expect.objectContaining({ errorCode: 'MSG127' }),
      });
    });

    it('does NOT misclassify 404 as PENDING_BE_INTEGRATION and does NOT expose raw Backend ProblemDetails title/detail', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        status: 404,
        ok: false,
        json: async () => ({ title: 'Not Found', detail: 'Raw DB record missing' }),
      });

      await expect(
        submitTripReview(
          {
            tripId: 'trip-missing',
            title: 'Wonderful trip',
            rating: 5,
            comment: 'Great quality.',
            publishWithDisplayName: true,
          },
          { allowDemo: false }
        )
      ).rejects.toMatchObject({
        name: 'ReviewApiError',
        statusCode: 404,
        message: tripReviewEn.errors.reviewTripNotFound,
        details: expect.objectContaining({
          detail: 'Raw DB record missing',
          errorCode: 'TRIP_NOT_FOUND',
        }),
      });
    });

    it('differentiates 401 and 403 authorization errors from 501 and 5xx and uses canonical English resource', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        status: 401,
        ok: false,
        json: async () => ({ detail: 'Raw JWT expired exception' }),
      });

      await expect(
        submitTripReview(
          {
            tripId: 'trip-1',
            title: 'Wonderful trip',
            rating: 5,
            comment: 'Great quality.',
            publishWithDisplayName: true,
          },
          { allowDemo: false }
        )
      ).rejects.toMatchObject({
        name: 'ReviewApiError',
        statusCode: 401,
        message: tripReviewEn.errors.reviewAccessDenied,
        details: expect.objectContaining({ errorCode: 'MSG126' }),
      });

      global.fetch = vi.fn().mockResolvedValue({
        status: 403,
        ok: false,
        json: async () => ({}),
      });

      await expect(
        submitTripReview(
          {
            tripId: 'trip-1',
            title: 'Wonderful trip',
            rating: 5,
            comment: 'Great quality.',
            publishWithDisplayName: true,
          },
          { allowDemo: false }
        )
      ).rejects.toMatchObject({
        name: 'ReviewApiError',
        statusCode: 403,
        message: tripReviewEn.errors.reviewAccessDenied,
        details: expect.objectContaining({ errorCode: 'MSG126' }),
      });
    });

    it('throws ReviewApiError when server returns 502, 503, timeout, or on network failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        status: 502,
        ok: false,
        json: async () => ({}),
      });

      await expect(
        submitTripReview(
          {
            tripId: 'trip-1',
            title: 'Wonderful trip',
            rating: 5,
            comment: 'Great quality.',
            publishWithDisplayName: true,
          },
          { allowDemo: false }
        )
      ).rejects.toMatchObject({
        message: tripReviewEn.errors.systemError,
        statusCode: 502,
        details: expect.objectContaining({ errorCode: 'MSG127' }),
      });

      global.fetch = vi.fn().mockResolvedValue({
        status: 503,
        ok: false,
        json: async () => ({}),
      });

      await expect(
        submitTripReview(
          {
            tripId: 'trip-1',
            title: 'Wonderful trip',
            rating: 5,
            comment: 'Great quality.',
            publishWithDisplayName: true,
          },
          { allowDemo: false }
        )
      ).rejects.toMatchObject({
        message: tripReviewEn.errors.systemError,
        statusCode: 503,
        details: expect.objectContaining({ errorCode: 'MSG127' }),
      });

      global.fetch = vi.fn().mockRejectedValue(new Error('Connection failed'));

      await expect(
        submitTripReview(
          {
            tripId: 'trip-1',
            title: 'Wonderful trip',
            rating: 5,
            comment: 'Great quality.',
            publishWithDisplayName: true,
          },
          { allowDemo: false }
        )
      ).rejects.toMatchObject({
        message: tripReviewEn.errors.systemError,
        statusCode: 0,
        details: { errorCode: 'MSG127' },
      });

      const abortErr = new Error('Timed out');
      abortErr.name = 'AbortError';
      global.fetch = vi.fn().mockRejectedValue(abortErr);

      await expect(
        submitTripReview(
          {
            tripId: 'trip-1',
            title: 'Wonderful trip',
            rating: 5,
            comment: 'Great quality.',
            publishWithDisplayName: true,
          },
          { allowDemo: false }
        )
      ).rejects.toMatchObject({
        message: tripReviewEn.errors.systemError,
        statusCode: 0,
        details: { errorCode: 'MSG127' },
      });
    });

    it('standardizes HTTP 500 with ProblemDetails title to systemError and does NOT leak raw server title or raw MSG codes', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        status: 500,
        ok: false,
        json: async () => ({ title: 'Internal Server Error' }),
      });

      try {
        await submitTripReview(
          {
            tripId: 'trip-1',
            title: 'Wonderful trip',
            rating: 5,
            comment: 'Great quality.',
            publishWithDisplayName: true,
          },
          { allowDemo: false }
        );
        expect.fail('Should have thrown ReviewApiError');
      } catch (err: unknown) {
        expect((err as Error).message).not.toContain('Internal Server Error');
        expect((err as Error).message).toBe(tripReviewEn.errors.systemError);
        expect((err as Error).message).not.toMatch(/MSG\d+/);
      }
    });

    it('standardizes HTTP 503 with arbitrary ProblemDetails title to systemError', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        status: 503,
        ok: false,
        json: async () => ({ title: 'Service Unavailable', detail: 'Database unreachable' }),
      });

      try {
        await submitTripReview(
          {
            tripId: 'trip-1',
            title: 'Wonderful trip',
            rating: 5,
            comment: 'Great quality.',
            publishWithDisplayName: true,
          },
          { allowDemo: false }
        );
        expect.fail('Should have thrown ReviewApiError');
      } catch (err: unknown) {
        expect((err as Error).message).not.toContain('Service Unavailable');
        expect((err as Error).message).toBe(tripReviewEn.errors.systemError);
      }
    });

    it('returns English production submitSuccess message on 200/201 response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        status: 201,
        ok: true,
        json: async () => ({ reviewId: 'rev-prod-101' }),
      });

      const result = await submitTripReview(
        {
          tripId: 'trip-1',
          title: 'Wonderful trip',
          rating: 5,
          comment: 'Great quality.',
          publishWithDisplayName: true,
        },
        { allowDemo: false }
      );

      expect(result).toEqual({
        status: 'SUCCESS',
        message: tripReviewEn.tripReview.submitSuccess,
        reviewId: 'rev-prod-101',
      });
    });
  });

  describe('Demo Mode (REVIEW-9)', () => {
    beforeEach(() => {
      setNodeEnv('test');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
    });

    it('REVIEW-9: Returns SUCCESS with isDemo: true and English demoSubmitSuccess in demo mode', async () => {
      const result = await submitTripReview(
        {
          tripId: 'trip-demo-01',
          title: 'Satisfied',
          rating: 5,
          comment: 'Wonderful trip, great service and on-time schedule.',
          publishWithDisplayName: true,
        },
        { allowDemo: true }
      );

      expect(result.status).toBe('SUCCESS');
      expect(result.isDemo).toBe(true);
      expect(result.reviewId).toBeDefined();
      expect(result.message).toBe(tripReviewEn.tripReview.demoSubmitSuccess);
      expect(result.message).toContain('DEMO Preview');
    });
  });
});
