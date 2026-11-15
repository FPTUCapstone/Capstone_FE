import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { parseOperatorRefundListResponse } from '../types/refundLifecycle';
import { fetchOperatorRefunds, RefundsOperatorError } from './refundsOperatorService';

const fetchMock = vi.fn();
const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const item = {
  refundId: 501,
  bookingId: 42,
  bookingCode: 'BK-20261022-00042',
  amount: 500_000,
  status: 'PendingOperatorConfirmation',
  operatorReturnShare: null,
  returnDeadlineAtUtc: null,
  requestedAtUtc: '2026-11-10T03:00:00Z',
};
const page = { pageNumber: 1, pageSize: 20, totalCount: 1, items: [item] };

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('parseOperatorRefundListResponse', () => {
  it('accepts the backend list shape, including a share not yet fixed', () => {
    expect(parseOperatorRefundListResponse(page)).toEqual(page);
  });

  it('rejects an unknown status rather than rendering it', () => {
    expect(() => parseOperatorRefundListResponse({ ...page, items: [{ ...item, status: 'CarriedOver' }] })).toThrow();
  });

  it('rejects a row without a booking code', () => {
    expect(() => parseOperatorRefundListResponse({ ...page, items: [{ ...item, bookingCode: undefined }] })).toThrow();
  });
});

describe('fetchOperatorRefunds', () => {
  it('requests the operator BFF list with the page and returns the parsed response', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(page));
    expect(await fetchOperatorRefunds(2, 20)).toEqual(page);
    expect(fetchMock.mock.calls[0][0]).toBe('/api/operator/refunds?pageNumber=2&pageSize=20');
  });

  it('throws RefundsOperatorError carrying the status on a non-ok response', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ title: 'Denied' }, 403));
    const failure = await fetchOperatorRefunds(1, 20).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(RefundsOperatorError);
    expect((failure as RefundsOperatorError).status).toBe(403);
  });
});
