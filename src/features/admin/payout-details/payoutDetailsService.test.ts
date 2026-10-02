import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchPayoutDetails, PayoutDetailsError } from './payoutDetailsService';
import { parsePayoutDetail } from './payoutDetails';

const payload = {
  payoutId: '1', payoutCode: 'PO-1',
  operator: { userId: '2', companyName: 'Danang Tourist Co., Ltd' },
  periodStart: '2026-08-01', periodEnd: '2026-08-31',
  grossRevenue: 10000000, commissionRate: 10, commissionAmount: 1000000, netAmount: 9000000,
  requestedAtUtc: null, status: 'Pending', bookings: [],
};

afterEach(() => vi.unstubAllGlobals());

describe('payout details service', () => {
  it('calls the same-origin proxy without a bearer token and parses the payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(payload));
    vi.stubGlobal('fetch', fetchMock);
    const parsed = await fetchPayoutDetails('1');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/admin/payouts/1');
    expect(init.credentials).toBe('same-origin');
    expect(init.headers).toEqual({ Accept: 'application/json' });
    expect(parsed).toEqual(parsePayoutDetail(payload));
  });

  it('surfaces the upstream MSG128 code and message for a missing record', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({
      title: 'No records found matching your criteria.',
      errorCode: 'Payouts.NotFound',
    }, { status: 404 })));
    const error = await fetchPayoutDetails('999').catch((caught: unknown) => caught) as PayoutDetailsError;
    expect(error).toBeInstanceOf(PayoutDetailsError);
    expect(error.status).toBe(404);
    expect(error.errorCode).toBe('Payouts.NotFound');
    expect(error.errorMessage).toContain('No records found');
  });

  it.each([400, 401, 403, 503])('preserves upstream status %i', async status => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status })));
    await expect(fetchPayoutDetails('1')).rejects.toMatchObject({ status });
  });

  it('maps network failure and malformed success payloads to the unavailable status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('failed')));
    await expect(fetchPayoutDetails('1')).rejects.toMatchObject({ status: 0 });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ broken: true })));
    await expect(fetchPayoutDetails('1')).rejects.toMatchObject({ status: 0 });
  });
});
