import {
  parseFailedPayoutBatchDetail,
  parsePayoutSettlementsResponse,
  type FailedPayoutBatchDetail,
  type PayoutSettlementStatus,
  type PayoutSettlementsResponse,
} from './payoutSettlements';

export type PayoutSettlementsFilters = {
  status?: PayoutSettlementStatus;
  runDateFrom?: string;
  runDateTo?: string;
  pageNumber?: number;
};

/** Thrown by every function below on a non-ok response or a network/abort failure, so a caller
 * can distinguish 401/403 (redirect to sign-in) from 404/409/400 (show the mapped state) from a
 * network failure (retry), instead of treating any of them as success. `status` is 0 for a
 * network-level failure (no HTTP response at all). */
export class PayoutSettlementsError extends Error {
  constructor(
    public readonly status: number,
    public readonly errorCode: string | undefined,
    title: string,
  ) {
    super(title);
    this.name = 'PayoutSettlementsError';
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
    throw new PayoutSettlementsError(0, undefined, 'The payout settlements service could not be reached.');
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const problem = problemOf(body, 'The payout settlements request could not be processed.');
    throw new PayoutSettlementsError(response.status, problem.errorCode, problem.title);
  }
  return body;
}

function serializeFilters(filters: PayoutSettlementsFilters): string {
  const query = new URLSearchParams();
  if (filters.status) query.set('status', filters.status);
  if (filters.runDateFrom) query.set('runDateFrom', filters.runDateFrom);
  if (filters.runDateTo) query.set('runDateTo', filters.runDateTo);
  if (filters.pageNumber && filters.pageNumber > 1) query.set('pageNumber', String(filters.pageNumber));
  const value = query.toString();
  return value ? `?${value}` : '';
}

/** Malformed bodies are never treated as success: a 200 whose body does not match the strict
 * shape throws from the parser below, same as a non-ok status. */
export async function fetchPayoutSettlements(
  filters: PayoutSettlementsFilters,
  signal?: AbortSignal,
): Promise<PayoutSettlementsResponse> {
  const body = await request(`/api/admin/payout-settlements${serializeFilters(filters)}`, { method: 'GET', signal, cache: 'no-store' });
  return parsePayoutSettlementsResponse(body);
}

export async function fetchFailedPayoutBatchDetail(batchId: number, signal?: AbortSignal): Promise<FailedPayoutBatchDetail> {
  const body = await request(`/api/admin/payout-settlements/${batchId}`, { method: 'GET', signal, cache: 'no-store' });
  return parseFailedPayoutBatchDetail(body);
}

/** The backend's acknowledgement is intentionally discarded: the caller must re-fetch the detail
 * to learn the batch's committed status (spec Screen 2 — never assume the local guess is final). */
export async function retryFailedPayoutBatch(batchId: number, signal?: AbortSignal): Promise<void> {
  await request(`/api/admin/payout-settlements/${batchId}/retry`, { method: 'POST', signal });
}

export async function carryOverFailedPayoutBatch(batchId: number, signal?: AbortSignal): Promise<void> {
  await request(`/api/admin/payout-settlements/${batchId}/carry-over`, { method: 'POST', signal });
}

export async function recordManualPayoutSettlement(
  batchId: number,
  transferReference: string,
  signal?: AbortSignal,
): Promise<void> {
  await request(`/api/admin/payout-settlements/${batchId}/manual-settlement`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transferReference }),
    signal,
  });
}
