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
      type: 'https://tools.ietf.org/html/rfc9110#section-15.6.2',
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
