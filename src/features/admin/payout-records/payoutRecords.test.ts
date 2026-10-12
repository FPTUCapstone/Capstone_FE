import { describe, expect, it } from 'vitest';

import {
  defaultPayoutsSearch,
  formatPeriodRange,
  formatRequestedAt,
  formatVnd,
  parsePayoutsResponse,
  parsePayoutsSearch,
  serializePayoutsSearch,
  validatePeriodRange,
} from './payoutRecords';

const response = {
  summary: { pendingRequests: 2, totalRequestedAmount: 9190000, totalConfirmedAmount: 532500 },
  pageNumber: 1, pageSize: 20, totalCount: 2, totalPages: 1,
  items: [
    {
      payoutId: '12', payoutCode: 'PO-12',
      operator: { userId: '2', companyName: 'Da Nang Tours' },
      periodStart: '2026-08-01', periodEnd: '2026-08-31',
      grossRevenue: 10000000, commissionAmount: 1000000, netAmount: 9000000,
      requestedAtUtc: '2026-09-01T02:30:00Z', status: 'Requested',
    },
    {
      payoutId: '11', payoutCode: 'PO-11',
      operator: { userId: '3', companyName: 'Hoi An Walks' },
      periodStart: '2026-07-01', periodEnd: '2026-07-31',
      grossRevenue: 500000, commissionAmount: 62500, netAmount: 437500,
      requestedAtUtc: null, status: 'Confirmed',
    },
  ],
};

describe('payout response contract', () => {
  it('parses a full payload preserving string IDs and derived codes', () => {
    const parsed = parsePayoutsResponse(response);
    expect(parsed.items[0].payoutId).toBe('12');
    expect(parsed.items[0].payoutCode).toBe('PO-12');
    expect(parsed.items[0].requestedAtUtc).toContain('Z');
    expect(parsed.items[1].requestedAtUtc).toBeNull();
    expect(parsed.summary.totalRequestedAmount).toBe(9190000);
  });

  it.each([
    { payoutCode: 'XO-12' },
    { payoutId: 12 },
    { grossRevenue: -1 },
    { status: 'Approved' },
    { periodStart: '08/01/2026' },
    { requestedAtUtc: '2026-09-01 02:30:00' },
    { operator: { userId: 'x', companyName: 'Y' } },
  ])('rejects a payload mutated with %j', mutation => {
    const item = { ...response.items[0], ...mutation };
    expect(() => parsePayoutsResponse({ ...response, items: [item] })).toThrow();
  });
});

describe('search model', () => {
  it('parses and serializes allow-listed keys only', () => {
    const params = new URLSearchParams('keyword=PO-12&status=Paid&periodFrom=2026-08-01&periodTo=2026-08-31&pageNumber=3&hax=1');
    const search = parsePayoutsSearch(params);
    expect(search).toEqual({ keyword: 'PO-12', status: 'Paid', periodFrom: '2026-08-01', periodTo: '2026-08-31', pageNumber: 3 });
    expect(serializePayoutsSearch(search).toString()).toBe('keyword=PO-12&status=Paid&periodFrom=2026-08-01&periodTo=2026-08-31&pageNumber=3');
    expect(serializePayoutsSearch(defaultPayoutsSearch()).toString()).toBe('');
  });

  it('treats empty strings as no filter', () => {
    const search = parsePayoutsSearch(new URLSearchParams('status='));
    expect(search.status).toBe('');
    expect(serializePayoutsSearch(search).has('status')).toBe(false);
  });

  it('validates the period range without a future-date restriction', () => {
    expect(validatePeriodRange('2026-09-01', '2026-08-01')).toBe(false);
    expect(validatePeriodRange('2026-08-01', '2026-09-01')).toBe(true);
    expect(validatePeriodRange('2099-01-01', '2099-12-31')).toBe(true);
    expect(validatePeriodRange('not-a-date', '')).toBe(false);
  });
});

describe('display formatting', () => {
  it('formats VND money, period ranges, and requested dates', () => {
    expect(formatVnd(8250000)).toContain('8.250.000');
    expect(formatPeriodRange('2026-08-01', '2026-08-31')).toBe('01/08/2026 – 31/08/2026');
    expect(formatRequestedAt('2026-09-01T02:30:00Z')).toMatch(/\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}/);
    expect(formatRequestedAt(null)).toBe('Not available');
  });
});
