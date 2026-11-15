import type { BookingFilterParams, BookingRequestItem, BookingRequestStatus, DecisionPayload, OutcomePayload } from '../types';
import { record, WorkflowError, workflowRequest } from './workflowClient';

const BASE = '/api/provider/service-booking-requests';
const pendingKeys = new Map<string, string>();
const STATUSES = ['PendingConfirmation', 'Confirmed', 'Rejected', 'Cancelled', 'Expired', 'Completed', 'NoShow'];

function booking(value: unknown): BookingRequestItem {
  const data = record(value);
  if (!Number.isSafeInteger(data.id) || (data.id as number) <= 0 || !Number.isSafeInteger(data.serviceId) ||
    typeof data.requestCode !== 'string' || typeof data.serviceName !== 'string' || typeof data.requestedDate !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(data.requestedDate) || typeof data.requestedTime !== 'string' ||
    typeof data.quantity !== 'number' || typeof data.travelerName !== 'string' || !STATUSES.includes(data.status as string) ||
    typeof data.rowVersion !== 'string' || !data.rowVersion) throw new WorkflowError();
  return {
    id: String(data.id), requestCode: data.requestCode, serviceId: data.serviceId as number,
    serviceName: data.serviceName, serviceOption: typeof data.option === 'string' ? data.option : '—',
    requestedDate: data.requestedDate, requestedTime: data.requestedTime, quantity: data.quantity,
    travelerName: data.travelerName, status: data.status as BookingRequestStatus, rowVersion: data.rowVersion,
    estimatedAmount: typeof data.estimatedAmount === 'number' ? data.estimatedAmount : 0,
    actualAmount: typeof data.actualAmount === 'number' ? data.actualAmount : undefined,
    commissionAmount: typeof data.commissionAmount === 'number' ? data.commissionAmount : undefined,
    travelerPhone: typeof data.travelerPhone === 'string' ? data.travelerPhone : undefined,
    travelerEmail: typeof data.travelerEmail === 'string' ? data.travelerEmail : undefined,
    specialRequests: typeof data.specialRequest === 'string' ? data.specialRequest : undefined,
    rejectionReason: typeof data.rejectionReason === 'string' ? data.rejectionReason : undefined,
    submittedAt: typeof data.submittedAtUtc === 'string' ? data.submittedAtUtc : undefined,
    decidedAt: typeof data.respondedAtUtc === 'string' ? data.respondedAtUtc : undefined,
    outcomeRecordedAt: typeof data.outcomeAtUtc === 'string' ? data.outcomeAtUtc : undefined,
    responseDeadlineUtc: typeof data.responseDeadlineUtc === 'string' ? data.responseDeadlineUtc : undefined,
    outcomeAvailableAtUtc: typeof data.outcomeAvailableAtUtc === 'string' ? data.outcomeAvailableAtUtc : undefined,
    autoCompleteAtUtc: typeof data.autoCompleteAtUtc === 'string' ? data.autoCompleteAtUtc : undefined,
  };
}

async function mutate(id: string, operation: 'decision' | 'outcome', payload: DecisionPayload | OutcomePayload): Promise<BookingRequestItem> {
  const body = JSON.stringify(payload);
  const signature = `${id}/${operation}/${body}`;
  const key = pendingKeys.get(signature) ?? crypto.randomUUID();
  pendingKeys.set(signature, key);
  try {
    const result = booking(await workflowRequest(`${BASE}/${encodeURIComponent(id)}/${operation}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key }, body,
    }));
    pendingKeys.delete(signature);
    return result;
  } catch (error) {
    // Keep uncertain requests retryable. A definitive rejection consumes no mutation.
    if (error instanceof WorkflowError && error.status >= 400 && error.status < 500) pendingKeys.delete(signature);
    throw error;
  }
}

export const ProviderBookingService = {
  async fetchBookingRequests(filters: BookingFilterParams = {}) {
    const query = new URLSearchParams();
    if (filters.status && filters.status !== 'All') query.set('status', filters.status);
    if (filters.startDate) query.set('requestedDateFrom', filters.startDate);
    if (filters.endDate) query.set('requestedDateTo', filters.endDate);
    if (filters.keyword?.trim()) query.set('keyword', filters.keyword.trim());
    query.set('pageNumber', String(filters.page ?? 1));
    query.set('pageSize', String(filters.pageSize ?? 20));
    const data = record(await workflowRequest(`${BASE}?${query}`));
    if (!Array.isArray(data.items) || !Number.isSafeInteger(data.totalCount) || (data.totalCount as number) < 0 ||
      !Number.isSafeInteger(data.pageNumber) || (data.pageNumber as number) < 1 || !Number.isSafeInteger(data.pageSize) || (data.pageSize as number) < 1) throw new WorkflowError();
    return { items: data.items.map(booking), totalCount: data.totalCount as number, page: data.pageNumber as number, pageSize: data.pageSize as number };
  },
  async getBookingRequestById(id: string) {
    return booking(await workflowRequest(`${BASE}/${encodeURIComponent(id)}`));
  },
  submitDecision: (id: string, payload: DecisionPayload) => mutate(id, 'decision', payload),
  recordOutcome: (id: string, payload: OutcomePayload) => mutate(id, 'outcome', payload),
};
