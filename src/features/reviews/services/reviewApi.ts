import { tripReviewEn } from '@/features/trips/resources/en';
import {
  MSG127_SYSTEM_ERROR,
  PENDING_BE_INTEGRATION_ERROR_CODE,
} from '@/features/trips/services/tripHistoryApi';
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
  // Validate basic constraints before network or demo submission
  if (
    !Number.isInteger(payload.rating) ||
    payload.rating < 1 ||
    payload.rating > 5
  ) {
    throw new ReviewApiError(tripReviewEn.validation.ratingRequired, 400, {
      errorCode: 'MSG66',
    });
  }

  const titleTrimmed = payload.title?.trim() ?? '';
  if (!titleTrimmed) {
    throw new ReviewApiError(tripReviewEn.validation.titleRequired, 400, {
      errorCode: 'MSG01',
    });
  }

  if (titleTrimmed.length > 150) {
    throw new ReviewApiError(tripReviewEn.validation.titleMaxLength, 400, {
      errorCode: 'REVIEW_TITLE_TOO_LONG',
    });
  }

  const commentTrimmed = payload.comment?.trim() ?? '';
  if (!commentTrimmed) {
    throw new ReviewApiError(tripReviewEn.validation.commentRequired, 400, {
      errorCode: 'MSG01',
    });
  }

  if (commentTrimmed.length > 500) {
    throw new ReviewApiError(tripReviewEn.validation.commentMaxLength, 400, {
      errorCode: 'MSG123',
    });
  }

  const allowDemo = Boolean(options?.allowDemo) && isReviewDemoAllowedInCurrentEnv();

  // DEMO MODE: simulated review publication
  if (allowDemo) {
    return {
      status: 'SUCCESS',
      message: tripReviewEn.tripReview.demoSubmitSuccess,
      reviewId: `rev-demo-${Date.now()}`,
      isDemo: true,
    };
  }

  // REAL PRODUCTION MODE: Call verified Next.js BFF route
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
        title: titleTrimmed,
        comment: commentTrimmed,
        publishWithDisplayName: payload.publishWithDisplayName,
      }),
    });

    if (response.status === 501) {
      const pendingPayload = await response.json().catch(() => null);
      if (
        pendingPayload &&
        typeof pendingPayload === 'object' &&
        (pendingPayload as { errorCode?: unknown }).errorCode ===
          PENDING_BE_INTEGRATION_ERROR_CODE
      ) {
        return {
          status: 'PENDING_BE_INTEGRATION',
          message: tripReviewEn.bff.tripReviewPendingDetail,
        };
      }
      throw new ReviewApiError(MSG127_SYSTEM_ERROR, 501, {
        ...(typeof pendingPayload === 'object' ? pendingPayload : {}),
        errorCode: 'MSG127',
      });
    }

    if (response.status === 404) {
      const notFoundData = await response.json().catch(() => null);
      throw new ReviewApiError(
        tripReviewEn.errors.reviewTripNotFound,
        404,
        { ...(typeof notFoundData === 'object' ? notFoundData : {}), errorCode: 'TRIP_NOT_FOUND' }
      );
    }

    if (response.status === 401 || response.status === 403) {
      const authErrorData = await response.json().catch(() => null);
      throw new ReviewApiError(
        tripReviewEn.errors.reviewAccessDenied,
        response.status,
        { ...(typeof authErrorData === 'object' ? authErrorData : {}), errorCode: 'MSG126' }
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      // Always standardize to canonical English system error copy; never expose raw server ProblemDetails
      throw new ReviewApiError(MSG127_SYSTEM_ERROR, response.status, {
        ...(typeof errorData === 'object' ? errorData : {}),
        errorCode: response.status >= 500 && response.status <= 599 ? 'MSG127' : undefined,
      });
    }

    const data = await response.json();
    return {
      status: 'SUCCESS',
      message: tripReviewEn.tripReview.submitSuccess,
      reviewId: data.reviewId || data.id,
    };
  } catch (err) {
    if (err instanceof ReviewApiError) {
      throw err;
    }
    // Network or connection failure (including timeout/AbortError) is an ERROR with MSG127, NOT pending integration
    throw new ReviewApiError(MSG127_SYSTEM_ERROR, 0, { errorCode: 'MSG127' });
  }
}
