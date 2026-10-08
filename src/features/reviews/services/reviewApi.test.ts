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
          comment: 'Một chuyến đi rất thú vị và bổ ích.',
          publishWithDisplayName: true,
        })
      ).rejects.toThrow(/Tiêu đề đánh giá là bắt buộc/i);
    });

    it('REVIEW-4: Rejects submission if rating is missing or invalid (0 or >5)', async () => {
      await expect(
        submitTripReview({
          tripId: 'trip-1',
          title: 'Chuyến đi tuyệt vời',
          rating: 0,
          comment: 'Một chuyến đi rất thú vị và bổ ích.',
          publishWithDisplayName: true,
        })
      ).rejects.toThrow(/Vui lòng chọn số sao đánh giá/i);

      await expect(
        submitTripReview({
          tripId: 'trip-1',
          title: 'Chuyến đi tuyệt vời',
          rating: 6,
          comment: 'Một chuyến đi rất thú vị và bổ ích.',
          publishWithDisplayName: true,
        })
      ).rejects.toThrow(/Vui lòng chọn số sao đánh giá/i);
    });

    it('Accepts valid short comment (1-500 chars per SRS §3.7.2, removing invented 20-char limit)', async () => {
      setNodeEnv('test');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';

      const result = await submitTripReview(
        {
          tripId: 'trip-demo-01',
          title: 'Rất tốt',
          rating: 5,
          comment: 'Tuyệt vời!', // 10 chars
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
          title: 'Chuyến đi',
          rating: 5,
          comment: '   ',
          publishWithDisplayName: true,
        })
      ).rejects.toThrow(/Nội dung đánh giá là bắt buộc/i);
    });

    it('REVIEW-6: Rejects submission if comment exceeds 500 characters', async () => {
      const longComment = 'A'.repeat(501);
      await expect(
        submitTripReview({
          tripId: 'trip-1',
          title: 'Tiêu đề',
          rating: 5,
          comment: longComment,
          publishWithDisplayName: true,
        })
      ).rejects.toThrow(/không được vượt quá 500 ký tự/i);
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
          detail: tripReviewEn.bff.tripReviewPendingDetail,
        }),
      });

      const result501 = await submitTripReview(
        {
          tripId: 'trip-1',
          title: 'Chuyến đi tuyệt vời',
          rating: 5,
          comment: 'Chuyến đi tuyệt vời, chất lượng dịch vụ rất tốt và đúng giờ.',
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
            title: 'Chuyến đi tuyệt vời',
            rating: 5,
            comment: 'Chất lượng rất tốt.',
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

    it('does NOT misclassify 404 as PENDING_BE_INTEGRATION; throws ReviewApiError (404 TRIP_NOT_FOUND)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        status: 404,
        ok: false,
        json: async () => null,
      });

      await expect(
        submitTripReview(
          {
            tripId: 'trip-missing',
            title: 'Chuyến đi tuyệt vời',
            rating: 5,
            comment: 'Chất lượng rất tốt.',
            publishWithDisplayName: true,
          },
          { allowDemo: false }
        )
      ).rejects.toMatchObject({
        name: 'ReviewApiError',
        statusCode: 404,
        message: tripReviewEn.errors.reviewTripNotFound,
        details: expect.objectContaining({ errorCode: 'TRIP_NOT_FOUND' }),
      });
    });

    it('differentiates 401 and 403 authorization errors from 501 and 5xx', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        status: 401,
        ok: false,
        json: async () => ({}),
      });

      await expect(
        submitTripReview(
          {
            tripId: 'trip-1',
            title: 'Chuyến đi tuyệt vời',
            rating: 5,
            comment: 'Chất lượng rất tốt.',
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
            title: 'Chuyến đi tuyệt vời',
            rating: 5,
            comment: 'Chất lượng rất tốt.',
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
            title: 'Chuyến đi tuyệt vời',
            rating: 5,
            comment: 'Chất lượng rất tốt.',
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
            title: 'Chuyến đi tuyệt vời',
            rating: 5,
            comment: 'Chất lượng rất tốt.',
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
            title: 'Chuyến đi tuyệt vời',
            rating: 5,
            comment: 'Chất lượng rất tốt.',
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
            title: 'Chuyến đi tuyệt vời',
            rating: 5,
            comment: 'Chất lượng rất tốt.',
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
            title: 'Chuyến đi tuyệt vời',
            rating: 5,
            comment: 'Chất lượng rất tốt.',
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
            title: 'Chuyến đi tuyệt vời',
            rating: 5,
            comment: 'Chất lượng rất tốt.',
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
  });

  describe('Demo Mode (REVIEW-9)', () => {
    beforeEach(() => {
      setNodeEnv('test');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
    });

    it('REVIEW-9: Returns SUCCESS with isDemo: true in demo mode', async () => {
      const result = await submitTripReview(
        {
          tripId: 'trip-demo-01',
          title: 'Hài lòng',
          rating: 5,
          comment: 'Chuyến đi tuyệt vời, chất lượng dịch vụ rất tốt và đúng giờ.',
          publishWithDisplayName: true,
        },
        { allowDemo: true }
      );

      expect(result.status).toBe('SUCCESS');
      expect(result.isDemo).toBe(true);
      expect(result.reviewId).toBeDefined();
      expect(result.message).toContain('Bản xem trước DEMO');
    });
  });
});
