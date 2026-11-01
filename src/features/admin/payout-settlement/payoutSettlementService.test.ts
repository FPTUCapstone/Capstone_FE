import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  PayoutSettlementError,
  authorizeSettlement,
  fetchSettlementDetail,
  fetchSettlementQueue,
} from './payoutSettlementService';
import { defaultSettlementSearch } from './payoutSettlement';

const detail = {
  payoutId: '123', payoutCode: 'PO-000123', status: 'ApprovedForSettlement',
  settlementPeriod: { startDate: '2026-09-01', endDate: '2026-09-30' },
  tourOperator: { operatorId: '7', companyName: 'Company' },
  grossRevenue: 12000000, commissionRate: 0.1, commissionAmount: 1200000, netPayoutAmount: 10800000,
  requestedAtUtc: '2026-10-03T08:15:00+00:00', reviewedAtUtc: null, reviewedBy: null,
  settlementAuthorizedAtUtc: null, settlementAuthorizedBy: null,
  beneficiary: { bankName: 'Vietcombank', accountHolder: 'Nguyen Van A', maskedAccountNumber: '****1234' },
  bankBinResolved: true, outcome: null,
};

const queue = {
  pageNumber: 1, pageSize: 20, totalCount: 0, totalPages: 0, totalAmount: 0, items: [],
};

const accepted = {
  payoutId: '123', payoutCode: 'PO-000123', status: 'SettlementProcessing', authorizedAtUtc: '2026-11-01T09:00:00+00:00',
};

afterEach(() => vi.unstubAllGlobals());

const stubFetch = (response: Response | Promise<Response>) => {
  const fetchMock = vi.fn().mockReturnValue(response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

describe('fetchSettlementQueue', () => {
  it('calls the settlement proxy with the serialized search and parses the page', async () => {
    const fetchMock = stubFetch(Response.json(queue));

    const result = await fetchSettlementQueue({ ...defaultSettlementSearch(), status: 'Settled', pageNumber: 2 });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/admin/payout-settlements?status=Settled&pageNumber=2');
    expect(init.credentials).toBe('same-origin');
    expect(result.totalCount).toBe(0);
  });

  it('sends no query string for the default search', async () => {
    const fetchMock = stubFetch(Response.json(queue));
    await fetchSettlementQueue(defaultSettlementSearch());
    expect(fetchMock.mock.calls[0][0]).toBe('/api/admin/payout-settlements');
  });

  it('carries the title and error code of a 400', async () => {
    stubFetch(Response.json({ title: 'Bad period.', errorCode: 'payout.invalid_period_range' }, { status: 400 }));
    await expect(fetchSettlementQueue(defaultSettlementSearch())).rejects.toMatchObject({
      status: 400, errorCode: 'payout.invalid_period_range', errorMessage: 'Bad period.',
    });
  });

  it('treats a response with an out-of-scope status as a failure', async () => {
    stubFetch(Response.json({ ...queue, items: [{ status: 'PendingReview' }] }));
    await expect(fetchSettlementQueue(defaultSettlementSearch())).rejects.toMatchObject({ status: 0 });
  });
});

describe('fetchSettlementDetail', () => {
  it('calls the detail proxy, escapes the id and parses the payload', async () => {
    const fetchMock = stubFetch(Response.json(detail));
    const parsed = await fetchSettlementDetail('123');
    expect(fetchMock.mock.calls[0][0]).toBe('/api/admin/payout-settlements/123');
    expect(parsed.payoutCode).toBe('PO-000123');
  });

  it.each([401, 403, 404, 500, 503])('surfaces status %i', async (status) => {
    stubFetch(Response.json({ title: 'x' }, { status }));
    const error = await fetchSettlementDetail('123').catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(PayoutSettlementError);
    expect((error as PayoutSettlementError).status).toBe(status);
  });

  it('maps a network failure to status 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('failed')));
    await expect(fetchSettlementDetail('123')).rejects.toMatchObject({ status: 0 });
  });

  it('re-throws an abort untouched', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('aborted', 'AbortError')));
    await expect(fetchSettlementDetail('123')).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('treats a malformed or HTML body on 200 as a failure, not a success', async () => {
    stubFetch(Response.json({ payoutId: '123' }));
    await expect(fetchSettlementDetail('123')).rejects.toMatchObject({ status: 0 });
    stubFetch(new Response('<html>login</html>', { status: 200 }));
    await expect(fetchSettlementDetail('123')).rejects.toMatchObject({ status: 0 });
  });
});

describe('authorizeSettlement', () => {
  it('POSTs to the authorize proxy with no body and parses the 202', async () => {
    const fetchMock = stubFetch(Response.json(accepted, { status: 202 }));

    const result = await authorizeSettlement('123');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/admin/payout-settlements/123/authorize');
    expect(init.method).toBe('POST');
    expect(init.body).toBeUndefined();
    expect(init.credentials).toBe('same-origin');
    expect(result.status).toBe('SettlementProcessing');
  });

  it('exposes the 409 conflict with the current status', async () => {
    stubFetch(Response.json({
      title: 'Not approved.', errorCode: 'payout.not_approved_for_settlement', currentStatus: 'SettlementProcessing',
    }, { status: 409 }));
    const error = await authorizeSettlement('123').catch((caught: unknown) => caught) as PayoutSettlementError;
    expect(error.status).toBe(409);
    expect(error.errorCode).toBe('payout.not_approved_for_settlement');
    expect(error.currentStatus).toBe('SettlementProcessing');
  });

  it.each(['payout.beneficiary_incomplete', 'payout.bank_bin_unresolved', 'payout.amount_invalid'])(
    'exposes the 422 code %s',
    async (errorCode) => {
      stubFetch(Response.json({ title: 'Cannot authorize.', errorCode }, { status: 422 }));
      await expect(authorizeSettlement('123')).rejects.toMatchObject({ status: 422, errorCode });
    },
  );

  it('does not treat a 200 with a wrong body as accepted', async () => {
    stubFetch(Response.json({ ...accepted, status: 'Settled' }, { status: 202 }));
    await expect(authorizeSettlement('123')).rejects.toMatchObject({ status: 0 });
  });

  it('maps a network failure to status 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('failed')));
    await expect(authorizeSettlement('123')).rejects.toMatchObject({ status: 0 });
  });
});
