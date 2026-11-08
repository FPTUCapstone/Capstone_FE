import { describe, expect, it } from 'vitest';

import { parsePayoutSettlementsResponse, PAYOUT_SETTLEMENT_STATUSES } from './payoutSettlements';

const listItem = {
  settlementId: 101, bookingId: 55, tourOperatorUserId: 7, runDate: '2026-11-08',
  kind: 'Main', payoutAmount: 1_800_000, status: 'Settled', transferReference: 'SIM-TRX-001',
};
const response = { pageNumber: 1, pageSize: 20, totalCount: 1, items: [listItem] };

describe('parsePayoutSettlementsResponse (operator)', () => {
  it('parses a complete page', () => {
    expect(parsePayoutSettlementsResponse(response)).toEqual(response);
  });

  it('accepts every backend status, including "Carried Over" and "Awaiting Window" with a space', () => {
    expect(PAYOUT_SETTLEMENT_STATUSES).toContain('Awaiting Window');
    for (const status of PAYOUT_SETTLEMENT_STATUSES) {
      const page = { ...response, items: [{ ...listItem, status }] };
      expect(parsePayoutSettlementsResponse(page).items[0].status).toBe(status);
    }
  });

  it.each([
    ['unrecognized status', { ...response, items: [{ ...listItem, status: 'Mystery' }] }],
    ['items not an array', { ...response, items: {} }],
    ['HTML error page instead of JSON', '<html>502</html>'],
    ['null', null],
  ])('rejects %s', (_label, value) => {
    expect(() => parsePayoutSettlementsResponse(value)).toThrow();
  });
});
