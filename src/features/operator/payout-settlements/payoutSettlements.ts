// Mirrors the backend's PayoutSettlementListItemDto/PayoutSettlementsResponseDto — the same
// shape the admin side's `src/features/admin/payout-settlements/payoutSettlements.ts` parses.
// Duplicated rather than imported: this repo's admin and operator feature slices do not import
// each other (same reason each keeps its own small format/error-code module instead of a shared
// one — see the DAILY-PAYOUT-TRANSFER FE spec's Behaviour rules).
export const PAYOUT_SETTLEMENT_STATUSES = ['Scheduled', 'Processing', 'Settled', 'SettlementFailed', 'Carried Over'] as const;
export const PAYOUT_SETTLEMENT_KINDS = ['Main', 'Retained'] as const;

export type PayoutSettlementStatus = (typeof PAYOUT_SETTLEMENT_STATUSES)[number];
export type PayoutSettlementKind = (typeof PAYOUT_SETTLEMENT_KINDS)[number];

export type PayoutSettlementListItem = {
  settlementId: number;
  bookingId: number;
  tourOperatorUserId: number;
  runDate: string;
  kind: PayoutSettlementKind;
  payoutAmount: number;
  status: PayoutSettlementStatus;
  transferReference: string | null;
};

export type PayoutSettlementsResponse = {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  items: PayoutSettlementListItem[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isSafeInteger = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value);
const isNonNegativeInteger = (value: unknown): value is number => isSafeInteger(value) && value >= 0;
const isMoney = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const isNullableString = (value: unknown): value is string | null => value === null || typeof value === 'string';
const isRunDate = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

export function parsePayoutSettlementListItem(value: unknown): PayoutSettlementListItem {
  if (
    !isRecord(value) ||
    !isSafeInteger(value.settlementId) ||
    !isSafeInteger(value.bookingId) ||
    !isSafeInteger(value.tourOperatorUserId) ||
    !isRunDate(value.runDate) ||
    !PAYOUT_SETTLEMENT_KINDS.includes(value.kind as PayoutSettlementKind) ||
    !isMoney(value.payoutAmount) ||
    !PAYOUT_SETTLEMENT_STATUSES.includes(value.status as PayoutSettlementStatus) ||
    !isNullableString(value.transferReference)
  ) {
    throw new Error('Invalid payout settlement item.');
  }
  return value as PayoutSettlementListItem;
}

export function parsePayoutSettlementsResponse(value: unknown): PayoutSettlementsResponse {
  if (
    !isRecord(value) ||
    !isSafeInteger(value.pageNumber) ||
    !isSafeInteger(value.pageSize) ||
    !isNonNegativeInteger(value.totalCount) ||
    !Array.isArray(value.items)
  ) {
    throw new Error('Invalid payout settlements response.');
  }
  return {
    pageNumber: value.pageNumber,
    pageSize: value.pageSize,
    totalCount: value.totalCount,
    items: value.items.map(parsePayoutSettlementListItem),
  };
}
