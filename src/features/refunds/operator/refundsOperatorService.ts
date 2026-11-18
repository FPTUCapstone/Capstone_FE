import {
  parseOperatorRefundListResponse,
  parseRefundDetail,
  type OperatorRefundListResponse,
  type RefundDetail,
} from '../types/refundLifecycle';

/** Thrown on a non-ok response or a network/abort failure; `status` is 0 for a network-level
 * failure (no HTTP response at all). Kept as its own class (not shared with the admin side's
 * equivalent) — same reasoning as `OperatorPayoutSettlementsError`. */
export class RefundsOperatorError extends Error {
  constructor(
    public readonly status: number,
    public readonly errorCode: string | undefined,
    title: string,
  ) {
    super(title);
    this.name = 'RefundsOperatorError';
  }
}

function problemOf(body: unknown, fallback: string): { title: string; errorCode?: string } {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return { title: fallback };
  const record = body as Record<string, unknown>;
  const title = typeof record.title === 'string' ? record.title : fallback;
  const errorCode = typeof record.errorCode === 'string' ? record.errorCode : undefined;
  return errorCode ? { title, errorCode } : { title };
}

async function request(path: string, init: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(path, { credentials: 'same-origin', headers: { Accept: 'application/json' }, ...init });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new RefundsOperatorError(0, undefined, 'The refund service could not be reached.');
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const problem = problemOf(body, 'The refund request could not be processed.');
    throw new RefundsOperatorError(response.status, problem.errorCode, problem.title);
  }
  return body;
}

/** The signed-in Tour Operator's own refund requests, newest first. */
export async function fetchOperatorRefunds(
  pageNumber: number,
  pageSize: number,
  signal?: AbortSignal,
): Promise<OperatorRefundListResponse> {
  const query = new URLSearchParams({ pageNumber: String(pageNumber), pageSize: String(pageSize) });
  const body = await request(`/api/operator/refunds?${query}`, { method: 'GET', signal, cache: 'no-store' });
  return parseOperatorRefundListResponse(body);
}

/** Malformed bodies are never treated as success: a 200 whose body does not match the strict
 * shape throws from `parseRefundDetail`, same as a non-ok status. */
export async function fetchOperatorRefundDetail(refundId: number, signal?: AbortSignal): Promise<RefundDetail> {
  const body = await request(`/api/operator/refunds/${refundId}`, { method: 'GET', signal, cache: 'no-store' });
  return parseRefundDetail(body);
}

/** UC-42: the operator confirms the refund before any return transfer can be requested. */
export async function confirmOperatorRefund(refundId: number, signal?: AbortSignal): Promise<void> {
  await request(`/api/operator/refunds/${refundId}/confirm`, { method: 'POST', signal });
}

/** UC-42: reporting a bank transfer is followed by a fresh read of the committed status. */
export async function reportOperatorRefundReturn(refundId: number, returnReference: string, signal?: AbortSignal): Promise<void> {
  await request(`/api/operator/refunds/${refundId}/return`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ returnReference }),
    signal,
  });
}
