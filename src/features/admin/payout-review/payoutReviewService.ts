import { parsePayoutDetail, type PayoutDetail } from './payoutReview';

function extractErrorCode(body: unknown): string | undefined {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return undefined;
  const errorCode = (body as Record<string, unknown>).errorCode;
  return typeof errorCode === 'string' ? errorCode : undefined;
}

function extractTitle(body: unknown): string | undefined {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return undefined;
  const title = (body as Record<string, unknown>).title;
  return typeof title === 'string' ? title : undefined;
}

function extractReasonErrors(body: unknown): string[] | undefined {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return undefined;
  const errors = (body as Record<string, unknown>).errors;
  if (typeof errors !== 'object' || errors === null || Array.isArray(errors)) return undefined;
  const reason = (errors as Record<string, unknown>).reason;
  return Array.isArray(reason) && reason.every((entry) => typeof entry === 'string')
    ? reason as string[]
    : undefined;
}

export class PayoutReviewError extends Error {
  constructor(
    public readonly status: number,
    public readonly errorCode?: string,
    public readonly errorMessage?: string,
    public readonly reasonErrors?: string[],
  ) {
    super('Unable to process the payout review request.');
    this.name = 'PayoutReviewError';
  }
}

async function readJsonBody(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

function rethrowAbort(error: unknown): never {
  if (error instanceof DOMException && error.name === 'AbortError') throw error;
  throw new PayoutReviewError(0);
}

export type PayoutDecisionResult = {
  payoutId: string;
  status: string;
  decidedAtUtc: string;
  rejectionReason?: string;
};

export async function fetchPayoutDetail(payoutId: string, signal?: AbortSignal): Promise<PayoutDetail> {
  let response: Response;
  try {
    response = await fetch(`/api/admin/payouts/${encodeURIComponent(payoutId)}`, {
      signal,
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
  } catch (error) {
    rethrowAbort(error);
  }

  const body = await readJsonBody(response);
  if (!response.ok) {
    throw new PayoutReviewError(response.status, extractErrorCode(body), extractTitle(body));
  }
  try {
    return parsePayoutDetail(body);
  } catch {
    throw new PayoutReviewError(0);
  }
}

export async function approvePayout(payoutId: string, signal?: AbortSignal): Promise<PayoutDecisionResult> {
  let response: Response;
  try {
    response = await fetch(`/api/admin/payouts/${encodeURIComponent(payoutId)}/approve`, {
      method: 'POST',
      signal,
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
  } catch (error) {
    rethrowAbort(error);
  }

  const body = await readJsonBody(response);
  if (!response.ok) {
    throw new PayoutReviewError(response.status, extractErrorCode(body), extractTitle(body));
  }
  if (typeof body !== 'object' || body === null
    || typeof (body as Record<string, unknown>).payoutId !== 'string'
    || typeof (body as Record<string, unknown>).status !== 'string'
    || typeof (body as Record<string, unknown>).decidedAtUtc !== 'string') {
    throw new PayoutReviewError(0);
  }
  return body as PayoutDecisionResult;
}

export async function rejectPayout(
  payoutId: string,
  reason: string,
  signal?: AbortSignal,
): Promise<PayoutDecisionResult> {
  let response: Response;
  try {
    response = await fetch(`/api/admin/payouts/${encodeURIComponent(payoutId)}/reject`, {
      method: 'POST',
      signal,
      credentials: 'same-origin',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
  } catch (error) {
    rethrowAbort(error);
  }

  const body = await readJsonBody(response);
  if (!response.ok) {
    throw new PayoutReviewError(
      response.status,
      extractErrorCode(body),
      extractTitle(body),
      extractReasonErrors(body),
    );
  }
  if (typeof body !== 'object' || body === null
    || typeof (body as Record<string, unknown>).payoutId !== 'string'
    || typeof (body as Record<string, unknown>).status !== 'string'
    || typeof (body as Record<string, unknown>).decidedAtUtc !== 'string'
    || typeof (body as Record<string, unknown>).rejectionReason !== 'string') {
    throw new PayoutReviewError(0);
  }
  return body as PayoutDecisionResult;
}
