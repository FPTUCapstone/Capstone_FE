// UC-41/UC-42/UC-67 SRS alignment (spec `UC-42-confirm-booking-refund-srs-alignment-fe-spec.md`).
// The six new UC-42 statuses plus the pre-existing UC-67 ones (kept so a legacy row never fails
// to parse — BE spec Q3).
export const REFUND_STATUSES = [
  'PendingOperatorConfirmation',
  'AwaitingPartnerReturn',
  'ReturnReported',
  'ReturnReceived',
  'Reconciliation',
  'Escalated',
  'Pending',
  'Processing',
  'RetryPending',
  'ManualReview',
  'Processed',
  'Failed',
  'Rejected',
] as const;

export type RefundStatus = (typeof REFUND_STATUSES)[number];

/** Screen 1 (Tour Operator, SRS screen 90): one refund request's full detail. */
export type RefundDetail = {
  refundId: number;
  bookingId: number;
  bookingCode: string;
  tourName: string;
  departureDate: string;
  paidAmount: number;
  referenceCode: string | null;
  refundAmount: number;
  operatorReturnShare: number;
  returnDeadlineAtUtc: string | null;
  returnReference: string | null;
  returnReportedAtUtc: string | null;
  status: RefundStatus;
};

/** Screens 2/3 (Staff/Administrator, SRS screens 100/101): one row of a filtered list. */
export type RefundListItem = {
  refundId: number;
  bookingCode: string;
  tourOperatorUserId: number;
  amount: number;
  returnReference: string | null;
  returnReportedAtUtc: string | null;
  status: RefundStatus;
  attemptCount: number | null;
  lastErrorCode: string | null;
};

export type RefundListResponse = {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  items: RefundListItem[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isSafeInteger = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value);
const isNonNegativeInteger = (value: unknown): value is number => isSafeInteger(value) && value >= 0;
const isMoney = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const isNullableString = (value: unknown): value is string | null => value === null || typeof value === 'string';
const isNullableSafeInteger = (value: unknown): value is number | null => value === null || isSafeInteger(value);
const isStatus = (value: unknown): value is RefundStatus => (REFUND_STATUSES as readonly string[]).includes(value as string);

/** Rejects an unknown status string rather than silently accepting it (mirrors
 * `PAYOUT_SETTLEMENT_STATUSES`'s pattern) — a future BE status without an FE case must fail the
 * parse, not render as if it were one of the known six. */
export function parseRefundDetail(value: unknown): RefundDetail {
  if (
    !isRecord(value) ||
    !isSafeInteger(value.refundId) ||
    !isSafeInteger(value.bookingId) ||
    typeof value.bookingCode !== 'string' ||
    typeof value.tourName !== 'string' ||
    typeof value.departureDate !== 'string' ||
    !isMoney(value.paidAmount) ||
    !isNullableString(value.referenceCode) ||
    !isMoney(value.refundAmount) ||
    !isMoney(value.operatorReturnShare) ||
    !isNullableString(value.returnDeadlineAtUtc) ||
    !isNullableString(value.returnReference) ||
    !isNullableString(value.returnReportedAtUtc) ||
    !isStatus(value.status)
  ) {
    throw new Error('Invalid refund detail.');
  }
  return value as RefundDetail;
}

function parseRefundListItem(value: unknown): RefundListItem {
  if (
    !isRecord(value) ||
    !isSafeInteger(value.refundId) ||
    typeof value.bookingCode !== 'string' ||
    !isSafeInteger(value.tourOperatorUserId) ||
    !isMoney(value.amount) ||
    !isNullableString(value.returnReference) ||
    !isNullableString(value.returnReportedAtUtc) ||
    !isStatus(value.status) ||
    !isNullableSafeInteger(value.attemptCount) ||
    !isNullableString(value.lastErrorCode)
  ) {
    throw new Error('Invalid refund list item.');
  }
  return value as RefundListItem;
}

export function parseRefundListResponse(value: unknown): RefundListResponse {
  if (
    !isRecord(value) ||
    !isSafeInteger(value.pageNumber) ||
    !isSafeInteger(value.pageSize) ||
    !isNonNegativeInteger(value.totalCount) ||
    !Array.isArray(value.items)
  ) {
    throw new Error('Invalid refund list response.');
  }
  return {
    pageNumber: value.pageNumber,
    pageSize: value.pageSize,
    totalCount: value.totalCount,
    items: value.items.map(parseRefundListItem),
  };
}

/** Tour Operator's own refund requests (`GET /api/v1/operator/refunds`): one row of the list
 * that leads to Screen 1. `operatorReturnShare` is null until the refund is confirmed. */
export type OperatorRefundListItem = {
  refundId: number;
  bookingId: number;
  bookingCode: string;
  amount: number;
  status: RefundStatus;
  operatorReturnShare: number | null;
  returnDeadlineAtUtc: string | null;
  requestedAtUtc: string;
};

export type OperatorRefundListResponse = {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  items: OperatorRefundListItem[];
};

function parseOperatorRefundListItem(value: unknown): OperatorRefundListItem {
  if (
    !isRecord(value) ||
    !isSafeInteger(value.refundId) ||
    !isSafeInteger(value.bookingId) ||
    typeof value.bookingCode !== 'string' ||
    !isMoney(value.amount) ||
    !isStatus(value.status) ||
    !(value.operatorReturnShare === null || isMoney(value.operatorReturnShare)) ||
    !isNullableString(value.returnDeadlineAtUtc) ||
    typeof value.requestedAtUtc !== 'string'
  ) {
    throw new Error('Invalid operator refund list item.');
  }
  return value as OperatorRefundListItem;
}

export function parseOperatorRefundListResponse(value: unknown): OperatorRefundListResponse {
  if (
    !isRecord(value) ||
    !isSafeInteger(value.pageNumber) ||
    !isSafeInteger(value.pageSize) ||
    !isNonNegativeInteger(value.totalCount) ||
    !Array.isArray(value.items)
  ) {
    throw new Error('Invalid operator refund list response.');
  }
  return {
    pageNumber: value.pageNumber,
    pageSize: value.pageSize,
    totalCount: value.totalCount,
    items: value.items.map(parseOperatorRefundListItem),
  };
}

/** UC-42 [Confirm Return] (MSG172, `refund.return_reference_required`): non-blank after trim,
 * same shape as `validateResolutionReason`. */
export function validateReturnReference(value: unknown): { ok: true; value: string } | { ok: false } {
  if (typeof value !== 'string') return { ok: false };
  const trimmed = value.trim();
  return trimmed ? { ok: true, value: trimmed } : { ok: false };
}

export const formatVnd = (value: number): string =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

export const formatVietnamDateTime = (value: string): string =>
  new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

export const formatDepartureDate = (value: string): string =>
  new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(`${value}T00:00:00Z`),
  );
