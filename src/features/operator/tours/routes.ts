/**
 * Operator Tour Lifecycle route paths.
 * Isolated to prevent collision with unmerged PR #48.
 */
export const OPERATOR_TOUR_ROUTES = {
  list: '/partner/tours',
  create: '/partner/tours/new',
  edit: (id: string | number) => `/partner/tours/${encodeURIComponent(id)}/edit`,
  submit: (id: string | number) => `/partner/tours/${encodeURIComponent(id)}/submit`,
} as const;

/**
 * Appends or preserves ?demo=1 on internal tour route URLs when isDemo is true.
 * Returns the URL unchanged when isDemo is false or href is empty.
 * Correctly handles existing query strings and hash fragments without creating malformed URLs.
 */
export function withTourDemoMode(href: string, isDemo = false): string {
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
