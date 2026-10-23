export const PAYOUT_STATUSES = ['PendingReview', 'ApprovedForSettlement', 'Rejected'] as const;
export const PAYOUTS_PAGE_SIZE = 20;

export const PAYOUT_STATUS_LABELS = {
  PendingReview: 'Pending review',
  ApprovedForSettlement: 'Approved for settlement',
  Rejected: 'Rejected',
} as const;

export const PAYOUT_MESSAGES = {
  invalidRange: 'The submitted settlement period range is logically invalid.',
  forbidden: 'You do not have permission to access this function.',
  unavailable: 'TripMate is temporarily unable to process your request. Please check your connection and try again.',
  empty: 'No data is available for the selected criteria.',
  review: 'Review',
} as const;

export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

export type PayoutOperator = { userId: string; companyName: string };

export type PayoutItem = {
  payoutId: string;
  payoutCode: string;
  operator: PayoutOperator;
  periodStart: string;
  periodEnd: string;
  periodCount: number;
  grossRevenue: number;
  commissionAmount: number;
  netAmount: number;
  requestedAtUtc: string | null;
  status: PayoutStatus;
};

export type PayoutsResponse = {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  totalAmount: number;
  items: PayoutItem[];
};

export type PayoutsSearch = {
  keyword: string;
  status: PayoutStatus | '';
  periodFrom: string;
  periodTo: string;
  pageNumber: number;
};

const DEFAULT_SEARCH: PayoutsSearch = {
  keyword: '', status: '', periodFrom: '', periodTo: '', pageNumber: 1,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isNonNegativeInteger = (value: unknown): value is number =>
  Number.isSafeInteger(value) && (value as number) >= 0;
const isNonNegativeMoney = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && (value as number) >= 0;
const isDateOnly = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
const isUtcTimestamp = (value: unknown): value is string | null =>
  value === null || (typeof value === 'string' &&
    /(?:Z|\+00:00)$/.test(value) && Number.isFinite(Date.parse(value)));

function parseItem(value: unknown): PayoutItem {
  // payoutCode is the persisted code UC-46 issued to the Tour Operator. It is displayed and searched
  // as-is; it is never derived from payoutId, so only its presence is validated here.
  if (!isRecord(value) || typeof value.payoutId !== 'string' || !/^\d+$/.test(value.payoutId) ||
      typeof value.payoutCode !== 'string' || value.payoutCode.trim() === '' ||
      !isRecord(value.operator) || typeof value.operator.userId !== 'string' || !/^\d+$/.test(value.operator.userId) ||
      typeof value.operator.companyName !== 'string' ||
      !isDateOnly(value.periodStart) || !isDateOnly(value.periodEnd) ||
      typeof value.periodCount !== 'number' || !Number.isSafeInteger(value.periodCount) || value.periodCount < 1 ||
      !isNonNegativeMoney(value.grossRevenue) || !isNonNegativeMoney(value.commissionAmount) ||
      !isNonNegativeMoney(value.netAmount) || !isUtcTimestamp(value.requestedAtUtc) ||
      !PAYOUT_STATUSES.includes(value.status as PayoutStatus)) {
    throw new Error('The payout response is invalid.');
  }
  return value as PayoutItem;
}

export function parsePayoutsResponse(value: unknown): PayoutsResponse {
  if (!isRecord(value) || !isNonNegativeInteger(value.pageNumber) ||
      !isNonNegativeInteger(value.pageSize) || !isNonNegativeInteger(value.totalCount) ||
      !isNonNegativeInteger(value.totalPages) || !isNonNegativeMoney(value.totalAmount) ||
      !Array.isArray(value.items)) {
    throw new Error('The payout response is invalid.');
  }
  return { ...(value as Omit<PayoutsResponse, 'items'>), items: value.items.map(parseItem) };
}

export function formatVnd(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

export function formatPayoutStatus(status: PayoutStatus): string {
  return PAYOUT_STATUS_LABELS[status];
}

export function formatVietnamDate(dateOnly: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) return 'Not available';
  const [year, month, day] = dateOnly.split('-');
  return `${day}/${month}/${year}`;
}

export function formatPeriodRange(start: string, end: string): string {
  return `${formatVietnamDate(start)} – ${formatVietnamDate(end)}`;
}

export function formatRequestedAt(value: string | null): string {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Not available';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}`;
}

const isIsoDate = (value: string) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value);

export function validatePeriodRange(from: string, to: string): boolean {
  return isIsoDate(from) && isIsoDate(to) && (!from || !to || from <= to);
}

export function parsePayoutsSearch(params: URLSearchParams): PayoutsSearch {
  const status = params.get('status');
  const rawPage = Number(params.get('pageNumber'));
  const from = params.get('periodFrom') ?? '';
  const to = params.get('periodTo') ?? '';
  // '' is the Status select's "Pending review" (default) option; PendingReview is its only
  // backing value, filtered out of the option list to avoid a duplicate-looking entry. A URL
  // carrying the explicit value (e.g. a shared/bookmarked link) must still show that option as
  // selected, so it is normalized to '' here rather than left to not match any <option>.
  const normalizedStatus = status === 'PendingReview'
    ? ''
    : PAYOUT_STATUSES.includes(status as PayoutStatus) ? status as PayoutStatus : '';
  return {
    keyword: (params.get('keyword') ?? '').trim().slice(0, 200),
    status: normalizedStatus,
    periodFrom: isIsoDate(from) ? from : '',
    periodTo: isIsoDate(to) ? to : '',
    pageNumber: Number.isSafeInteger(rawPage) && rawPage >= 1 ? rawPage : 1,
  };
}

export function serializePayoutsSearch(search: PayoutsSearch): URLSearchParams {
  const params = new URLSearchParams();
  if (search.keyword) params.set('keyword', search.keyword);
  if (search.status) params.set('status', search.status);
  if (search.periodFrom) params.set('periodFrom', search.periodFrom);
  if (search.periodTo) params.set('periodTo', search.periodTo);
  if (search.pageNumber > 1) params.set('pageNumber', String(search.pageNumber));
  return params;
}

export function defaultPayoutsSearch(): PayoutsSearch {
  return { ...DEFAULT_SEARCH };
}
