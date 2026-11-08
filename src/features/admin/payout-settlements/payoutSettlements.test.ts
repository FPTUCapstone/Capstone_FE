import { describe, expect, it } from 'vitest';

import {
  formatRunDate,
  parseFailedPayoutBatchDetail,
  parsePayoutSettlementListItem,
  parsePayoutSettlementsResponse,
  validateManualTransferReference,
} from './payoutSettlements';

const listItem = {
  settlementId: 101,
  bookingId: 55,
  tourOperatorUserId: 7,
  runDate: '2026-11-08',
  kind: 'Main',
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

  it('accepts every backend status, including the "Carried Over" status with a space', () => {
    for (const status of ['Scheduled', 'Processing', 'Settled', 'SettlementFailed', 'Carried Over']) {
      expect(parsePayoutSettlementListItem({ ...listItem, status }).status).toBe(status);
    }
  });

  it('accepts both settlement kinds', () => {
    expect(parsePayoutSettlementListItem({ ...listItem, kind: 'Retained' }).kind).toBe('Retained');
  });

  it.each([
    ['unrecognized status', { ...listItem, status: 'Mystery' }],
    ['unrecognized kind', { ...listItem, kind: 'Bonus' }],
    ['non-numeric settlementId', { ...listItem, settlementId: '101' }],
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

describe('validateManualTransferReference', () => {
  it('accepts a non-blank reference and trims it', () => {
    expect(validateManualTransferReference('  SIM-TRX-002  ')).toEqual({ ok: true, value: 'SIM-TRX-002' });
  });

  it.each([
    ['empty string', ''],
    ['whitespace only', '   '],
    ['not a string', 42],
    ['null', null],
    ['undefined', undefined],
  ])('rejects %s', (_label, value) => {
    expect(validateManualTransferReference(value)).toEqual({ ok: false });
  });
});

describe('formatRunDate', () => {
  it('formats a calendar date without shifting it to a different day', () => {
    expect(formatRunDate('2026-11-08')).toBe('8 Nov 2026');
    expect(formatRunDate('2026-01-01')).toBe('1 Jan 2026');
  });
});
