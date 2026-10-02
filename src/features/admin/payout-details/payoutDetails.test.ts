import { describe, expect, it } from 'vitest';

import { formatPeriodRange, isValidPayoutId, parsePayoutDetail } from './payoutDetails';

const detail = {
  payoutId: '1', payoutCode: 'PO-1',
  operator: { userId: '2', companyName: 'Danang Tourist Co., Ltd' },
  periodStart: '2026-08-01', periodEnd: '2026-08-31',
  grossRevenue: 10000000, commissionRate: 10, commissionAmount: 1000000, netAmount: 9000000,
  requestedAtUtc: '2026-09-01T02:30:00Z', status: 'Requested',
  bookings: [
    { bookingId: '801', bookingCode: 'BK-2026-000801', tourName: 'Hoi An Night Walk', paidAmount: 10000000, refundedAmount: 0, netAmount: 8000000 },
    { bookingId: '802', bookingCode: 'BK-2026-000802', tourName: null, paidAmount: 300000, refundedAmount: 100000, netAmount: 2000000 },
  ],
};

describe('payout ID validation', () => {
  it.each(['1', '9223372036854775807'])('accepts canonical decimal %s', value => expect(isValidPayoutId(value)).toBe(true));
  it.each(['0', '-1', '1abc', '1.5', '+1', ' 1', '01', '', '9223372036854775808'])(
    'rejects %s', value => expect(isValidPayoutId(value)).toBe(false));
});

describe('payout detail contract', () => {
  it('parses a full payload with bookings preserved', () => {
    const parsed = parsePayoutDetail(detail);
    expect(parsed.payoutId).toBe('1');
    expect(parsed.payoutCode).toBe('PO-1');
    expect(parsed.commissionRate).toBe(10);
    expect(parsed.bookings[0].tourName).toBe('Hoi An Night Walk');
    expect(parsed.bookings[1].tourName).toBeNull();
  });

  it.each([
    { payoutCode: 'XO-1' },
    { payoutId: 1 },
    { status: 'Approved' },
    { commissionRate: -1 },
    { bookings: [{ ...detail.bookings[0], bookingCode: 5 }] },
    { bookings: 'nope' },
  ])('rejects a payload mutated with %j', mutation => {
    expect(() => parsePayoutDetail({ ...detail, ...mutation })).toThrow();
  });

  it('formats periods as dd/MM/yyyy ranges', () => {
    expect(formatPeriodRange('2026-08-01', '2026-08-31')).toBe('01/08/2026 – 31/08/2026');
  });
});
