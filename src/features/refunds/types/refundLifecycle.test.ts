import { describe, expect, it } from 'vitest';

import {
  parseRefundDetail,
  parseRefundListResponse,
  REFUND_STATUSES,
  validateReturnReference,
} from './refundLifecycle';

const detail = {
  refundId: 501,
  bookingId: 42,
  bookingCode: 'BK-20261022-00042',
  tourName: 'Ha Long Bay 3D2N',
  departureDate: '2026-12-01',
  paidAmount: 5_000_000,
  referenceCode: 'CXL-00042',
  refundAmount: 5_000_000,
  operatorReturnShare: 3_500_000,
  returnDeadlineAtUtc: '2026-12-05T00:00:00Z',
  returnReference: null,
  returnReportedAtUtc: null,
  status: 'AwaitingPartnerReturn',
};

const listItem = {
  refundId: 501,
  bookingCode: 'BK-20261022-00042',
  tourOperatorUserId: 7,
  amount: 3_500_000,
  returnReference: 'FT-998877',
  returnReportedAtUtc: '2026-12-02T03:00:00Z',
  status: 'ReturnReported',
  attemptCount: null,
  lastErrorCode: null,
};

describe('parseRefundDetail', () => {
  it('parses a complete, well-typed detail', () => {
    expect(parseRefundDetail(detail)).toEqual(detail);
  });

  it.each(REFUND_STATUSES)('accepts every known status (%s)', (status) => {
    expect(parseRefundDetail({ ...detail, status }).status).toBe(status);
  });

  it('rejects an unknown status rather than silently accepting it', () => {
    expect(() => parseRefundDetail({ ...detail, status: 'SomeFutureStatus' })).toThrow();
  });

  it('rejects a missing required field', () => {
    const incomplete: Record<string, unknown> = { ...detail };
    delete incomplete.bookingCode;
    expect(() => parseRefundDetail(incomplete)).toThrow();
  });

  it('accepts null for every nullable field', () => {
    expect(
      parseRefundDetail({ ...detail, referenceCode: null, returnDeadlineAtUtc: null, returnReference: null, returnReportedAtUtc: null }),
    ).toMatchObject({ referenceCode: null, returnDeadlineAtUtc: null, returnReference: null, returnReportedAtUtc: null });
  });
});

describe('parseRefundListResponse', () => {
  it('parses a complete response', () => {
    const response = { pageNumber: 1, pageSize: 20, totalCount: 1, items: [listItem] };
    expect(parseRefundListResponse(response)).toEqual(response);
  });

  it('rejects an item with an unknown status', () => {
    const response = { pageNumber: 1, pageSize: 20, totalCount: 1, items: [{ ...listItem, status: 'Nope' }] };
    expect(() => parseRefundListResponse(response)).toThrow();
  });

  it('accepts a null attemptCount/lastErrorCode (Reconciliation rows, not Escalated)', () => {
    const response = { pageNumber: 1, pageSize: 20, totalCount: 1, items: [listItem] };
    expect(parseRefundListResponse(response).items[0]).toMatchObject({ attemptCount: null, lastErrorCode: null });
  });

  it('rejects a malformed envelope', () => {
    expect(() => parseRefundListResponse({ pageNumber: 1, items: [] })).toThrow();
  });
});

describe('validateReturnReference', () => {
  it('rejects blank and whitespace-only input', () => {
    expect(validateReturnReference('')).toEqual({ ok: false });
    expect(validateReturnReference('   ')).toEqual({ ok: false });
  });

  it('rejects a non-string value', () => {
    expect(validateReturnReference(undefined)).toEqual({ ok: false });
  });

  it('trims and accepts a non-blank value', () => {
    expect(validateReturnReference('  FT-998877  ')).toEqual({ ok: true, value: 'FT-998877' });
  });
});
