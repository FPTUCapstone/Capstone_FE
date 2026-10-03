import type { TourSearchState } from '../types/tour';

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;

export const SUPPORTED_BACKEND_PARAMS = new Set([
  'destination',
  'departureDate',
  'minPrice',
  'maxPrice',
  'page',
  'pageSize',
]);

export function parseTourSearchState(searchParams: URLSearchParams): TourSearchState {
  const destination = (searchParams.get('destination') ?? '').trim();
  const departureDate = (searchParams.get('departureDate') ?? '').trim();
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
    destination,
    departureDate,
    minPrice,
    maxPrice,
    page,
    pageSize,
  };
}

export function toPublicUrlParams(state: TourSearchState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.destination) params.set('destination', state.destination);
  if (state.departureDate) params.set('departureDate', state.departureDate);
  if (state.minPrice) params.set('minPrice', state.minPrice);
  if (state.maxPrice) params.set('maxPrice', state.maxPrice);
  if (state.page > 1) params.set('page', String(state.page));
  if (state.pageSize !== DEFAULT_PAGE_SIZE) params.set('pageSize', String(state.pageSize));
  return params;
}

export function buildBackendTourQuery(state: TourSearchState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.destination.trim()) {
    params.set('destination', state.destination.trim());
  }
  if (state.departureDate.trim()) {
    params.set('departureDate', state.departureDate.trim());
  }
  if (state.minPrice.trim()) {
    params.set('minPrice', state.minPrice.trim());
  }
  if (state.maxPrice.trim()) {
    params.set('maxPrice', state.maxPrice.trim());
  }
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
  // Destination length
  if (state.destination.length > 300) {
    return {
      isValid: false,
      errorMessage: 'Tên điểm đến không được vượt quá 300 ký tự.',
    };
  }

  // Price range validation (BR-53: minPrice <= maxPrice)
  if (state.minPrice) {
    const min = Number(state.minPrice);
    if (!Number.isFinite(min) || min < 0) {
      return {
        isValid: false,
        errorMessage: 'Giá tối thiểu phải là số nguyên dương hợp lệ.',
      };
    }
  }

  if (state.maxPrice) {
    const max = Number(state.maxPrice);
    if (!Number.isFinite(max) || max < 0) {
      return {
        isValid: false,
        errorMessage: 'Giá tối đa phải là số nguyên dương hợp lệ.',
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
