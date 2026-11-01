import { describe, expect, it } from 'vitest';

import { parsePayoutsResponse } from '../payout-records/payoutRecords';
import {
  SETTLEMENT_STATUSES,
  authorizeBlockedReason,
  canAuthorize,
  defaultSettlementSearch,
  failureMessage,
  formatSettlementStatus,
  gatewayStateText,
  parseAuthorizeResult,
  parseSettlementDetail,
  parseSettlementQueue,
  parseSettlementSearch,
  serializeSettlementSearch,
  type SettlementDetail,
} from './payoutSettlement';

const detailBody = {
  payoutId: '123',
  payoutCode: 'PO-000123',
  status: 'ApprovedForSettlement',
  settlementPeriod: { startDate: '2026-09-01', endDate: '2026-09-30' },
  tourOperator: { operatorId: '7', companyName: 'Company' },
  grossRevenue: 12000000.0,
  commissionRate: 0.1,
  commissionAmount: 1200000.0,
  netPayoutAmount: 10800000.0,
  requestedAtUtc: '2026-10-03T08:15:00+00:00',
  reviewedAtUtc: '2026-10-04T08:15:00+00:00',
  reviewedBy: '5',
  settlementAuthorizedAtUtc: null,
  settlementAuthorizedBy: null,
  beneficiary: { bankName: 'Vietcombank', accountHolder: 'Nguyen Van A', maskedAccountNumber: '****1234' },
  bankBinResolved: true,
  outcome: null,
};

const processingBody = {
  ...detailBody,
  status: 'SettlementProcessing',
  settlementAuthorizedAtUtc: '2026-11-01T09:00:00+00:00',
  settlementAuthorizedBy: '2',
  outcome: {
    gatewayState: 'Submitted',
    failureCode: null,
    submittedAtUtc: '2026-11-01T09:00:05+00:00',
    reconciliationRequired: false,
  },
};

const queueBody = {
  pageNumber: 1, pageSize: 20, totalCount: 1, totalPages: 1, totalAmount: 10800000,
  items: [{
    payoutId: '123', payoutCode: 'PO-000123',
    operator: { userId: '7', companyName: 'Company' },
    periodStart: '2026-09-01', periodEnd: '2026-09-30', periodCount: 1,
    grossRevenue: 12000000, commissionAmount: 1200000, netAmount: 10800000,
    requestedAtUtc: '2026-10-03T08:15:00+00:00', status: 'SettlementProcessing',
  }],
};

describe('settlement statuses', () => {
  it('lists exactly the four statuses the settlement endpoint accepts, approved first', () => {
    expect(SETTLEMENT_STATUSES).toEqual(['ApprovedForSettlement', 'SettlementProcessing', 'Settled', 'SettlementFailed']);
    expect(formatSettlementStatus('SettlementFailed')).toBe('Settlement failed');
    expect(formatSettlementStatus('ApprovedForSettlement')).toBe('Approved for settlement');
  });
});

describe('settlement search', () => {
  it('defaults to the approved queue and does not serialize the default status', () => {
    expect(defaultSettlementSearch().status).toBe('ApprovedForSettlement');
    expect(serializeSettlementSearch(defaultSettlementSearch()).toString()).toBe('');
  });

  it('normalizes an unknown or Staff-only status to the default', () => {
    for (const status of ['PendingReview', 'Rejected', 'nonsense', '']) {
      expect(parseSettlementSearch(new URLSearchParams({ status })).status).toBe('ApprovedForSettlement');
    }
  });

  it('keeps a valid status, trims and caps the keyword, drops bad dates and bad pages', () => {
    const search = parseSettlementSearch(new URLSearchParams({
      status: 'Settled', keyword: `  ${'a'.repeat(250)}  `, periodFrom: '2026-13-x', periodTo: '2026-09-30', pageNumber: '0',
    }));
    expect(search.status).toBe('Settled');
    expect(search.keyword).toHaveLength(200);
    expect(search.periodFrom).toBe('');
    expect(search.periodTo).toBe('2026-09-30');
    expect(search.pageNumber).toBe(1);
  });

  it('round-trips through the query string', () => {
    const search = { keyword: 'Hoi An', status: 'SettlementFailed' as const, periodFrom: '2026-08-01', periodTo: '2026-09-30', pageNumber: 3 };
    expect(parseSettlementSearch(serializeSettlementSearch(search))).toEqual(search);
    expect(serializeSettlementSearch(search).get('status')).toBe('SettlementFailed');
  });
});

describe('settlement queue parser', () => {
  it('accepts settlement statuses and keeps string ids', () => {
    const parsed = parseSettlementQueue(queueBody);
    expect(parsed.items[0].status).toBe('SettlementProcessing');
    expect(parsed.items[0].payoutId).toBe('123');
  });

  it('rejects a status outside the settlement scope', () => {
    expect(() => parseSettlementQueue({ ...queueBody, items: [{ ...queueBody.items[0], status: 'PendingReview' }] })).toThrow();
  });

  it('leaves the Staff list parser unchanged: it still refuses settlement statuses', () => {
    expect(() => parsePayoutsResponse(queueBody)).toThrow();
  });
});

describe('settlement detail parser', () => {
  it('parses an approved payout with a null outcome', () => {
    const parsed = parseSettlementDetail(detailBody);
    expect(parsed.outcome).toBeNull();
    expect(parsed.beneficiary.maskedAccountNumber).toBe('****1234');
    expect(parsed.bankBinResolved).toBe(true);
  });

  it('parses the outcome of a processing payout', () => {
    const parsed = parseSettlementDetail(processingBody);
    expect(parsed.outcome).toEqual({
      gatewayState: 'Submitted', failureCode: null,
      submittedAtUtc: '2026-11-01T09:00:05+00:00', reconciliationRequired: false,
    });
    expect(parsed.settlementAuthorizedBy).toBe('2');
  });

  it('accepts null beneficiary values', () => {
    const parsed = parseSettlementDetail({
      ...detailBody, beneficiary: { bankName: null, accountHolder: null, maskedAccountNumber: null }, bankBinResolved: false,
    });
    expect(parsed.beneficiary.bankName).toBeNull();
  });

  it.each([
    ['not an object', 'text'],
    ['null', null],
    ['array', []],
    ['unknown status', { ...detailBody, status: 'PendingReview' }],
    ['non-numeric id', { ...detailBody, payoutId: 'abc' }],
    ['string amount', { ...detailBody, netPayoutAmount: '10800000' }],
    ['negative amount', { ...detailBody, grossRevenue: -1 }],
    ['missing bankBinResolved', { ...detailBody, bankBinResolved: undefined }],
    ['non-boolean bankBinResolved', { ...detailBody, bankBinResolved: 'true' }],
    ['missing beneficiary', { ...detailBody, beneficiary: undefined }],
    ['outcome without reconciliationRequired', { ...processingBody, outcome: { gatewayState: 'Submitted', failureCode: null, submittedAtUtc: null } }],
    ['outcome not an object', { ...processingBody, outcome: 'Submitted' }],
  ])('rejects %s', (_name, body) => {
    expect(() => parseSettlementDetail(body)).toThrow();
  });
});

describe('authorize result parser', () => {
  it('accepts the 202 body', () => {
    expect(parseAuthorizeResult({
      payoutId: '123', payoutCode: 'PO-000123', status: 'SettlementProcessing', authorizedAtUtc: '2026-11-01T09:00:00+00:00',
    }).status).toBe('SettlementProcessing');
  });

  it.each([
    [null],
    [{ payoutId: '123', payoutCode: 'PO-1', status: 'Settled', authorizedAtUtc: '2026-11-01T09:00:00+00:00' }],
    [{ payoutId: 'x', payoutCode: 'PO-1', status: 'SettlementProcessing', authorizedAtUtc: '2026-11-01T09:00:00+00:00' }],
    [{ payoutId: '1', payoutCode: 'PO-1', status: 'SettlementProcessing' }],
  ])('rejects a malformed body %#', (body) => {
    expect(() => parseAuthorizeResult(body)).toThrow();
  });
});

describe('failure and gateway text', () => {
  it.each([
    ['gateway_rejected', 'The bank or payment provider rejected the transfer.'],
    ['gateway_failed', 'The transfer failed at the bank.'],
    ['gateway_cancelled', 'The transfer was cancelled.'],
    ['gateway_reversed', 'The transfer was returned by the bank.'],
    ['gateway_insufficient_balance', 'The payout account does not have enough balance.'],
    ['gateway_invalid_account', 'The beneficiary account was not accepted by the bank.'],
    ['gateway_unauthorized', 'The payment provider refused our credentials. Contact the developers.'],
    ['gateway_unavailable', 'The payment provider was unavailable.'],
    ['beneficiary_incomplete', 'The beneficiary bank details are incomplete.'],
    ['beneficiary_unreadable', 'The saved bank account could not be read. The Operator must save it again.'],
  ])('maps %s', (code, text) => {
    expect(failureMessage(code)).toBe(text);
  });

  it('falls back for unknown or missing codes', () => {
    expect(failureMessage('something_new')).toBe('The transfer could not be completed.');
    expect(failureMessage(null)).toBe('The transfer could not be completed.');
  });

  it('does not call the transfer of a failed payout completed', () => {
    expect(gatewayStateText('Completed', 'SettlementFailed')).toBe('Transfer not completed');
    expect(gatewayStateText('Completed', 'Settled')).toBe('Transfer completed');
    expect(gatewayStateText('Completed')).toBe('Transfer completed');
  });

  it.each([
    ['NotQueued', 'Not queued for transfer'],
    ['Pending', 'Waiting to be sent to the bank'],
    ['Submitting', 'Being sent to the bank'],
    ['Submitted', "Sent. Waiting for the bank's confirmation"],
    ['Completed', 'Transfer completed'],
    ['ManualReconciliation', 'Needs manual reconciliation'],
    ['Weird', 'Status unavailable'],
  ])('maps gateway state %s', (state, text) => {
    expect(gatewayStateText(state)).toBe(text);
  });
});

describe('canAuthorize', () => {
  const approved = parseSettlementDetail(detailBody);
  const withBeneficiary = (beneficiary: Partial<SettlementDetail['beneficiary']>, bankBinResolved = true): SettlementDetail =>
    ({ ...approved, beneficiary: { ...approved.beneficiary, ...beneficiary }, bankBinResolved });

  it('allows an approved payout with a complete, resolvable beneficiary', () => {
    expect(canAuthorize(approved)).toBe(true);
    expect(authorizeBlockedReason(approved)).toBeNull();
  });

  it('blocks when the bank is not in the standard list', () => {
    const detail = withBeneficiary({}, false);
    expect(canAuthorize(detail)).toBe(false);
    expect(authorizeBlockedReason(detail)).toContain('standard bank list');
  });

  it.each([
    [{ bankName: null }], [{ accountHolder: null }], [{ maskedAccountNumber: null }], [{ bankName: '   ' }],
  ])('blocks an incomplete beneficiary %#', (patch) => {
    const detail = withBeneficiary(patch);
    expect(canAuthorize(detail)).toBe(false);
    expect(authorizeBlockedReason(detail)).toContain('bank account details');
  });

  it('never allows a payout that is not waiting for authorization', () => {
    const processing = parseSettlementDetail(processingBody);
    expect(canAuthorize(processing)).toBe(false);
    expect(authorizeBlockedReason(processing)).toBeNull();
  });
});
