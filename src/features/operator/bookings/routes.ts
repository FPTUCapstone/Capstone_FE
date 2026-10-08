/**
 * Operator Booking Lifecycle route paths (UC-40, UC-41, UC-42).
 * Primary route is /partner/bookings. No dedicated subroutes for cancel/refund dialogs.
 */
export const OPERATOR_BOOKING_ROUTES = {
  list: '/partner/bookings',
} as const;

export interface BookingListUrlParams {
  page?: number;
  status?: string;
  tourId?: string;
  startDate?: string;
  endDate?: string;
  searchKeyword?: string;
  isDemo?: boolean;
}

/**
 * Builds the canonical customer booking list URL preserving pagination, filters, and demo mode.
 * Satisfies CR-01 context preservation across refreshes and return links.
 */
export function buildBookingListUrl(params: BookingListUrlParams = {}): string {
  const query = new URLSearchParams();

  if (params.page && params.page > 1) {
    query.set('page', String(params.page));
  }
  if (params.status && params.status !== 'ALL') {
    query.set('status', params.status);
  }
  if (params.tourId && params.tourId !== 'ALL') {
    query.set('tourId', params.tourId);
  }
  if (params.startDate) {
    query.set('startDate', params.startDate);
  }
  if (params.endDate) {
    query.set('endDate', params.endDate);
  }
  if (params.searchKeyword && params.searchKeyword.trim()) {
    query.set('searchKeyword', params.searchKeyword.trim());
  }
  if (params.isDemo) {
    query.set('demo', '1');
  }

  const queryString = query.toString();
  return queryString ? `${OPERATOR_BOOKING_ROUTES.list}?${queryString}` : OPERATOR_BOOKING_ROUTES.list;
}

/**
 * Appends or preserves ?demo=1 on internal booking route URLs when isDemo is true.
 * Returns the URL unchanged when isDemo is false or href is empty.
 * Correctly handles existing query strings and hash fragments without creating malformed URLs.
 */
export function withBookingDemoMode(href: string, isDemo = false): string {
  if (!isDemo || !href) return href;

  const [urlWithoutHash, hash] = href.split('#');
  const [pathname, search] = urlWithoutHash.split('?');

  const params = new URLSearchParams(search || '');
  if (params.get('demo') !== '1') {
    params.set('demo', '1');
  }

  const queryString = params.toString();
  const hashString = hash !== undefined ? `#${hash}` : '';
  return `${pathname}${queryString ? `?${queryString}` : ''}${hashString}`;
}
