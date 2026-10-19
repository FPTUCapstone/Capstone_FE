import 'server-only';

import { tripReviewEn } from '../resources/en';

const PROBLEM_JSON_CONTENT_TYPE = 'application/problem+json; charset=utf-8';

export const PENDING_BE_INTEGRATION_ERROR_CODE = 'PENDING_BE_INTEGRATION';

function problemJsonResponse(
  status: number,
  title: string,
  detail: string,
  errorCode?: string
): Response {
  return new Response(
    JSON.stringify({
      type:
        status === 400
          ? 'https://tools.ietf.org/html/rfc9110#section-15.5.1'
          : 'https://tools.ietf.org/html/rfc9110#section-15.6.2',
      title,
      status,
      detail,
      ...(errorCode ? { errorCode } : {}),
    }),
    {
      status,
      headers: {
        'Content-Type': PROBLEM_JSON_CONTENT_TYPE,
        'Cache-Control': 'no-store',
      },
    }
  );
}

/**
 * Rejects empty, dot-segment, or slash-injected path parameters before handling BFF requests.
 */
export function validateSafeTripIdSegment(rawId: string): string | null {
  const trimmed = rawId.trim();
  if (
    !trimmed ||
    trimmed === '.' ||
    trimmed === '..' ||
    trimmed.includes('/') ||
    trimmed.includes('\\')
  ) {
    return null;
  }
  return trimmed;
}

/**
 * Frontend capability placeholder BFF handler for GET /api/v1/traveler/trips (UC-32).
 * Current Capstone_BE develop does not implement this provisional endpoint (NO_BACKEND),
 * so this handler fails closed with explicit 501 PENDING_BE_INTEGRATION without speculative upstream calls.
 */
export async function handleTravelerTripListBffRequest(_request: Request): Promise<Response> {
  void _request;
  return problemJsonResponse(
    501,
    tripReviewEn.bff.notImplementedTitle,
    tripReviewEn.bff.tripHistoryPendingDetail,
    PENDING_BE_INTEGRATION_ERROR_CODE
  );
}

/**
 * Frontend capability placeholder BFF handler for GET /api/v1/traveler/trips/[tripId] (UC-32 / UC-33).
 * Validates tripId segment and fails closed with explicit 501 PENDING_BE_INTEGRATION while Backend is NO_BACKEND.
 */
export async function handleTravelerTripDetailBffRequest(
  _request: Request,
  rawTripId: string
): Promise<Response> {
  void _request;
  const safeTripId = validateSafeTripIdSegment(rawTripId);
  if (!safeTripId) {
    return problemJsonResponse(
      400,
      tripReviewEn.bff.badRequestTitle,
      tripReviewEn.bff.invalidTripIdDetail,
      'INVALID_TRIP_ID'
    );
  }

  return problemJsonResponse(
    501,
    tripReviewEn.bff.notImplementedTitle,
    tripReviewEn.bff.tripHistoryPendingDetail,
    PENDING_BE_INTEGRATION_ERROR_CODE
  );
}

/**
 * Frontend capability placeholder BFF handler for POST /api/v1/reviews (UC-33).
 * Current Capstone_BE develop does not implement this provisional endpoint (NO_BACKEND),
 * so this handler fails closed with explicit 501 PENDING_BE_INTEGRATION without speculative upstream calls.
 */
export async function handleTravelerReviewCreateBffRequest(_request: Request): Promise<Response> {
  void _request;
  return problemJsonResponse(
    501,
    tripReviewEn.bff.notImplementedTitle,
    tripReviewEn.bff.tripReviewPendingDetail,
    PENDING_BE_INTEGRATION_ERROR_CODE
  );
}
