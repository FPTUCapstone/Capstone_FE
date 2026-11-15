import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  fetchOperatorRefundDetail,
  RefundsOperatorError,
  reportOperatorRefundReturn,
} from './refundsOperatorService';

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

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
  returnDeadlineAtUtc: null,
  returnReference: null,
  returnReportedAtUtc: null,
  status: 'PendingOperatorConfirmation',
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchOperatorRefundDetail', () => {
  it('requests the operator BFF route and returns the parsed detail', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(detail));
    const result = await fetchOperatorRefundDetail(501);
    expect(result).toEqual(detail);
    expect(fetchMock).toHaveBeenCalledWith('/api/operator/refunds/501', expect.objectContaining({ method: 'GET' }));
  });

  it('throws RefundsOperatorError with the status and errorCode on a non-ok response', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ title: 'Not pending.', errorCode: 'refund.request_not_pending' }, 409));
    await expect(fetchOperatorRefundDetail(501)).rejects.toMatchObject({
      status: 409,
      errorCode: 'refund.request_not_pending',
    });
  });

  it('throws on a malformed body rather than returning it', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ refundId: 501 }));
    await expect(fetchOperatorRefundDetail(501)).rejects.toThrow();
  });

  it('wraps a network failure as a status-0 error', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network down'));
    await expect(fetchOperatorRefundDetail(501)).rejects.toBeInstanceOf(RefundsOperatorError);
  });
});

describe('reportOperatorRefundReturn', () => {
  it('posts the trimmed reference', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 'ReturnReported' }));
    await reportOperatorRefundReturn(501, 'FT-998877');
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe('/api/operator/refunds/501/return');
    expect(JSON.parse(init.body)).toEqual({ returnReference: 'FT-998877' });
  });
});
