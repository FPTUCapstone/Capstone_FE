/**
 * Operator Coupon Management route paths (UC-38, UC-39, and supporting list workspace).
 */
export const OPERATOR_COUPON_ROUTES = {
  list: '/partner/coupons',
  create: '/partner/coupons/new',
  edit: (id: string | number) => `/partner/coupons/${encodeURIComponent(id)}/edit`,
} as const;

/**
 * Appends or preserves ?demo=1 on internal coupon route URLs when isDemo is true.
 * Returns the URL unchanged when isDemo is false or href is empty.
 * Correctly handles existing query strings and hash fragments without creating malformed URLs.
 */
export function withCouponDemoMode(href: string, isDemo = false): string {
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

/**
 * Builds a coupon list URL preserving page, status, and demo context per CR-01.
 */
export function buildCouponListUrl(options?: {
  page?: number;
  status?: string;
  isDemo?: boolean;
}): string {
  const params = new URLSearchParams();
  if (options?.page && options.page > 1) {
    params.set('page', String(options.page));
  }
  if (options?.status && options.status !== 'ALL') {
    params.set('status', options.status);
  }
  if (options?.isDemo) {
    params.set('demo', '1');
  }
  const query = params.toString();
  return `${OPERATOR_COUPON_ROUTES.list}${query ? `?${query}` : ''}`;
}

/**
 * Resolves a safe return URL back to the promotional coupons list, preserving query context.
 */
export function resolveCouponReturnUrl(rawReturnUrl?: string | null, isDemo = false): string {
  if (!rawReturnUrl || !rawReturnUrl.startsWith('/partner/coupons')) {
    return withCouponDemoMode(OPERATOR_COUPON_ROUTES.list, isDemo);
  }
  return withCouponDemoMode(rawReturnUrl, isDemo);
}
