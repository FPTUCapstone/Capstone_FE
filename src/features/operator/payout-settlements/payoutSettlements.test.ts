import { describe, expect, it } from 'vitest';

import { formatRunDate, formatVnd, parsePayoutSettlementsResponse, PAYOUT_SETTLEMENT_STATUSES } from './payoutSettlements';

const listItem = {
  settlementId: 101, bookingId: 55, tourOperatorUserId: 7, runDate: '2026-11-08',
  kind: 'Advance', payoutAmount: 1_800_000, status: 'Settled', transferReference: 'SIM-TRX-001',
};
const response = { pageNumber: 1, pageSize: 20, totalCount: 1, items: [listItem] };

describe('parsePayoutSettlementsResponse (operator)', () => {
  it('parses a complete page', () => {
    expect(parsePayoutSettlementsResponse(response)).toEqual(response);
  });

  it('accepts every backend status, including "Resolved" and "Awaiting Window" with a space', () => {
    expect(PAYOUT_SETTLEMENT_STATUSES).toContain('Awaiting Window');
    expect(PAYOUT_SETTLEMENT_STATUSES).toContain('Resolved');
    expect(PAYOUT_SETTLEMENT_STATUSES).not.toContain('Carried Over');
    for (const status of PAYOUT_SETTLEMENT_STATUSES) {
      const page = { ...response, items: [{ ...listItem, status }] };
      expect(parsePayoutSettlementsResponse(page).items[0].status).toBe(status);
    }
  });

  it('rejects the old pre-v7 kind and status values', () => {
    expect(() => parsePayoutSettlementsResponse({ ...response, items: [{ ...listItem, kind: 'Main' }] })).toThrow();
    expect(() => parsePayoutSettlementsResponse({ ...response, items: [{ ...listItem, status: 'Carried Over' }] })).toThrow();
  });

  it.each([
    ['unrecognized status', { ...response, items: [{ ...listItem, status: 'Mystery' }] }],
    ['items not an array', { ...response, items: {} }],
    ['HTML error page instead of JSON', '<html>502</html>'],
    ['null', null],
  ])('rejects %s', (_label, value) => {
    expect(() => parsePayoutSettlementsResponse(value)).toThrow();
  });

  // Shares the admin side's DTO shape (an Awaiting Window row has no settlementId/runDate),
  // even though this endpoint does not synthesize one itself.
  it('accepts a null settlementId and runDate', () => {
    const page = { ...response, items: [{ ...listItem, settlementId: null, runDate: null, status: 'Awaiting Window' }] };
    const parsed = parsePayoutSettlementsResponse(page).items[0];
    expect(parsed.settlementId).toBeNull();
    expect(parsed.runDate).toBeNull();
  });
});

describe('formatVnd', () => {
  it('formats a VND amount', () => {
    expect(formatVnd(1_800_000)).toContain('1.800.000');
  });
});

describe('formatRunDate', () => {
  it('formats a calendar date without shifting it to a different day', () => {
    expect(formatRunDate('2026-11-08')).toBe('8 Nov 2026');
  });
});
