import { describe, expect, it } from 'vitest';

import {
  PAYOUT_REASON_MAX_LENGTH,
  PAYOUT_REASON_MIN_LENGTH,
  formatCommissionRate,
  isReviewable,
  isValidPayoutId,
  parsePayoutDetail,
  validateRejectionReason,
} from './payoutReview';

const detail = {
  payoutId: '123',
  payoutCode: 'PO-123',
  status: 'PendingReview',
  settlementPeriod: { startDate: '2026-09-01', endDate: '2026-09-30' },
  tourOperator: { operatorId: '45', companyName: 'Hoi An Tours' },
  grossRevenue: 12000000,
  commissionRate: 0.1,
  commissionAmount: 1200000,
  netPayoutAmount: 10800000,
  requestedAtUtc: '2026-10-03T08:15:00Z',
  contributingBookings: [
    { bookingId: '9001', bookingCode: 'BK-9001', tourName: 'Marble Mountains', completedAtUtc: '2026-09-12T10:00:00Z', paidAmount: 500000, refundedAmount: 0, netAmount: 500000 },
  ],
  beneficiary: { bankName: 'Vietcombank', accountHolder: 'NGUYEN VAN A', maskedAccountNumber: 'XXXXXXXX1234' },
  rejectionReason: null,
};

describe('validateRejectionReason', () => {
  it('uses the decided boundaries', () => {
    expect(PAYOUT_REASON_MIN_LENGTH).toBe(10);
    expect(PAYOUT_REASON_MAX_LENGTH).toBe(500);
  });

  it.each([
    ['9 characters', 'a'.repeat(9), false],
    ['10 characters', 'a'.repeat(10), true],
    ['500 characters', 'a'.repeat(500), true],
    ['501 characters', 'a'.repeat(501), false],
  ])('accepts or rejects %s', (_label, value, accepted) => {
    const result = validateRejectionReason(value);
    expect(result.ok).toBe(accepted);
    if (!result.ok) expect(result.messageCode).toBe('MSG157');
  });

  it('trims before measuring, so padded short input is rejected', () => {
    expect(validateRejectionReason('   short   ').ok).toBe(false);
    const accepted = validateRejectionReason(`   ${'a'.repeat(10)}   `);
    expect(accepted).toEqual({ ok: true, value: 'a'.repeat(10) });
  });

  it('rejects whitespace-only and null-like input', () => {
    expect(validateRejectionReason('          ').ok).toBe(false);
    expect(validateRejectionReason(null as unknown as string).ok).toBe(false);
  });
});

describe('isValidPayoutId', () => {
  it.each(['1', '123', '9223372036854775807'])('accepts %s', (value) => {
    expect(isValidPayoutId(value)).toBe(true);
  });

  it.each(['0', '-1', '01', '1.5', 'abc', '', '9223372036854775808'])('rejects %s', (value) => {
    expect(isValidPayoutId(value)).toBe(false);
  });
});

describe('formatCommissionRate', () => {
  it('formats the ratio as a percentage, never as the raw decimal', () => {
    expect(formatCommissionRate(0.1)).toBe('10%');
    expect(formatCommissionRate(0)).toBe('0%');
    expect(formatCommissionRate(0.125)).toBe('12.5%');
  });
});

describe('isReviewable', () => {
  it('is true only for PendingReview', () => {
    expect(isReviewable('PendingReview')).toBe(true);
    expect(isReviewable('ApprovedForSettlement')).toBe(false);
    expect(isReviewable('Rejected')).toBe(false);
  });
});

describe('parsePayoutDetail', () => {
  it('parses a full payload keeping IDs as strings', () => {
    const parsed = parsePayoutDetail(detail);
    expect(parsed.payoutId).toBe('123');
    expect(parsed.contributingBookings[0].bookingId).toBe('9001');
    expect(parsed.beneficiary.maskedAccountNumber).toBe('XXXXXXXX1234');
  });

  it('accepts a null masked account number', () => {
    const parsed = parsePayoutDetail({ ...detail, beneficiary: { ...detail.beneficiary, maskedAccountNumber: null } });
    expect(parsed.beneficiary.maskedAccountNumber).toBeNull();
  });

  it('accepts an entirely null beneficiary and a null requestedAtUtc (no UC-46 snapshot yet)', () => {
    const parsed = parsePayoutDetail({
      ...detail,
      requestedAtUtc: null,
      beneficiary: { bankName: null, accountHolder: null, maskedAccountNumber: null },
    });
    expect(parsed.requestedAtUtc).toBeNull();
    expect(parsed.beneficiary).toEqual({ bankName: null, accountHolder: null, maskedAccountNumber: null });
  });

  it.each([
    { payoutId: 123 },
    { status: 'Unknown' },
    { grossRevenue: '12000000' },
    { contributingBookings: 'none' },
    { beneficiary: null },
  ])('rejects invalid payload %o', (override) => {
    expect(() => parsePayoutDetail({ ...detail, ...override })).toThrow();
  });

  it('rejects non-object bodies such as HTML or null', () => {
    expect(() => parsePayoutDetail('<html></html>')).toThrow();
    expect(() => parsePayoutDetail(null)).toThrow();
  });
});
