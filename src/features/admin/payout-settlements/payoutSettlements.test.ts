import { describe, expect, it } from 'vitest';

import {
  defaultPayoutSettlementsSearch,
  formatRunDate,
  formatVietnamDateTime,
  formatVnd,
  parseFailedPayoutBatchDetail,
  parsePayoutSettlementListItem,
  parsePayoutSettlementsResponse,
  parsePayoutSettlementsSearch,
  PAYOUT_SETTLEMENT_STATUSES,
  serializePayoutSettlementsSearch,
  validateResolutionReason,
  validRunDateRange,
} from './payoutSettlements';

const listItem = {
  settlementId: 101,
  batchId: 42,
  bookingId: 55,
  tourOperatorUserId: 7,
  runDate: '2026-11-08',
  kind: 'Advance',
  payoutAmount: 1_800_000,
  status: 'Settled',
  transferReference: 'SIM-TRX-001',
};

const response = { pageNumber: 1, pageSize: 20, totalCount: 1, items: [listItem] };

const attempt = { attemptNumber: 1, sentAtUtc: '2026-11-08T03:00:00Z', outcome: 'Failed', failureReason: 'Gateway timeout' };

const failedDetail = {
  batchId: 42,
  tourOperatorUserId: 7,
  runDate: '2026-11-08',
  totalAmount: 1_800_000,
  status: 'SettlementFailed',
  attemptCount: 1,
  attempts: [attempt],
};

describe('parsePayoutSettlementListItem', () => {
  it('parses a complete, well-typed item', () => {
    expect(parsePayoutSettlementListItem(listItem)).toEqual(listItem);
  });

  it('accepts a null transfer reference', () => {
    expect(parsePayoutSettlementListItem({ ...listItem, transferReference: null }).transferReference).toBeNull();
  });

  it('accepts every backend status, including "Resolved" and "Awaiting Window" with a space', () => {
    expect(PAYOUT_SETTLEMENT_STATUSES).toContain('Awaiting Window');
    expect(PAYOUT_SETTLEMENT_STATUSES).toContain('Resolved');
    expect(PAYOUT_SETTLEMENT_STATUSES).not.toContain('Carried Over');
    for (const status of PAYOUT_SETTLEMENT_STATUSES) {
      expect(parsePayoutSettlementListItem({ ...listItem, status }).status).toBe(status);
    }
  });

  it('accepts both settlement kinds', () => {
    expect(parsePayoutSettlementListItem({ ...listItem, kind: 'Final' }).kind).toBe('Final');
  });

  it('rejects the old pre-v7 kind and status values', () => {
    expect(() => parsePayoutSettlementListItem({ ...listItem, kind: 'Main' })).toThrow();
    expect(() => parsePayoutSettlementListItem({ ...listItem, kind: 'Retained' })).toThrow();
    expect(() => parsePayoutSettlementListItem({ ...listItem, status: 'Carried Over' })).toThrow();
  });

  // An "Awaiting Window" row (UC-72, BE Task 10A) is synthesized for a booking with no
  // settlement yet — it has no settlementId, batchId or runDate, unlike a real settlement row.
  it('accepts a null settlementId, batchId and runDate for an Awaiting Window row', () => {
    const awaiting = { ...listItem, settlementId: null, batchId: null, runDate: null, status: 'Awaiting Window' };
    const parsed = parsePayoutSettlementListItem(awaiting);
    expect(parsed.settlementId).toBeNull();
    expect(parsed.batchId).toBeNull();
    expect(parsed.runDate).toBeNull();
  });

  it.each([
    ['unrecognized status', { ...listItem, status: 'Mystery' }],
    ['unrecognized kind', { ...listItem, kind: 'Bonus' }],
    ['non-numeric settlementId', { ...listItem, settlementId: '101' }],
    ['non-numeric batchId', { ...listItem, batchId: '42' }],
    ['negative payoutAmount', { ...listItem, payoutAmount: -1 }],
    ['malformed runDate', { ...listItem, runDate: '2026/11/08' }],
    ['non-string transferReference', { ...listItem, transferReference: 42 }],
    ['not an object', 'not-an-object'],
    ['null', null],
    ['array instead of object', ['nope']],
  ])('rejects %s', (_label, value) => {
    expect(() => parsePayoutSettlementListItem(value)).toThrow();
  });
});

describe('parsePayoutSettlementsResponse', () => {
  it('parses a complete page', () => {
    expect(parsePayoutSettlementsResponse(response)).toEqual(response);
  });

  it('parses an empty page', () => {
    expect(parsePayoutSettlementsResponse({ ...response, totalCount: 0, items: [] }).items).toEqual([]);
  });

  it.each([
    ['missing pageNumber', { ...response, pageNumber: undefined }],
    ['non-integer pageSize', { ...response, pageSize: 20.5 }],
    ['items not an array', { ...response, items: {} }],
    ['one invalid item in the list', { ...response, items: [{ ...listItem, status: 'Mystery' }] }],
    ['HTML error page instead of JSON', '<html><body>502 Bad Gateway</body></html>'],
    ['null', null],
  ])('rejects %s', (_label, value) => {
    expect(() => parsePayoutSettlementsResponse(value)).toThrow();
  });
});

describe('parseFailedPayoutBatchDetail', () => {
  it('parses a complete failed batch with its attempt history', () => {
    expect(parseFailedPayoutBatchDetail(failedDetail)).toEqual(failedDetail);
  });

  it('accepts every attempt outcome', () => {
    for (const outcome of ['Sent', 'Succeeded', 'Failed', 'Timeout', 'Rejected']) {
      const detail = { ...failedDetail, attempts: [{ ...attempt, outcome }] };
      expect(parseFailedPayoutBatchDetail(detail).attempts[0].outcome).toBe(outcome);
    }
  });

  it('accepts a null failure reason', () => {
    const detail = { ...failedDetail, attempts: [{ ...attempt, failureReason: null }] };
    expect(parseFailedPayoutBatchDetail(detail).attempts[0].failureReason).toBeNull();
  });

  it('accepts an empty attempt history', () => {
    expect(parseFailedPayoutBatchDetail({ ...failedDetail, attemptCount: 0, attempts: [] }).attempts).toEqual([]);
  });

  it.each([
    ['unrecognized attempt outcome', { ...failedDetail, attempts: [{ ...attempt, outcome: 'Mystery' }] }],
    ['malformed sentAtUtc', { ...failedDetail, attempts: [{ ...attempt, sentAtUtc: 'not-a-date' }] }],
    ['non-numeric batchId', { ...failedDetail, batchId: '42' }],
    ['malformed runDate', { ...failedDetail, runDate: '08-11-2026' }],
    ['attempts not an array', { ...failedDetail, attempts: {} }],
    ['HTML error page instead of JSON', '<html>502</html>'],
  ])('rejects %s', (_label, value) => {
    expect(() => parseFailedPayoutBatchDetail(value)).toThrow();
  });
});

describe('validateResolutionReason', () => {
  it('accepts a non-blank reason and trims it', () => {
    expect(validateResolutionReason('  Operator confirmed receipt out of band  ')).toEqual({
      ok: true,
      value: 'Operator confirmed receipt out of band',
    });
  });

  it.each([
    ['empty string', ''],
    ['whitespace only', '   '],
    ['not a string', 42],
    ['null', null],
    ['undefined', undefined],
  ])('rejects %s', (_label, value) => {
    expect(validateResolutionReason(value)).toEqual({ ok: false });
  });
});

describe('formatRunDate', () => {
  it('formats a calendar date without shifting it to a different day', () => {
    expect(formatRunDate('2026-11-08')).toBe('8 Nov 2026');
    expect(formatRunDate('2026-01-01')).toBe('1 Jan 2026');
  });
});

describe('formatVnd', () => {
  it('formats a VND amount', () => {
    expect(formatVnd(1_800_000)).toContain('1.800.000');
  });
});

describe('formatVietnamDateTime', () => {
  it('formats a UTC timestamp in Vietnam local time', () => {
    // 2026-11-08T03:00:00Z = 10:00 Asia/Ho_Chi_Minh (UTC+7).
    expect(formatVietnamDateTime('2026-11-08T03:00:00Z')).toBe('8 Nov 2026, 10:00');
  });
});

describe('payout settlements search state', () => {
  it('defaults to no filters and page 1', () => {
    expect(defaultPayoutSettlementsSearch()).toEqual({ status: '', runDateFrom: '', runDateTo: '', pageNumber: 1 });
  });

  it('round-trips a fully populated search through parse and serialize', () => {
    const search = { status: 'Awaiting Window' as const, runDateFrom: '2026-11-01', runDateTo: '2026-11-08', pageNumber: 3 };
    const serialized = serializePayoutSettlementsSearch(search);
    expect(parsePayoutSettlementsSearch(serialized)).toEqual(search);
  });

  it.each([
    ['unrecognized status', 'status=Mystery', { status: '' }],
    ['malformed runDateFrom', 'runDateFrom=2026/11/01', { runDateFrom: '' }],
    ['malformed runDateTo', 'runDateTo=not-a-date', { runDateTo: '' }],
    ['non-positive pageNumber', 'pageNumber=0', { pageNumber: 1 }],
    ['non-numeric pageNumber', 'pageNumber=abc', { pageNumber: 1 }],
  ])('falls back to the default for %s', (_label, query, expected) => {
    expect(parsePayoutSettlementsSearch(new URLSearchParams(query))).toMatchObject(expected);
  });

  it('omits page 1 and empty filters from the serialized query', () => {
    expect(serializePayoutSettlementsSearch(defaultPayoutSettlementsSearch()).toString()).toBe('');
  });
});

describe('validRunDateRange', () => {
  it('accepts an empty range, an equal range, and an ordered range', () => {
    expect(validRunDateRange('', '')).toBe(true);
    expect(validRunDateRange('2026-11-01', '')).toBe(true);
    expect(validRunDateRange('2026-11-01', '2026-11-01')).toBe(true);
    expect(validRunDateRange('2026-11-01', '2026-11-08')).toBe(true);
  });

  it('rejects an inverted range', () => {
    expect(validRunDateRange('2026-11-08', '2026-11-01')).toBe(false);
  });
});
