export const PAYOUT_REASON_MIN_LENGTH = 10;
export const PAYOUT_REASON_MAX_LENGTH = 500;

// Signed 64-bit maximum; payout IDs are compared as digit strings, never as Numbers.
export const MAX_PAYOUT_ID = '9223372036854775807';

export function isValidPayoutId(value: string): boolean {
  if (!/^[1-9]\d*$/.test(value)) return false;
  if (value.length > MAX_PAYOUT_ID.length) return false;
  return value.length < MAX_PAYOUT_ID.length || value <= MAX_PAYOUT_ID;
}

export const PAYOUT_REVIEW_STATUSES = [
  'PendingReview',
  'ApprovedForSettlement',
  'SettlementProcessing',
  'Settled',
  'SettlementFailed',
  'Rejected',
] as const;
export type PayoutReviewStatus = (typeof PAYOUT_REVIEW_STATUSES)[number];

export type ReasonValidation =
  | { ok: true; value: string }
  | { ok: false; messageCode: 'MSG157' };

export function validateRejectionReason(value: string): ReasonValidation {
  if (typeof value !== 'string') return { ok: false, messageCode: 'MSG157' };
  const trimmed = value.trim();
  if (trimmed.length < PAYOUT_REASON_MIN_LENGTH || trimmed.length > PAYOUT_REASON_MAX_LENGTH) {
    return { ok: false, messageCode: 'MSG157' };
  }
  return { ok: true, value: trimmed };
}

export function isReviewable(status: string): boolean {
  return status === 'PendingReview';
}

/** commissionRate is a ratio (0.1 = 10%); the server never sends a percentage. */
export function formatCommissionRate(ratio: number): string {
  return new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 2 }).format(ratio);
}

export type PayoutDetail = {
  payoutId: string;
  payoutCode: string;
  status: PayoutReviewStatus;
  settlementPeriod: { startDate: string; endDate: string };
  tourOperator: { operatorId: string; companyName: string };
  grossRevenue: number;
  commissionRate: number;
  commissionAmount: number;
  netPayoutAmount: number;
  requestedAtUtc: string | null;
  contributingBookings: PayoutBooking[];
  beneficiary: { bankName: string | null; accountHolder: string | null; maskedAccountNumber: string | null };
  rejectionReason: string | null;
};

export type PayoutBooking = {
  bookingId: string;
  bookingCode: string;
  tourName: string;
  completedAtUtc: string;
  paidAmount: number;
  refundedAmount: number;
  netAmount: number;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === 'string';
const isDecimalId = (value: unknown): value is string => isString(value) && /^\d+$/.test(value);
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const isNullableString = (value: unknown): value is string | null => value === null || isString(value);

const invalid = () => new Error('The payout detail response is invalid.');

function parseBooking(value: unknown): PayoutBooking {
  if (!isRecord(value) || !isDecimalId(value.bookingId) || !isString(value.bookingCode) ||
      !isString(value.tourName) || !isString(value.completedAtUtc) ||
      !isNumber(value.paidAmount) || !isNumber(value.refundedAmount) || !isNumber(value.netAmount)) {
    throw invalid();
  }
  return value as PayoutBooking;
}

export function parsePayoutDetail(value: unknown): PayoutDetail {
  if (!isRecord(value) || !isDecimalId(value.payoutId) || !isString(value.payoutCode) ||
      !(PAYOUT_REVIEW_STATUSES as readonly string[]).includes(value.status as string) ||
      !isRecord(value.settlementPeriod) || !isString(value.settlementPeriod.startDate) || !isString(value.settlementPeriod.endDate) ||
      !isRecord(value.tourOperator) || !isDecimalId(value.tourOperator.operatorId) || !isString(value.tourOperator.companyName) ||
      !isNumber(value.grossRevenue) || !isNumber(value.commissionRate) || !isNumber(value.commissionAmount) ||
      !isNumber(value.netPayoutAmount) || !isNullableString(value.requestedAtUtc) ||
      !Array.isArray(value.contributingBookings) ||
      !isRecord(value.beneficiary) || !isNullableString(value.beneficiary.bankName) ||
      !isNullableString(value.beneficiary.accountHolder) ||
      !isNullableString(value.beneficiary.maskedAccountNumber) || !isNullableString(value.rejectionReason)) {
    throw invalid();
  }
  return {
    ...(value as Omit<PayoutDetail, 'contributingBookings'>),
    contributingBookings: value.contributingBookings.map(parseBooking),
  };
}
