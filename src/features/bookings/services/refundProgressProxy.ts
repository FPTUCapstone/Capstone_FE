import "server-only";

import { fetchBackend } from "@/lib/server/backend";

import { bookingAccessToken } from "./bookingBffAuth";

function json(body: unknown, status: number): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

/** BFF boundary for the UC-42 refund-progress read model of a traveler or operator. */
export async function proxyGetBookingRefundProgress(
  request: Request,
  bookingId: string,
): Promise<Response> {
  if (
    !/^[1-9]\d*$/.test(bookingId) ||
    !Number.isSafeInteger(Number(bookingId))
  ) {
    return json({ errorCode: "REFUND_NOT_FOUND" }, 404);
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
              : "REFUND_UNAVAILABLE",
      },
      auth.status,
    );
  }

  let response: Response;
  try {
    response = await fetchBackend(
      `/api/v1/bookings/${encodeURIComponent(bookingId)}/refund`,
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
    return json({ errorCode: "REFUND_UNAVAILABLE" }, 503);
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const status =
      response.status === 401 ||
      response.status === 403 ||
      response.status === 404
        ? response.status
        : 503;
    return json(
      {
        errorCode:
          status === 404
            ? "REFUND_NOT_FOUND"
            : status === 403
              ? "FORBIDDEN"
              : status === 401
                ? "UNAUTHENTICATED"
                : "REFUND_UNAVAILABLE",
      },
      status,
    );
  }

  const payload =
    body && typeof body === "object" && "data" in body
      ? (body as { data: unknown }).data
      : body;
  return json(payload, 200);
}
