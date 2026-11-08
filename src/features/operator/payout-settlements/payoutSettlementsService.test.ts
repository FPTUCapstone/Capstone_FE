import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OperatorPayoutSettlementsError, fetchOperatorPayoutSettlementHistory } from './payoutSettlementsService';

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const listItem = {
  settlementId: 1, bookingId: 2, tourOperatorUserId: 3, runDate: '2026-11-08',
  kind: 'Main', payoutAmount: 100_000, status: 'Settled', transferReference: 'SIM-1',
};
const listResponse = { pageNumber: 1, pageSize: 20, totalCount: 1, items: [listItem] };

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchOperatorPayoutSettlementHistory', () => {
  it('requests the operator BFF route with no query string for the first default page', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(listResponse));

    const result = await fetchOperatorPayoutSettlementHistory();

    expect(result).toEqual(listResponse);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/operator/payout-settlements');
  });

  it('includes pageNumber when beyond page 1', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(listResponse));

    await fetchOperatorPayoutSettlementHistory(2, 20);

    const [url] = fetchMock.mock.calls[0];
    expect(new URL(url, 'http://localhost').searchParams.get('pageNumber')).toBe('2');
  });

  it.each([
    ['401', 401],
    ['403', 403],
    ['500', 500],
  ])('maps a %s response to OperatorPayoutSettlementsError', async (_label, status) => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ title: 'Nope' }, status));

    const error = await fetchOperatorPayoutSettlementHistory().catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(OperatorPayoutSettlementsError);
    expect((error as OperatorPayoutSettlementsError).status).toBe(status);
  });

  it('treats an HTML error page as a failure, never success', async () => {
    fetchMock.mockResolvedValueOnce(new Response('<html>502</html>', { status: 502, headers: { 'Content-Type': 'text/html' } }));

    const error = await fetchOperatorPayoutSettlementHistory().catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(OperatorPayoutSettlementsError);
    expect((error as OperatorPayoutSettlementsError).status).toBe(502);
  });

  it('treats a malformed 200 body as a failure, never success', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ...listResponse, items: [{ ...listItem, status: 'Mystery' }] }));

    await expect(fetchOperatorPayoutSettlementHistory()).rejects.toThrow();
  });

  it('maps a network failure to OperatorPayoutSettlementsError with status 0', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const error = await fetchOperatorPayoutSettlementHistory().catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(OperatorPayoutSettlementsError);
    expect((error as OperatorPayoutSettlementsError).status).toBe(0);
  });

  it('rethrows an AbortError unchanged', async () => {
    const abortError = new DOMException('Aborted', 'AbortError');
    fetchMock.mockRejectedValueOnce(abortError);

    await expect(fetchOperatorPayoutSettlementHistory()).rejects.toBe(abortError);
  });
});
