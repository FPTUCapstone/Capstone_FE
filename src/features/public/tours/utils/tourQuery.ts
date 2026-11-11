import type { TourSearchState } from '../types/tour';

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
const MAX_WHOLE_VND_PRICE = 9_999_999_999;

export const SUPPORTED_BACKEND_PARAMS = new Set([
  'keyword',
  'destination',
  'departureDate',
  'startDate',
  'endDate',
  'minPrice',
  'maxPrice',
  'durationDays',
  'category',
  'minimumRating',
  'sort',
  'page',
  'pageSize',
]);

export function parseTourSearchState(searchParams: URLSearchParams): TourSearchState {
  const keyword = (searchParams.get('keyword') ?? '').trim();
  const destination = (searchParams.get('destination') ?? '').trim();
  const departureDate = (searchParams.get('departureDate') ?? '').trim();
  const startDate = (searchParams.get('startDate') ?? '').trim();
  const endDate = (searchParams.get('endDate') ?? '').trim();
  const minPrice = (searchParams.get('minPrice') ?? '').trim();
  const maxPrice = (searchParams.get('maxPrice') ?? '').trim();

  const rawPage = parseInt(searchParams.get('page') ?? '', 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : DEFAULT_PAGE;

  const rawPageSize = parseInt(searchParams.get('pageSize') ?? '', 10);
  const pageSize =
    Number.isFinite(rawPageSize) && rawPageSize >= 1 && rawPageSize <= 100
      ? rawPageSize
      : DEFAULT_PAGE_SIZE;

  return {
    keyword,
    destination,
    departureDate,
    startDate,
    endDate,
    minPrice,
    maxPrice,
    durationDays: (searchParams.get('durationDays') ?? '').trim(),
    category: (searchParams.get('category') ?? '').trim(),
    minimumRating: (searchParams.get('minimumRating') ?? '').trim(),
    sort: (searchParams.get('sort') ?? '').trim(),
    page,
    pageSize,
  };
}

export function toPublicUrlParams(state: TourSearchState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.keyword) params.set('keyword', state.keyword);
  if (state.destination) params.set('destination', state.destination);
  if (state.departureDate) params.set('departureDate', state.departureDate);
  if (state.startDate) params.set('startDate', state.startDate);
  if (state.endDate) params.set('endDate', state.endDate);
  if (state.minPrice) params.set('minPrice', state.minPrice);
  if (state.maxPrice) params.set('maxPrice', state.maxPrice);
  if (state.durationDays) params.set('durationDays', state.durationDays);
  if (state.category) params.set('category', state.category);
  if (state.minimumRating) params.set('minimumRating', state.minimumRating);
  if (state.sort) params.set('sort', state.sort);
  if (state.page > 1) params.set('page', String(state.page));
  if (state.pageSize !== DEFAULT_PAGE_SIZE) params.set('pageSize', String(state.pageSize));
  return params;
}

export function buildBackendTourQuery(state: TourSearchState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.keyword?.trim()) params.set('keyword', state.keyword.trim());
  if (state.destination.trim()) {
    params.set('destination', state.destination.trim());
  }
  if (state.departureDate.trim()) {
    params.set('departureDate', state.departureDate.trim());
  }
  if (state.startDate?.trim()) params.set('startDate', state.startDate.trim());
  if (state.endDate?.trim()) params.set('endDate', state.endDate.trim());
  if (state.minPrice.trim()) {
    params.set('minPrice', state.minPrice.trim());
  }
  if (state.maxPrice.trim()) {
    params.set('maxPrice', state.maxPrice.trim());
  }
  if (state.durationDays?.trim()) params.set('durationDays', state.durationDays.trim());
  if (state.category?.trim()) params.set('category', state.category.trim());
  if (state.minimumRating?.trim()) params.set('minimumRating', state.minimumRating.trim());
  if (state.sort?.trim()) params.set('sort', state.sort.trim());
  params.set('page', String(state.page > 0 ? state.page : DEFAULT_PAGE));
  params.set(
    'pageSize',
    String(
      state.pageSize >= 1 && state.pageSize <= 100 ? state.pageSize : DEFAULT_PAGE_SIZE,
    ),
  );
  return params;
}

export function sanitizeProxyQuery(incomingQuery: URLSearchParams): URLSearchParams {
  const sanitized = new URLSearchParams();
  for (const [key, value] of incomingQuery.entries()) {
    if (SUPPORTED_BACKEND_PARAMS.has(key)) {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        sanitized.set(key, trimmed);
      }
    }
  }
  return sanitized;
}

export function validateTourFilters(state: TourSearchState): {
  isValid: boolean;
  errorMessage?: string;
} {
  if ((state.keyword?.length ?? 0) > 300) {
    return {
      isValid: false,
      errorMessage: 'Từ khóa không được vượt quá 300 ký tự.',
    };
  }

  if (state.destination.length > 300) {
    return {
      isValid: false,
      errorMessage: 'Tên điểm đến không được vượt quá 300 ký tự.',
    };
  }

  if (state.departureDate && (state.startDate || state.endDate)) {
    return { isValid: false, errorMessage: 'Ngày chính xác không thể dùng cùng khoảng ngày.' };
  }

  // Price range validation (BR-53: minPrice <= maxPrice)
  if (state.minPrice) {
    const min = Number(state.minPrice);
    if (!/^\d+$/.test(state.minPrice) || !Number.isSafeInteger(min) || min > MAX_WHOLE_VND_PRICE) {
      return {
        isValid: false,
        errorMessage: 'Giá tối thiểu phải là số nguyên từ 0 đến 9.999.999.999 VNĐ.',
      };
    }
  }

  if (state.maxPrice) {
    const max = Number(state.maxPrice);
    if (!/^\d+$/.test(state.maxPrice) || !Number.isSafeInteger(max) || max > MAX_WHOLE_VND_PRICE) {
      return {
        isValid: false,
        errorMessage: 'Giá tối đa phải là số nguyên từ 0 đến 9.999.999.999 VNĐ.',
      };
    }
  }

  if (state.minPrice && state.maxPrice) {
    const min = Number(state.minPrice);
    const max = Number(state.maxPrice);
    if (min > max) {
      // MSG29: "The minimum value cannot be greater than the maximum value."
      return {
        isValid: false,
        errorMessage: 'Khoảng giá không hợp lệ. Giá tối thiểu không được lớn hơn giá tối đa.',
      };
    }
  }

  // Departure date format (YYYY-MM-DD)
  if (state.departureDate) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(state.departureDate)) {
      return {
        isValid: false,
        errorMessage: 'Ngày khởi hành phải đúng định dạng YYYY-MM-DD.',
      };
    }
  }

  for (const value of [state.startDate, state.endDate].filter(Boolean) as string[]) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return { isValid: false, errorMessage: 'Khoảng ngày phải đúng định dạng YYYY-MM-DD.' };
    }
  }
  if (state.startDate && state.endDate && state.startDate > state.endDate) {
    return { isValid: false, errorMessage: 'Ngày bắt đầu không được sau ngày kết thúc (MSG158).' };
  }
  if (state.durationDays && (!/^\d+$/.test(state.durationDays) || Number(state.durationDays) < 1)) {
    return { isValid: false, errorMessage: 'Thời lượng phải là số ngày nguyên dương.' };
  }
  if (state.minimumRating && (!Number.isFinite(Number(state.minimumRating)) || Number(state.minimumRating) < 1 || Number(state.minimumRating) > 5)) {
    return { isValid: false, errorMessage: 'Đánh giá tối thiểu phải từ 1 đến 5.' };
  }
  if (state.sort && !['relevance', 'priceAsc', 'priceDesc', 'rating', 'departureDate'].includes(state.sort)) {
    return { isValid: false, errorMessage: 'Cách sắp xếp không hợp lệ.' };
  }

  return { isValid: true };
}

export function formatVndPrice(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateDisplay(isoDateString?: string | null): string {
  if (!isoDateString) return 'Liên hệ';
  try {
    const date = new Date(isoDateString);
    if (Number.isNaN(date.getTime())) return isoDateString;
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    return isoDateString;
  }
}

const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';

/**
 * Departure and return times are scheduled and sold in Vietnam, so they are always shown in Vietnam local time
 * (dd/MM/yyyy HH:mm) regardless of the browser or server time zone.
 */
export function formatDateTimeVietnam(isoDateString?: string | null): string {
  if (!isoDateString) return 'Liên hệ';
  const date = new Date(isoDateString);
  if (Number.isNaN(date.getTime())) return isoDateString;
  const parts = new Intl.DateTimeFormat('vi-VN', {
    timeZone: VIETNAM_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('day')}/${part('month')}/${part('year')} ${part('hour')}:${part('minute')}`;
}
