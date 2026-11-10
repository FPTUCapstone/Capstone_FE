import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  PayoutSettlementsError,
  carryOverFailedPayoutBatch,
  fetchFailedPayoutBatchDetail,
  fetchPayoutSettlements,
  recordManualPayoutSettlement,
  retryFailedPayoutBatch,
} from './payoutSettlementsService';

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function htmlResponse(status = 502): Response {
  return new Response('<html><body>Bad Gateway</body></html>', { status, headers: { 'Content-Type': 'text/html' } });
}

const listItem = {
  settlementId: 1, batchId: 42, bookingId: 2, tourOperatorUserId: 3, runDate: '2026-11-08',
  kind: 'Main', payoutAmount: 100_000, status: 'Settled', transferReference: 'SIM-1',
};
const listResponse = { pageNumber: 1, pageSize: 20, totalCount: 1, items: [listItem] };

const detail = {
  batchId: 42, tourOperatorUserId: 3, runDate: '2026-11-08', totalAmount: 100_000,
  status: 'SettlementFailed', attemptCount: 1,
  attempts: [{ attemptNumber: 1, sentAtUtc: '2026-11-08T03:00:00Z', outcome: 'Failed', failureReason: 'Timeout' }],
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchPayoutSettlements', () => {
  it('requests the admin BFF route and returns the parsed page', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(listResponse));

    const result = await fetchPayoutSettlements({});

    expect(result).toEqual(listResponse);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/admin/payout-settlements');
  });

  it('serializes status, run-date range, and page number into the query string', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(listResponse));

    await fetchPayoutSettlements({ status: 'SettlementFailed', runDateFrom: '2026-11-01', runDateTo: '2026-11-08', pageNumber: 3 });

    const [url] = fetchMock.mock.calls[0];
    const query = new URL(url, 'http://localhost').searchParams;
    expect(query.get('status')).toBe('SettlementFailed');
    expect(query.get('runDateFrom')).toBe('2026-11-01');
    expect(query.get('runDateTo')).toBe('2026-11-08');
    expect(query.get('pageNumber')).toBe('3');
  });

  it.each([
    ['401', 401],
    ['403', 403],
    ['500', 500],
  ])('maps a %s response to PayoutSettlementsError with that status', async (_label, status) => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ title: 'Nope', errorCode: 'daily_payout.forbidden' }, status));

    const error = await fetchPayoutSettlements({}).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(PayoutSettlementsError);
    expect((error as PayoutSettlementsError).status).toBe(status);
  });

  it('treats an HTML error page as a failure, never success', async () => {
    fetchMock.mockResolvedValueOnce(htmlResponse(502));

    const error = await fetchPayoutSettlements({}).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(PayoutSettlementsError);
    expect((error as PayoutSettlementsError).status).toBe(502);
  });

  it('treats a malformed 200 body as a failure, never success', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ...listResponse, items: [{ ...listItem, status: 'Mystery' }] }));

    await expect(fetchPayoutSettlements({})).rejects.toThrow();
  });

  it('maps a network failure to PayoutSettlementsError with status 0', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const error = await fetchPayoutSettlements({}).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(PayoutSettlementsError);
    expect((error as PayoutSettlementsError).status).toBe(0);
  });

  it('rethrows an AbortError unchanged', async () => {
    const abortError = new DOMException('Aborted', 'AbortError');
    fetchMock.mockRejectedValueOnce(abortError);

    await expect(fetchPayoutSettlements({})).rejects.toBe(abortError);
  });
});

describe('fetchFailedPayoutBatchDetail', () => {
  it('requests the batch detail route and returns the parsed detail', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(detail));

    await expect(fetchFailedPayoutBatchDetail(42)).resolves.toEqual(detail);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/admin/payout-settlements/42');
  });

  it('maps a 404 to PayoutSettlementsError', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ title: 'Not found', errorCode: 'daily_payout.batch_not_found' }, 404));

    const error = await fetchFailedPayoutBatchDetail(42).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(PayoutSettlementsError);
    expect((error as PayoutSettlementsError).errorCode).toBe('daily_payout.batch_not_found');
  });
});

describe('Screen 2 actions', () => {
  it('retryFailedPayoutBatch posts to the retry route with no body', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ batchId: 42, status: 'Processing', updatedAtUtc: '2026-11-08T03:00:00Z' }));

    await retryFailedPayoutBatch(42);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/admin/payout-settlements/42/retry');
    expect(init.method).toBe('POST');
    expect(init.body).toBeUndefined();
  });

  it('carryOverFailedPayoutBatch posts to the carry-over route', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ batchId: 42, status: 'Carried Over', updatedAtUtc: '2026-11-08T03:00:00Z' }));

    await carryOverFailedPayoutBatch(42);

    expect(fetchMock.mock.calls[0][0]).toBe('/api/admin/payout-settlements/42/carry-over');
  });

  it('recordManualPayoutSettlement sends only transferReference in the body', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ batchId: 42, status: 'Settled', updatedAtUtc: '2026-11-08T03:00:00Z' }));

    await recordManualPayoutSettlement(42, 'SIM-TRX-9');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/admin/payout-settlements/42/manual-settlement');
    expect(JSON.parse(init.body)).toEqual({ transferReference: 'SIM-TRX-9' });
  });

  it('maps a conflict/validation response on an action to PayoutSettlementsError with its errorCode', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ title: 'Not failed', errorCode: 'daily_payout.not_failed' }, 409));

    const error = await retryFailedPayoutBatch(42).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(PayoutSettlementsError);
    expect((error as PayoutSettlementsError).errorCode).toBe('daily_payout.not_failed');
  });
});
