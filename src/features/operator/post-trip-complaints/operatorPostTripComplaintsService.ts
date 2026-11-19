import type { ComplaintResponseResult, OperatorComplaintDetail, OperatorComplaintPage } from './operatorPostTripComplaints';

export class OperatorComplaintError extends Error {
  constructor(public readonly status: number, public readonly errorCode?: string, message = 'The request could not be completed.') {
    super(message);
    this.name = 'OperatorComplaintError';
  }
}

function problem(body: unknown): OperatorComplaintError {
  const record = body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : {};
  return new OperatorComplaintError(0, typeof record.errorCode === 'string' ? record.errorCode : undefined,
    typeof record.title === 'string' ? record.title : 'The request could not be completed.');
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { cache: 'no-store', credentials: 'same-origin', headers: { Accept: 'application/json', ...init?.headers }, ...init });
  } catch {
    throw new OperatorComplaintError(0, undefined, 'The complaint service could not be reached.');
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = problem(body);
    throw new OperatorComplaintError(response.status, error.errorCode, error.message);
  }
  if (!body || typeof body !== 'object') throw new OperatorComplaintError(502, undefined, 'The complaint service returned an invalid response.');
  return body as T;
}

export function fetchOperatorComplaints(page = 1, status?: string, signal?: AbortSignal): Promise<OperatorComplaintPage> {
  const query = new URLSearchParams({ page: String(page), pageSize: '20' });
  if (status) query.set('status', status);
  return request<OperatorComplaintPage>(`/api/operator/post-trip-complaints?${query}`, { signal });
}

export function fetchOperatorComplaint(complaintId: number, signal?: AbortSignal): Promise<OperatorComplaintDetail> {
  return request<OperatorComplaintDetail>(`/api/operator/post-trip-complaints/${complaintId}`, { signal });
}

export function respondToOperatorComplaint(complaintId: number, payload: { action: string; proposedRefundAmount?: number; proposalReason?: string; rejectionReason?: string }): Promise<ComplaintResponseResult> {
  return request<ComplaintResponseResult>(`/api/operator/post-trip-complaints/${complaintId}/response`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
    body: JSON.stringify(payload),
  });
}
