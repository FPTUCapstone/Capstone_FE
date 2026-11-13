import { parseRefundListResponse, type RefundListResponse, type RefundStatus } from '../types/refundLifecycle';

/** Thrown on a non-ok response or a network/abort failure — same shape as the operator side's
 * `RefundsOperatorError`, kept as its own class for the same reason `PayoutSettlementsError` and
 * `OperatorPayoutSettlementsError` are separate. */
export class RefundsAdminError extends Error {
  constructor(
    public readonly status: number,
    public readonly errorCode: string | undefined,
    title: string,
  ) {
    super(title);
    this.name = 'RefundsAdminError';
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
    throw new RefundsAdminError(0, undefined, 'The refund service could not be reached.');
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const problem = problemOf(body, 'The refund request could not be processed.');
    throw new RefundsAdminError(response.status, problem.errorCode, problem.title);
  }
  return body;
}

function serializeStatuses(statuses: RefundStatus[]): string {
  const query = new URLSearchParams();
  for (const status of statuses) query.append('status', status);
  const value = query.toString();
  return value ? `?${value}` : '';
}

/** Screen 2 (Staff): `ReturnReported` refunds queued for reconciliation. */
export async function fetchReturnReportedRefunds(signal?: AbortSignal): Promise<RefundListResponse> {
  const body = await request(`/api/admin/refunds${serializeStatuses(['ReturnReported'])}`, { method: 'GET', signal, cache: 'no-store' });
  return parseRefundListResponse(body);
}

/** Screen 3 (Administrator): `Escalated` and `Reconciliation` refunds (Q-FE3). */
export async function fetchEscalatedRefunds(signal?: AbortSignal): Promise<RefundListResponse> {
  const body = await request(`/api/admin/refunds${serializeStatuses(['Escalated', 'Reconciliation'])}`, {
    method: 'GET',
    signal,
    cache: 'no-store',
  });
  return parseRefundListResponse(body);
}

/** Screen 2 [Confirm Receipt]. The backend's acknowledgement is discarded — the caller re-fetches
 * the list to learn the committed state, same discipline as the payout-settlements actions. */
export async function markRefundReturnReceived(refundId: number, signal?: AbortSignal): Promise<void> {
  await request(`/api/admin/refunds/${refundId}/return-received`, { method: 'POST', signal });
}

/** Screen 3's manual-completion flow, reusing the existing `CompleteManualRefund` contract. */
export async function resolveEscalatedRefund(refundId: number, gatewayReference: string, signal?: AbortSignal): Promise<void> {
  await request(`/api/admin/refunds/${refundId}/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gatewayReference }),
    signal,
  });
}
