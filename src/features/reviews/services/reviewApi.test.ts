import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
    it('REVIEW-4: Rejects submission if rating is missing or invalid (0 or >5)', async () => {
      await expect(
        submitTripReview({
          tripId: 'trip-1',
          rating: 0,
          comment: 'Một chuyến đi rất thú vị và bổ ích.',
          publishWithDisplayName: true,
        })
      ).rejects.toThrow(/Vui lòng chọn số sao đánh giá/i);

      await expect(
        submitTripReview({
          tripId: 'trip-1',
          rating: 6,
          comment: 'Một chuyến đi rất thú vị và bổ ích.',
          publishWithDisplayName: true,
        })
      ).rejects.toThrow(/Vui lòng chọn số sao đánh giá/i);
    });

    it('REVIEW-5: Rejects submission if comment is less than 20 characters', async () => {
      await expect(
        submitTripReview({
          tripId: 'trip-1',
          rating: 5,
          comment: 'Ngắn quá', // 8 chars
          publishWithDisplayName: true,
        })
      ).rejects.toThrow(/Nội dung đánh giá phải có ít nhất 20 ký tự/i);
    });

    it('REVIEW-6: Rejects submission if comment exceeds 500 characters', async () => {
      const longComment = 'A'.repeat(501);
      await expect(
        submitTripReview({
          tripId: 'trip-1',
          rating: 5,
          comment: longComment,
          publishWithDisplayName: true,
        })
      ).rejects.toThrow(/không được vượt quá 500 ký tự/i);
    });
  });

  describe('Real mode truthfulness (REVIEW-8)', () => {
    it('REVIEW-8: Production without review API returns PENDING_BE_INTEGRATION and does NOT report fake success', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        status: 404,
        ok: false,
      });

      const result = await submitTripReview(
        {
          tripId: 'trip-1',
          rating: 5,
          comment: 'Chuyến đi tuyệt vời, chất lượng dịch vụ rất tốt và đúng giờ.',
          publishWithDisplayName: true,
        },
        { allowDemo: false }
      );

      expect(result.status).toBe('PENDING_BE_INTEGRATION');
      expect(result.message).toContain('chờ kích hoạt API máy chủ');
      expect(result.reviewId).toBeUndefined();
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
