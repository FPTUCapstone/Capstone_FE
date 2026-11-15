import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  fetchEscalatedRefunds,
  fetchReturnReportedRefunds,
  markRefundReturnReceived,
  resolveEscalatedRefund,
  rejectEscalatedRefund,
} from './refundsAdminService';

const fetchMock = vi.fn();

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

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

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchReturnReportedRefunds', () => {
  it('requests only the ReturnReported status', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ pageNumber: 1, pageSize: 20, totalCount: 1, items: [listItem] }));
    const result = await fetchReturnReportedRefunds();
    expect(result.items).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/refunds?status=ReturnReported', expect.objectContaining({ method: 'GET' }));
  });
});

describe('fetchEscalatedRefunds', () => {
  it('requests both Escalated and Reconciliation statuses (Q-FE3)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ pageNumber: 1, pageSize: 20, totalCount: 0, items: [] }));
    await fetchEscalatedRefunds();
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/refunds?status=Escalated&status=Reconciliation',
      expect.objectContaining({ method: 'GET' }),
    );
  });
});

describe('markRefundReturnReceived', () => {
  it('posts with no body', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 'ReturnReceived' }));
    await markRefundReturnReceived(501);
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe('/api/admin/refunds/501/return-received');
    expect(init.body).toBeUndefined();
  });
});

describe('resolveEscalatedRefund', () => {
  it('posts the gateway reference', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 'Processed' }));
    await resolveEscalatedRefund(501, 'GW-1');
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe('/api/admin/refunds/501/resolve');
    expect(JSON.parse(init.body)).toEqual({ gatewayReference: 'GW-1' });
  });
});

describe('rejectEscalatedRefund', () => {
  it('posts the rejection reason with Reject action', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 'Rejected' }));
    await rejectEscalatedRefund(501, 'Payment mismatch.');
    const [path, init] = fetchMock.mock.calls[0];
    expect(path).toBe('/api/admin/refunds/501/resolve');
    expect(JSON.parse(init.body)).toEqual({ action: 'Reject', reason: 'Payment mismatch.' });
  });
});
