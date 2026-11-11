import "server-only";

import { fetchBackend } from "@/lib/server/backend";

import { bookingAccessToken } from "./bookingBffAuth";

const CANCELLATION_ERROR_CODES = new Set([
  "booking.cancellation.confirmation_required",
  "booking.cancellation.reason_required",
  "booking.cancellation.window_closed",
  "booking.cancellation.forbidden",
  "booking.cancellation.unauthorized",
  "booking.cancellation.invalid_state",
  "booking.cancellation.payment_not_refundable",
  "booking.cancellation.idempotency_payload_mismatch",
  "booking.cancellation.concurrent_retry_exhausted",
  "booking.not_found",
]);

const IDEMPOTENCY_KEY_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(body: unknown, status: number): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

function isValidBookingId(bookingId: string): boolean {
  return /^[1-9]\d*$/.test(bookingId) && Number.isSafeInteger(Number(bookingId));
}

async function backendFailure(response: Response): Promise<Response> {
  const body: unknown = await response.json().catch(() => null);
  const errorCode =
    body && typeof body === "object" && "errorCode" in body
      ? body.errorCode
      : null;
  if (
    typeof errorCode === "string" &&
    CANCELLATION_ERROR_CODES.has(errorCode) &&
    response.status >= 400 &&
    response.status < 500
  ) {
    return json({ errorCode }, response.status);
  }
  return json({ errorCode: "CANCELLATION_UNAVAILABLE" }, 503);
}

/** BFF boundary for UC-41: a Traveler or Tour Operator cancels a booking. */
export async function proxyPostBookingCancellation(
  request: Request,
  bookingId: string,
): Promise<Response> {
  if (!isValidBookingId(bookingId)) {
    return json({ errorCode: "booking.not_found" }, 404);
  }

  const idempotencyKey = request.headers.get("Idempotency-Key") ?? "";
  if (!IDEMPOTENCY_KEY_PATTERN.test(idempotencyKey)) {
    return json({ errorCode: "INVALID_IDEMPOTENCY_KEY" }, 400);
  }

  const auth = await bookingAccessToken(request.signal);
  if ("status" in auth) {
    return json(
      {
        errorCode:
          auth.status === 403
            ? "FORBIDDEN"
            : auth.status === 401
              ? "UNAUTHENTICATED"
              : "CANCELLATION_UNAVAILABLE",
      },
      auth.status,
    );
  }

  const incoming: unknown = await request.json().catch(() => ({}));
  const source = incoming && typeof incoming === "object" ? incoming : {};
  const body = {
    reasonCategory: "reasonCategory" in source ? source.reasonCategory : undefined,
    reasonDetail: "reasonDetail" in source ? source.reasonDetail : undefined,
    confirmed: source && "confirmed" in source && source.confirmed === true,
  };

  let response: Response;
  try {
    response = await fetchBackend(
      `/api/v1/bookings/${encodeURIComponent(bookingId)}/cancellation`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify(body),
        signal: request.signal,
      },
    );
  } catch {
    return json({ errorCode: "CANCELLATION_UNAVAILABLE" }, 503);
  }

  if (!response.ok) return backendFailure(response);
  const payload: unknown = await response.json().catch(() => null);
  const data =
    payload && typeof payload === "object" && "data" in payload
      ? (payload as { data: unknown }).data
      : payload;
  return json(data, 200);
}

/** BFF boundary for the UC-41 cancellation preview shown before the traveler confirms. */
export async function proxyGetBookingCancellationPreview(
  request: Request,
  bookingId: string,
): Promise<Response> {
  if (!isValidBookingId(bookingId)) {
    return json({ errorCode: "booking.not_found" }, 404);
  }

  const auth = await bookingAccessToken(request.signal);
  if ("status" in auth) {
    return json(
      {
        errorCode:
          auth.status === 403
            ? "FORBIDDEN"
            : auth.status === 401
              ? "UNAUTHENTICATED"
              : "CANCELLATION_UNAVAILABLE",
      },
      auth.status,
    );
  }

  let response: Response;
  try {
    response = await fetchBackend(
      `/api/v1/bookings/${encodeURIComponent(bookingId)}/cancellation-preview`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          Accept: "application/json",
        },
        signal: request.signal,
      },
    );
  } catch {
    return json({ errorCode: "CANCELLATION_UNAVAILABLE" }, 503);
  }

  if (!response.ok) return backendFailure(response);
  const payload: unknown = await response.json().catch(() => null);
  const data =
    payload && typeof payload === "object" && "data" in payload
      ? (payload as { data: unknown }).data
      : payload;
  return json(data, 200);
}
