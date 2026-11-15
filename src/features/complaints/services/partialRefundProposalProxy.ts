import "server-only";

import { bookingAccessToken } from "@/features/bookings/services/bookingBffAuth";
import { fetchBackend } from "@/lib/server/backend";

import { PARTIAL_REFUND_ERROR_CODES as CODES } from "../resources/partialRefundMessages";

const BACKEND_CODES = new Set<string>([
  CODES.notFound,
  CODES.forbidden,
  CODES.responseClosed,
]);

function json(body: unknown, status: number): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

function isValidComplaintId(complaintId: string): boolean {
  return /^[1-9]\d*$/.test(complaintId) && Number.isSafeInteger(Number(complaintId));
}

function backendPath(complaintId: string, suffix = ""): string {
  return `/api/v1/traveler/complaints/${encodeURIComponent(complaintId)}/partial-refund-proposal${suffix}`;
}

type Authorized = { token: string };

async function authorize(signal: AbortSignal): Promise<Authorized | Response> {
  const auth = await bookingAccessToken(signal);
  if (!("status" in auth)) return auth;
  const errorCode =
    auth.status === 401
      ? CODES.unauthenticated
      : auth.status === 403
        ? CODES.forbidden
        : CODES.unavailable;
  return json({ errorCode }, auth.status);
}

async function backendFailure(response: Response): Promise<Response> {
  const body: unknown = await response.json().catch(() => null);
  const errorCode =
    body && typeof body === "object" && "errorCode" in body ? body.errorCode : null;
  if (typeof errorCode === "string" && BACKEND_CODES.has(errorCode) && response.status < 500) {
    return json({ errorCode }, response.status);
  }
  // A role-only 403 (for example a Tour Operator session) carries no errorCode: still MSG126.
  if (response.status === 403) return json({ errorCode: CODES.forbidden }, 403);
  if (response.status === 401) return json({ errorCode: CODES.unauthenticated }, 401);
  if (response.status === 404) return json({ errorCode: CODES.notFound }, 404);
  return json({ errorCode: CODES.unavailable }, 503);
}

async function forward(
  request: Request,
  token: string,
  path: string,
  init: { method: "GET" } | { method: "POST"; body: string },
): Promise<Response> {
  let response: Response;
  try {
    response = await fetchBackend(path, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(init.method === "POST" ? { "Content-Type": "application/json" } : {}),
      },
      signal: request.signal,
    });
  } catch {
    return json({ errorCode: CODES.unavailable }, 503);
  }
  if (!response.ok) return backendFailure(response);

  const payload: unknown = await response.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return json({ errorCode: CODES.unavailable }, 503);
  }
  const data = "data" in payload ? (payload as { data: unknown }).data : payload;
  return json(data, 200);
}

/** BFF boundary for UC-75 step 2: the Traveler views the proposed amount and the deadline. */
export async function proxyGetPartialRefundProposal(
  request: Request,
  complaintId: string,
): Promise<Response> {
  if (!isValidComplaintId(complaintId)) return json({ errorCode: CODES.notFound }, 404);

  const auth = await authorize(request.signal);
  if (auth instanceof Response) return auth;

  return forward(request, auth.token, backendPath(complaintId), { method: "GET" });
}

/** BFF boundary for UC-75 step 4: the Traveler accepts or declines (no other option exists). */
export async function proxyRespondToPartialRefundProposal(
  request: Request,
  complaintId: string,
): Promise<Response> {
  if (!isValidComplaintId(complaintId)) return json({ errorCode: CODES.notFound }, 404);

  const incoming: unknown = await request.json().catch(() => null);
  const decision =
    incoming && typeof incoming === "object" && "decision" in incoming
      ? incoming.decision
      : undefined;
  if (decision !== "Accept" && decision !== "Decline") {
    return json({ errorCode: CODES.invalidDecision }, 400);
  }

  const auth = await authorize(request.signal);
  if (auth instanceof Response) return auth;

  return forward(request, auth.token, backendPath(complaintId, "/response"), {
    method: "POST",
    body: JSON.stringify({ decision }),
  });
}
