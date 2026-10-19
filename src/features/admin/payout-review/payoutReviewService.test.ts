import { afterEach, describe, expect, it, vi } from 'vitest';

import { approvePayout, fetchPayoutDetail, PayoutReviewError, rejectPayout } from './payoutReviewService';

const detail = {
  payoutId: '123',
  payoutCode: 'PO-123',
  status: 'PendingReview',
  settlementPeriod: { startDate: '2026-09-01', endDate: '2026-09-30' },
  tourOperator: { operatorId: '45', companyName: 'Hoi An Tours' },
  grossRevenue: 12000000,
  commissionRate: 0.1,
  commissionAmount: 1200000,
  netPayoutAmount: 10800000,
  requestedAtUtc: '2026-10-03T08:15:00Z',
  contributingBookings: [],
  beneficiary: { bankName: null, accountHolder: null, maskedAccountNumber: null },
  rejectionReason: null,
};

afterEach(() => vi.unstubAllGlobals());

describe('fetchPayoutDetail', () => {
  it('calls the same-origin proxy and parses the payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(detail));
    vi.stubGlobal('fetch', fetchMock);

    const parsed = await fetchPayoutDetail('123');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/admin/payouts/123');
    expect(init.credentials).toBe('same-origin');
    expect(parsed.payoutId).toBe('123');
  });

  it('surfaces the upstream status and error code on failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      Response.json({ title: 'Not found.', errorCode: 'payout.not_found' }, { status: 404 }),
    ));

    const error = await fetchPayoutDetail('999').catch((caught: unknown) => caught) as PayoutReviewError;

    expect(error).toBeInstanceOf(PayoutReviewError);
    expect(error.status).toBe(404);
    expect(error.errorCode).toBe('payout.not_found');
  });

  it('maps network failure and malformed payloads to status 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('failed')));
    await expect(fetchPayoutDetail('123')).rejects.toMatchObject({ status: 0 });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ broken: true })));
    await expect(fetchPayoutDetail('123')).rejects.toMatchObject({ status: 0 });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html></html>', {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    })));
    await expect(fetchPayoutDetail('123')).rejects.toMatchObject({ status: 0 });
  });
});

describe('approvePayout', () => {
  it('posts to the approve endpoint and returns the decision', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({
      payoutId: '123', status: 'ApprovedForSettlement', decidedAtUtc: '2026-10-14T09:00:00Z',
    }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await approvePayout('123');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/admin/payouts/123/approve');
    expect(init.method).toBe('POST');
    expect(result.status).toBe('ApprovedForSettlement');
  });

  it('surfaces a 409 conflict with the errorCode', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({
      title: 'The payout request is no longer pending review.',
      errorCode: 'payout.not_pending_review',
      currentStatus: 'Rejected',
    }, { status: 409 })));

    const error = await approvePayout('123').catch((caught: unknown) => caught) as PayoutReviewError;

    expect(error.status).toBe(409);
    expect(error.errorCode).toBe('payout.not_pending_review');
  });

  it.each([401, 403, 404, 500])('preserves upstream status %i', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status })));
    await expect(approvePayout('123')).rejects.toMatchObject({ status });
  });
});

describe('rejectPayout', () => {
  it('posts the reason to the reject endpoint and returns the decision', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({
      payoutId: '123', status: 'Rejected', decidedAtUtc: '2026-10-14T09:00:00Z',
      rejectionReason: 'Bank details could not be verified.',
    }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await rejectPayout('123', 'Bank details could not be verified.');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/admin/payouts/123/reject');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ reason: 'Bank details could not be verified.' });
    expect(result.rejectionReason).toBe('Bank details could not be verified.');
  });

  it('surfaces a 400 with errors.reason for an invalid reason', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({
      title: 'Rejection reason must be between 10 and 500 characters.',
      errorCode: 'payout.rejection_reason_invalid',
      errors: { reason: ['Rejection reason must be between 10 and 500 characters.'] },
    }, { status: 400 })));

    const error = await rejectPayout('123', 'short').catch((caught: unknown) => caught) as PayoutReviewError;

    expect(error.status).toBe(400);
    expect(error.errorCode).toBe('payout.rejection_reason_invalid');
    expect(error.reasonErrors).toEqual(['Rejection reason must be between 10 and 500 characters.']);
  });
});
