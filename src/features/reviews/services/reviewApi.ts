import type { CreateReviewPayload, ReviewSubmissionResult } from '../types/review';
import { ReviewApiError } from '../types/review';

/**
 * Production gate for review demo fixtures.
 * Strictly requires non-production environment AND explicit NEXT_PUBLIC_ENABLE_DEMO_FIXTURES === 'true'.
 * Production environment ALWAYS wins (returns false).
 */
export function isReviewDemoAllowedInCurrentEnv(): boolean {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES === 'true'
  );
}

export interface SubmitReviewOptions {
  allowDemo?: boolean;
}

export async function submitTripReview(
  payload: CreateReviewPayload,
  options?: SubmitReviewOptions
): Promise<ReviewSubmissionResult> {
  // Validate basic constraints before network
  if (!payload.rating || payload.rating < 1 || payload.rating > 5) {
    throw new ReviewApiError('Vui lòng chọn số sao đánh giá (1-5 sao).', 400);
  }

  const commentTrimmed = payload.comment.trim();
  if (commentTrimmed.length < 20) {
    throw new ReviewApiError('Nội dung đánh giá phải có ít nhất 20 ký tự.', 400);
  }

  if (commentTrimmed.length > 500) {
    throw new ReviewApiError('Nội dung đánh giá không được vượt quá 500 ký tự.', 400);
  }

  const allowDemo = Boolean(options?.allowDemo) && isReviewDemoAllowedInCurrentEnv();

  // DEMO MODE: simulated review publication
  if (allowDemo) {
    return {
      status: 'SUCCESS',
      message: 'Cảm ơn bạn đã phản hồi! Đánh giá của bạn đã được xuất bản (Bản xem trước DEMO).',
      reviewId: `rev-demo-${Date.now()}`,
      isDemo: true,
    };
  }

  // REAL PRODUCTION MODE: Call live Backend
  try {
    const response = await fetch('/api/v1/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        tripId: payload.tripId,
        bookingId: payload.bookingId,
        rating: payload.rating,
        comment: commentTrimmed,
        publishWithDisplayName: payload.publishWithDisplayName,
      }),
    });

    if (response.status === 404 || response.status === 501 || response.status === 502 || response.status === 503) {
      // Truthful pending backend capability notification
      return {
        status: 'PENDING_BE_INTEGRATION',
        message: 'Tính năng gửi đánh giá đang chờ kích hoạt API máy chủ (Capstone_BE). Đánh giá chưa thể lưu vào cơ sở dữ liệu sản phẩm.',
      };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const msg = errorData?.title || 'Không thể gửi đánh giá đến máy chủ.';
      throw new ReviewApiError(msg, response.status, errorData);
    }

    const data = await response.json();
    return {
      status: 'SUCCESS',
      message: 'Cảm ơn bạn đã phản hồi! Đánh giá của bạn đã được xuất bản.',
      reviewId: data.reviewId || data.id,
    };
  } catch (err) {
    if (err instanceof ReviewApiError) {
      throw err;
    }
    // Truthful fallback when endpoint does not exist
    return {
      status: 'PENDING_BE_INTEGRATION',
      message: 'Tính năng gửi đánh giá đang chờ kích hoạt API máy chủ (Capstone_BE). Đánh giá chưa thể lưu vào cơ sở dữ liệu sản phẩm.',
    };
  }
}
