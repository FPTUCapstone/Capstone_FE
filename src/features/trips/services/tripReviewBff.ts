import 'server-only';

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
 * Verified Next.js BFF handler for GET /api/v1/traveler/trips (UC-32).
 * Capstone_BE develop is verified NO_BACKEND for traveler trip history,
 * so the BFF explicitly reports 501 PENDING_BE_INTEGRATION rather than falling through to a generic Next 404.
 */
export async function handleTravelerTripListBffRequest(_request: Request): Promise<Response> {
  void _request;
  return problemJsonResponse(
    501,
    'Not Implemented',
    'Hệ thống lịch sử chuyến đi đang chờ kích hoạt dịch vụ máy chủ.',
    PENDING_BE_INTEGRATION_ERROR_CODE
  );
}

/**
 * Verified Next.js BFF handler for GET /api/v1/traveler/trips/[tripId] (UC-32 / UC-33).
 * Validates tripId segment and explicitly reports 501 PENDING_BE_INTEGRATION in NO_BACKEND mode.
 */
export async function handleTravelerTripDetailBffRequest(
  _request: Request,
  rawTripId: string
): Promise<Response> {
  void _request;
  const safeTripId = validateSafeTripIdSegment(rawTripId);
  if (!safeTripId) {
    return problemJsonResponse(400, 'Bad Request', 'Invalid trip identifier.', 'INVALID_TRIP_ID');
  }

  return problemJsonResponse(
    501,
    'Not Implemented',
    'Hệ thống lịch sử chuyến đi đang chờ kích hoạt dịch vụ máy chủ.',
    PENDING_BE_INTEGRATION_ERROR_CODE
  );
}

/**
 * Verified Next.js BFF handler for POST /api/v1/reviews (UC-33).
 * Capstone_BE develop is verified NO_BACKEND for traveler review submission,
 * so the BFF explicitly reports 501 PENDING_BE_INTEGRATION rather than falling through to a generic Next 404.
 */
export async function handleTravelerReviewCreateBffRequest(_request: Request): Promise<Response> {
  void _request;
  return problemJsonResponse(
    501,
    'Not Implemented',
    'Tính năng gửi đánh giá đang chờ kích hoạt API máy chủ (Capstone_BE). Đánh giá chưa thể lưu vào cơ sở dữ liệu sản phẩm.',
    PENDING_BE_INTEGRATION_ERROR_CODE
  );
}
