/**
 * Operator Finance route definitions and demo query string helper.
 */

export const OPERATOR_FINANCE_ROUTES = {
  revenue: '/partner/revenue',
  payouts: '/partner/payouts',
} as const;

/**
 * Appends or preserves ?demo=1 on internal finance route URLs when isDemo is true.
 */
export function withFinanceDemoMode(href: string, isDemo = false): string {
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
