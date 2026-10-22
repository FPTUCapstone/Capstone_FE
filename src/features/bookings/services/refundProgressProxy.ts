import "server-only";

import { cookies } from "next/headers";

import { fetchBackend } from "@/lib/server/backend";

const REFRESH_COOKIE = "tripmate_refresh";

function json(body: unknown, status: number): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

async function bookingAccessToken(
  signal: AbortSignal,
): Promise<{ token: string } | { status: number }> {
  const refresh = (await cookies()).get(REFRESH_COOKIE)?.value;
  if (!refresh) return { status: 401 };

  const response = await fetchBackend("/api/v1/auth/web/refresh", {
    method: "POST",
    headers: { Cookie: `${REFRESH_COOKIE}=${encodeURIComponent(refresh)}` },
    signal,
  });
  if (!response.ok) return { status: 401 };

  const body: unknown = await response.json().catch(() => null);
  const data =
    body && typeof body === "object" && "data" in body ? body.data : null;
  if (!data || typeof data !== "object" || !("role" in data))
    return { status: 401 };
  if (data.role !== "Traveler" && data.role !== "TourOperator") {
    return { status: 403 };
  }
  if (
    !("accessToken" in data) ||
    typeof data.accessToken !== "string" ||
    !data.accessToken
  ) {
    return { status: 401 };
  }
  return { token: data.accessToken };
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
      { errorCode: auth.status === 403 ? "FORBIDDEN" : "UNAUTHENTICATED" },
      auth.status,
    );
  }

  const response = await fetchBackend(
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
