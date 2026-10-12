import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchPayoutRecords, PayoutRecordsError } from './payoutRecordsService';
import { parsePayoutsResponse } from './payoutRecords';

const payload = {
  summary: { pendingRequests: 0, totalRequestedAmount: 0, totalConfirmedAmount: 0 },
  pageNumber: 1, pageSize: 20, totalCount: 0, totalPages: 0, items: [],
};

afterEach(() => vi.unstubAllGlobals());

describe('payout records service', () => {
  it('calls the same-origin proxy without a bearer token and parses the payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(payload));
    vi.stubGlobal('fetch', fetchMock);
    const parsed = await fetchPayoutRecords({ keyword: 'PO-1', status: '', periodFrom: '', periodTo: '', pageNumber: 1 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/admin/payouts?keyword=PO-1');
    expect(init.credentials).toBe('same-origin');
    expect(init.headers).toEqual({ Accept: 'application/json' });
    expect(parsed).toEqual(parsePayoutsResponse(payload));
  });

  it('surfaces the upstream error code and message for the inverted period range', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({
      title: 'The submitted settlement period range is logically invalid.',
      errorCode: 'payout.invalid_period_range',
    }, { status: 400 })));
    const error = await fetchPayoutRecords({ keyword: '', status: '', periodFrom: '2026-09-10', periodTo: '2026-09-01', pageNumber: 1 })
      .catch((caught: unknown) => caught) as PayoutRecordsError;
    expect(error).toBeInstanceOf(PayoutRecordsError);
    expect(error.status).toBe(400);
    expect(error.errorCode).toBe('payout.invalid_period_range');
    expect(error.errorMessage).toContain('logically invalid');
  });

  it.each([401, 403, 503])('preserves upstream status %i', async status => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status })));
    await expect(fetchPayoutRecords({ keyword: '', status: '', periodFrom: '', periodTo: '', pageNumber: 1 }))
      .rejects.toMatchObject({ status });
  });

  it('maps network failure and malformed success payloads to the unavailable status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('failed')));
    await expect(fetchPayoutRecords({ keyword: '', status: '', periodFrom: '', periodTo: '', pageNumber: 1 }))
      .rejects.toMatchObject({ status: 0 });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ broken: true })));
    await expect(fetchPayoutRecords({ keyword: '', status: '', periodFrom: '', periodTo: '', pageNumber: 1 }))
      .rejects.toMatchObject({ status: 0 });
  });
});
