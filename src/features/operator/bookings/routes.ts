/**
 * Operator Booking Lifecycle route paths (UC-40, UC-41, UC-42).
 * Primary route is /partner/bookings. No dedicated subroutes for cancel/refund dialogs.
 */
export const OPERATOR_BOOKING_ROUTES = {
  list: '/partner/bookings',
} as const;

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
