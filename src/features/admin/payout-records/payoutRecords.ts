export const PAYOUT_STATUSES = ['Pending', 'Requested', 'Confirmed', 'Paid', 'Rejected'] as const;
export const PAYOUTS_PAGE_SIZE = 20;

export const PAYOUT_MESSAGES = {
  invalidRange: 'The submitted settlement period range is logically invalid.',
  forbidden: 'You do not have permission to access this function.',
  unavailable: 'TripMate is temporarily unable to process your request. Please check your connection and try again.',
  empty: 'No data is available for the selected criteria.',
  viewDetails: 'View Details',
  viewDetailsDisabled: 'Settlement details will become available after UC-64 is approved.',
} as const;

export type PayoutStatus = (typeof PAYOUT_STATUSES)[number];

export type PayoutOperator = { userId: string; companyName: string };

export type PayoutItem = {
  payoutId: string;
  payoutCode: string;
  operator: PayoutOperator;
  periodStart: string;
  periodEnd: string;
  grossRevenue: number;
  commissionAmount: number;
  netAmount: number;
  requestedAtUtc: string | null;
  status: PayoutStatus;
};

export type PayoutSummary = {
  pendingRequests: number;
  totalRequestedAmount: number;
  totalConfirmedAmount: number;
};

export type PayoutsResponse = {
  summary: PayoutSummary;
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
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
  if (!isRecord(value) || typeof value.payoutId !== 'string' || !/^\d+$/.test(value.payoutId) ||
      value.payoutCode !== `PO-${value.payoutId}` ||
      !isRecord(value.operator) || typeof value.operator.userId !== 'string' || !/^\d+$/.test(value.operator.userId) ||
      typeof value.operator.companyName !== 'string' ||
      !isDateOnly(value.periodStart) || !isDateOnly(value.periodEnd) ||
      !isNonNegativeMoney(value.grossRevenue) || !isNonNegativeMoney(value.commissionAmount) ||
      !isNonNegativeMoney(value.netAmount) || !isUtcTimestamp(value.requestedAtUtc) ||
      !PAYOUT_STATUSES.includes(value.status as PayoutStatus)) {
    throw new Error('The payout response is invalid.');
  }
  return value as PayoutItem;
}

export function parsePayoutsResponse(value: unknown): PayoutsResponse {
  if (!isRecord(value) || !isRecord(value.summary) ||
      !isNonNegativeInteger(value.summary.pendingRequests) ||
      !isNonNegativeMoney(value.summary.totalRequestedAmount) ||
      !isNonNegativeMoney(value.summary.totalConfirmedAmount) ||
      !isNonNegativeInteger(value.pageNumber) || !isNonNegativeInteger(value.pageSize) ||
      !isNonNegativeInteger(value.totalCount) || !isNonNegativeInteger(value.totalPages) ||
      !Array.isArray(value.items)) {
    throw new Error('The payout response is invalid.');
  }
  return { ...(value as Omit<PayoutsResponse, 'items'>), items: value.items.map(parseItem) };
}

export function formatVnd(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
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
  return {
    keyword: (params.get('keyword') ?? '').trim().slice(0, 200),
    status: PAYOUT_STATUSES.includes(status as PayoutStatus) ? status as PayoutStatus : '',
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
