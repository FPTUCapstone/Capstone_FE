import "server-only";

import { fetchBackend } from "@/lib/server/backend";
import { isSameOriginRequest } from "@/lib/server/adminSession";

import { bookingAccessToken } from "./bookingBffAuth";

function json(body: unknown, status: number): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

function isSafeId(s: string): boolean {
  return /^[1-9]\d*$/.test(s) && Number.isSafeInteger(Number(s));
}

function isSameOrigin(request: Request): boolean {
  return isSameOriginRequest(request);
}

async function requireTravelerToken(
  request: Request,
): Promise<{ token: string } | Response> {
  const auth = await bookingAccessToken(request.signal);
  if ("status" in auth) {
    return json(
      {
        errorCode:
          auth.status === 403
            ? "FORBIDDEN"
            : auth.status === 401
              ? "UNAUTHENTICATED"
              : "SERVICE_UNAVAILABLE",
      },
      auth.status,
    );
  }
  return { token: auth.token };
}

/** GET /api/v1/traveler/direct-refunds/by-booking/{bookingId}
 * Returns { caseId } if a direct refund case exists for the booking. 404 if not.
 */
export async function proxyGetDirectRefundCaseByBooking(
  request: Request,
  bookingId: string,
): Promise<Response> {
  if (!isSafeId(bookingId)) return json({ errorCode: "NOT_FOUND" }, 404);

  const auth = await requireTravelerToken(request);
  if (auth instanceof Response) return auth;

  let response: Response;
  try {
    response = await fetchBackend(
      `/api/v1/traveler/direct-refunds/by-booking/${encodeURIComponent(bookingId)}`,
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
    return json({ errorCode: "SERVICE_UNAVAILABLE" }, 503);
  }

  const body: unknown = await response.json().catch(() => null);
  if (body === null) return json({ errorCode: "SERVICE_UNAVAILABLE" }, 502);
  return json(body, response.status);
}

/** GET /api/v1/traveler/direct-refunds/{caseId}
 * Returns DirectRefundCaseEnvelope { serverNowUtc, case }.
 */
export async function proxyGetDirectRefundCase(
  request: Request,
  caseId: string,
): Promise<Response> {
  if (!isSafeId(caseId)) return json({ errorCode: "NOT_FOUND" }, 404);

  const auth = await requireTravelerToken(request);
  if (auth instanceof Response) return auth;

  let response: Response;
  try {
    response = await fetchBackend(
      `/api/v1/traveler/direct-refunds/${encodeURIComponent(caseId)}`,
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
    return json({ errorCode: "SERVICE_UNAVAILABLE" }, 503);
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const mapped =
      response.status === 404
        ? 404
        : response.status === 403
          ? 403
          : response.status === 401
            ? 401
            : 503;
    return json(
      { errorCode: mapped === 404 ? "NOT_FOUND" : mapped === 403 ? "FORBIDDEN" : mapped === 401 ? "UNAUTHENTICATED" : "SERVICE_UNAVAILABLE" },
      mapped,
    );
  }

  // Use the same business clock as refund deadlines, including Development time overrides.
  const backendNow = response.headers.get('X-TripMate-Server-Time');
  const serverNow = backendNow ? new Date(backendNow) : new Date();
  if (!Number.isFinite(serverNow.getTime())) return json({ errorCode: 'SERVICE_UNAVAILABLE' }, 503);
  const inner =
    body && typeof body === "object" && "data" in body
      ? (body as { data: unknown }).data
      : body;
  return json({ serverNowUtc: serverNow.toISOString(), case: inner }, 200);
}

/** PUT /api/v1/traveler/direct-refunds/{caseId}/recipient
 * Body: { bankCode, accountNumber, accountHolder, expectedVersion }
 */
export async function proxyConfirmDirectRefundRecipient(
  request: Request,
  caseId: string,
): Promise<Response> {
  if (!isSafeId(caseId)) return json({ errorCode: "NOT_FOUND" }, 404);
  if (!isSameOrigin(request)) return json({ errorCode: "FORBIDDEN" }, 403);

  const auth = await requireTravelerToken(request);
  if (auth instanceof Response) return auth;

  let reqBody: unknown;
  try {
    reqBody = await request.json();
  } catch {
    return json({ errorCode: "INVALID_REQUEST" }, 400);
  }

  let response: Response;
  try {
    response = await fetchBackend(
      `/api/v1/traveler/direct-refunds/${encodeURIComponent(caseId)}/recipient`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(reqBody),
        signal: request.signal,
      },
    );
  } catch {
    return json({ errorCode: "SERVICE_UNAVAILABLE" }, 503);
  }

  if (response.status === 409) {
    const conflict: unknown = await response.json().catch(() => null);
    return json(conflict ?? { errorCode: "VERSION_CONFLICT" }, 409);
  }
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const status = [400, 401, 403, 404, 422].includes(response.status)
      ? response.status
      : 503;
    return json(body ?? { errorCode: "SERVICE_UNAVAILABLE" }, status);
  }

  const body: unknown = await response.json().catch(() => null);
  return json(body, 200);
}

/** POST /api/v1/traveler/direct-refunds/{caseId}/response
 * Body: { transferId, responseType, receivedAmountVnd?, note?, expectedVersion }
 */
export async function proxyRespondToDirectRefundTransfer(
  request: Request,
  caseId: string,
): Promise<Response> {
  if (!isSafeId(caseId)) return json({ errorCode: "NOT_FOUND" }, 404);
  if (!isSameOrigin(request)) return json({ errorCode: "FORBIDDEN" }, 403);

  const auth = await requireTravelerToken(request);
  if (auth instanceof Response) return auth;

  let reqBody: unknown;
  try {
    reqBody = await request.json();
  } catch {
    return json({ errorCode: "INVALID_REQUEST" }, 400);
  }

  let response: Response;
  try {
    response = await fetchBackend(
      `/api/v1/traveler/direct-refunds/${encodeURIComponent(caseId)}/response`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${auth.token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(reqBody),
        signal: request.signal,
      },
    );
  } catch {
    return json({ errorCode: "SERVICE_UNAVAILABLE" }, 503);
  }

  if (response.status === 409) {
    const conflict: unknown = await response.json().catch(() => null);
    return json(conflict ?? { errorCode: "VERSION_CONFLICT" }, 409);
  }
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const status = [400, 401, 403, 404, 422].includes(response.status)
      ? response.status
      : 503;
    return json(body ?? { errorCode: "SERVICE_UNAVAILABLE" }, status);
  }

  const body: unknown = await response.json().catch(() => null);
  return json(body, 200);
}
