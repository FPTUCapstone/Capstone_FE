import { afterEach, describe, expect, it, vi } from 'vitest';
import { getChannel, listChannels, submitChannel, PaymentChannelError } from './paymentChannelService';
import { EMPTY_CREDENTIALS, channelDate } from './paymentChannel';
afterEach(() => vi.unstubAllGlobals());
describe('payment channel client contracts', () => {
  it('fails closed on missing actions or unrecognized status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => Response.json({ status: 'Ready' })));
    await expect(getChannel()).rejects.toBeInstanceOf(PaymentChannelError);
  });
  it('uses same-origin no-store requests and never puts credentials in query strings', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ status: 'PendingVerification', allowedActions: ['verify'] })); vi.stubGlobal('fetch', fetcher);
    await submitChannel({ ...EMPTY_CREDENTIALS, apiKey: 'private-test-key' });
    expect(fetcher.mock.calls[0][0]).toBe('/api/operator/payment-channel');
    expect(fetcher.mock.calls[0][1]).toMatchObject({ cache: 'no-store', credentials: 'same-origin', method: 'PUT' });
    expect(fetcher.mock.calls[0][1].body).toContain('private-test-key');
  });
  it('rejects invalid list responses and translates errors without backend diagnostics', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ items: [] })).mockResolvedValueOnce(Response.json({ errorCode: 'payment_channel.verification_failed', detail: 'provider secret' }, { status: 422 })); vi.stubGlobal('fetch', fetcher);
    await expect(listChannels()).rejects.toBeInstanceOf(PaymentChannelError);
    await expect(getChannel()).rejects.toThrow('Chưa thể xác minh kết nối payOS.');
  });
  it('formats channel timestamps as dd/mm/yyyy in Vietnam time', () => {
    expect(channelDate('2026-11-24T18:15:00Z')).toBe('25/11/2026 01:15'); expect(channelDate(null)).toBe('Chưa ghi nhận');
  });
});
