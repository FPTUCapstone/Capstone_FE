import { PAYOUT_STATUSES, type PayoutStatus } from '../payout-records/payoutRecords';

export const PAYOUT_DETAIL_MESSAGES = {
  notFound: 'No records found matching your criteria.',
  forbidden: 'You do not have permission to access this function.',
  unavailable: 'TripMate is temporarily unable to process your request. Please check your connection and try again.',
  empty: 'No data is available for the selected criteria.',
  confirmSettlement: 'Confirm Settlement',
  confirmSettlementDisabled: 'Settlement confirmation will become available after UC-65 is approved.',
  exportStatement: 'Export Payout Statement',
  exportStatementDisabled: 'Payout statement export requires an approved format and is not available yet.',
} as const;

// Signed 64-bit maximum; payout IDs are compared as digit strings, never as Numbers.
export const MAX_PAYOUT_ID = '9223372036854775807';

export function isValidPayoutId(value: string): boolean {
  if (!/^[1-9]\d*$/.test(value)) return false;
  if (value.length > MAX_PAYOUT_ID.length) return false;
  return value.length < MAX_PAYOUT_ID.length || value <= MAX_PAYOUT_ID;
}

export type PayoutOperator = { userId: string; companyName: string };

export type PayoutBooking = {
  bookingId: string;
  bookingCode: string;
  tourName: string | null;
  paidAmount: number;
  refundedAmount: number;
  netAmount: number;
};

export type PayoutDetail = {
  payoutId: string;
  payoutCode: string;
  operator: PayoutOperator;
  periodStart: string;
  periodEnd: string;
  grossRevenue: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
  requestedAtUtc: string | null;
  status: PayoutStatus;
  bookings: PayoutBooking[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isString = (value: unknown): value is string => typeof value === 'string';
const isDecimalStringId = (value: unknown): value is string => isString(value) && /^\d+$/.test(value);
const isNonNegativeMoney = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && (value as number) >= 0;
const isDateOnly = (value: unknown): value is string =>
  isString(value) && /^\d{4}-\d{2}-\d{2}$/.test(value);
const isUtcTimestamp = (value: unknown): value is string | null =>
  value === null || (isString(value) && /(?:Z|\+00:00)$/.test(value) && Number.isFinite(Date.parse(value)));

export function parsePayoutDetail(value: unknown): PayoutDetail {
  if (!isRecord(value) || !isDecimalStringId(value.payoutId) || !isValidPayoutId(value.payoutId) ||
      value.payoutCode !== `PO-${value.payoutId}` ||
      !isRecord(value.operator) || !isDecimalStringId(value.operator.userId) ||
      !isString(value.operator.companyName) ||
      !isDateOnly(value.periodStart) || !isDateOnly(value.periodEnd) ||
      !isNonNegativeMoney(value.grossRevenue) || !isNonNegativeMoney(value.commissionRate) ||
      !isNonNegativeMoney(value.commissionAmount) || !isNonNegativeMoney(value.netAmount) ||
      !isUtcTimestamp(value.requestedAtUtc) ||
      !PAYOUT_STATUSES.includes(value.status as PayoutStatus) || !Array.isArray(value.bookings)) {
    throw new Error('The payout detail response is invalid.');
  }
  const bookings = value.bookings.map((entry): PayoutBooking => {
    if (!isRecord(entry) || !isDecimalStringId(entry.bookingId) ||
        !isString(entry.bookingCode) ||
        !(entry.tourName === null || isString(entry.tourName)) ||
        !isNonNegativeMoney(entry.paidAmount) || !isNonNegativeMoney(entry.refundedAmount) ||
        !isNonNegativeMoney(entry.netAmount)) {
      throw new Error('The payout detail response is invalid.');
    }
    return entry as PayoutBooking;
  });
  return { ...(value as Omit<PayoutDetail, 'bookings'>), bookings };
}

export { formatVnd, formatPeriodRange, formatRequestedAt } from '../payout-records/payoutRecords';
