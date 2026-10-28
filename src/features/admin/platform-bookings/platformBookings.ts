export const PLATFORM_BOOKING_STATUSES = ['PendingPayment', 'Confirmed', 'Cancelled', 'Completed', 'Expired'] as const;
export const PLATFORM_PAYMENT_STATUSES = ['Unpaid', 'Paid', 'Refunded', 'PartiallyRefunded'] as const;
export const PLATFORM_BOOKINGS_PAGE_SIZE = 20;

export type PlatformBookingStatus = (typeof PLATFORM_BOOKING_STATUSES)[number];
export type PlatformPaymentStatus = (typeof PLATFORM_PAYMENT_STATUSES)[number];
export type PlatformBookingsSearch = { keyword: string; status: PlatformBookingStatus | ''; paymentStatus: PlatformPaymentStatus | ''; bookedFrom: string; bookedTo: string; pageNumber: number };
export type PlatformBooking = { bookingId: string; bookingCode: string; traveler: { userId: string; fullName: string; email: string | null }; tour: { tourId: string; title: string; operatorUserId: string; operatorName: string; scheduleId: string; startAtUtc: string }; quantity: number; subtotalAmount: number; discountAmount: number; totalAmount: number; status: PlatformBookingStatus; paymentStatus: PlatformPaymentStatus; bookedAtUtc: string };
export type PlatformBookingsResponse = { pageNumber: number; pageSize: number; totalCount: number; totalPages: number; items: PlatformBooking[] };

const defaultSearch: PlatformBookingsSearch = { keyword: '', status: '', paymentStatus: '', bookedFrom: '', bookedTo: '', pageNumber: 1 };
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const isId = (value: unknown): value is string => typeof value === 'string' && /^\d+$/.test(value);
const isMoney = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0;
const isPositiveSafeInteger = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
const isTimestamp = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));
const isDate = (value: string) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value);

function vietnamCalendarDate(value: string | null): string {
  if (!value || !isTimestamp(value)) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value;
  const year = part('year'); const month = part('month'); const day = part('day');
  return year && month && day ? `${year}-${month}-${day}` : '';
}

export function parsePlatformBookingsResponse(value: unknown): PlatformBookingsResponse {
  if (!isRecord(value) || !Number.isSafeInteger(value.pageNumber) || !Number.isSafeInteger(value.pageSize) || !Number.isSafeInteger(value.totalCount) || !Number.isSafeInteger(value.totalPages) || !Array.isArray(value.items)) throw new Error('Invalid platform bookings response.');
  const items = value.items.map((item): PlatformBooking => {
    if (!isRecord(item) || !isId(item.bookingId) || typeof item.bookingCode !== 'string' || !isRecord(item.traveler) || !isId(item.traveler.userId) || typeof item.traveler.fullName !== 'string' || !(typeof item.traveler.email === 'string' || item.traveler.email === null) || !isRecord(item.tour) || !isId(item.tour.tourId) || typeof item.tour.title !== 'string' || !isId(item.tour.operatorUserId) || typeof item.tour.operatorName !== 'string' || !isId(item.tour.scheduleId) || !isTimestamp(item.tour.startAtUtc) || !isPositiveSafeInteger(item.quantity) || !isMoney(item.subtotalAmount) || !isMoney(item.discountAmount) || !isMoney(item.totalAmount) || !PLATFORM_BOOKING_STATUSES.includes(item.status as PlatformBookingStatus) || !PLATFORM_PAYMENT_STATUSES.includes(item.paymentStatus as PlatformPaymentStatus) || !isTimestamp(item.bookedAtUtc)) throw new Error('Invalid platform booking item.');
    return item as PlatformBooking;
  });
  return { pageNumber: value.pageNumber as number, pageSize: value.pageSize as number, totalCount: value.totalCount as number, totalPages: value.totalPages as number, items };
}

export function parsePlatformBookingsSearch(params: URLSearchParams): PlatformBookingsSearch {
  const page = Number(params.get('pageNumber'));
  const status = params.get('status'); const paymentStatus = params.get('paymentStatus');
  const bookedFrom = vietnamCalendarDate(params.get('bookedFromUtc'));
  const bookedTo = vietnamCalendarDate(params.get('bookedToUtc'));
  return { keyword: (params.get('keyword') ?? '').trim().slice(0, 200), status: PLATFORM_BOOKING_STATUSES.includes(status as PlatformBookingStatus) ? status as PlatformBookingStatus : '', paymentStatus: PLATFORM_PAYMENT_STATUSES.includes(paymentStatus as PlatformPaymentStatus) ? paymentStatus as PlatformPaymentStatus : '', bookedFrom: isDate(bookedFrom) ? bookedFrom : '', bookedTo: isDate(bookedTo) ? bookedTo : '', pageNumber: Number.isSafeInteger(page) && page > 0 ? page : 1 };
}

export function serializePlatformBookingsSearch(search: PlatformBookingsSearch): URLSearchParams {
  const query = new URLSearchParams();
  if (search.keyword) query.set('keyword', search.keyword);
  if (search.status) query.set('status', search.status);
  if (search.paymentStatus) query.set('paymentStatus', search.paymentStatus);
  if (search.bookedFrom) query.set('bookedFromUtc', `${search.bookedFrom}T00:00:00+07:00`);
  if (search.bookedTo) query.set('bookedToUtc', `${search.bookedTo}T23:59:59.999+07:00`);
  if (search.pageNumber > 1) query.set('pageNumber', String(search.pageNumber));
  return query;
}

export const defaultPlatformBookingsSearch = () => ({ ...defaultSearch });
export const validBookedRange = (from: string, to: string) => isDate(from) && isDate(to) && (!from || !to || from <= to);
export const formatVnd = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
export const formatVietnamDateTime = (value: string) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
