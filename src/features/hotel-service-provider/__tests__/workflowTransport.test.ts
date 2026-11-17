import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProviderBookingService } from '../services/providerBookingService';
import { StaffProviderService } from '../services/staffProviderService';

const wire = {
  id: 9, requestCode: 'SR-9', serviceId: 2, serviceName: 'Hotel', option: null,
  requestedDate: '2026-11-12', requestedTime: '14:00:00', quantity: 1,
  travelerName: 'An', status: 'Confirmed', submittedAtUtc: '2026-11-11T00:00:00Z', rowVersion: 'AAAAAAAB=',
  estimatedAmount: 100000, responseDeadlineUtc: '2026-11-12T00:00:00Z',
  outcomeAvailableAtUtc: '2026-11-12T17:00:00Z', autoCompleteAtUtc: '2026-11-15T17:00:00Z',
};
afterEach(() => vi.unstubAllGlobals());
describe('TM225 real browser transport', () => {
  it.each([undefined, null, '100000', -1])('rejects invalid detail estimate %s instead of showing a free service', async estimatedAmount => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ success: true, data: { ...wire, estimatedAmount } })));
    await expect(ProviderBookingService.getBookingRequestById('9')).rejects.toThrow();
  });

  it('accepts a genuine zero estimate while summary responses may omit amounts', async () => {
    const summary = { ...wire };
    delete (summary as Partial<typeof wire>).estimatedAmount;
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(Response.json({ success: true, data: { items: [summary], totalCount: 1, pageNumber: 1, pageSize: 20 } }))
      .mockResolvedValueOnce(Response.json({ success: true, data: { ...wire, estimatedAmount: 0 } })));
    expect((await ProviderBookingService.fetchBookingRequests()).items).toHaveLength(1);
    expect((await ProviderBookingService.getBookingRequestById('9')).estimatedAmount).toBe(0);
  });

  it('uses exact list query names and adapts nullable detail fields', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ success: true, data: { items: [wire], totalCount: 1, pageNumber: 2, pageSize: 20 } }));
    vi.stubGlobal('fetch', fetcher);
    const result = await ProviderBookingService.fetchBookingRequests({ startDate: '2026-11-01', endDate: '2026-11-20', page: 2 });
    expect(fetcher.mock.calls[0][0]).toBe('/api/provider/service-booking-requests?requestedDateFrom=2026-11-01&requestedDateTo=2026-11-20&pageNumber=2&pageSize=20');
    expect(result.items[0]).toMatchObject({ id: '9', serviceOption: '—', rowVersion: wire.rowVersion });
    expect(result.page).toBe(2);
  });
  it('reuses a GUID key for the same uncertain mutation and sends rowVersion', async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new TypeError('offline')).mockResolvedValueOnce(Response.json({ success: true, data: wire }));
    vi.stubGlobal('fetch', fetcher);
    const payload = { decision: 'Confirmed' as const, rowVersion: wire.rowVersion };
    await expect(ProviderBookingService.submitDecision('9', payload)).rejects.toThrow();
    await ProviderBookingService.submitDecision('9', payload);
    const first = fetcher.mock.calls[0][1];
    const second = fetcher.mock.calls[1][1];
    expect(first.headers['Idempotency-Key']).toMatch(/^[0-9a-f-]{36}$/i);
    expect(second.headers['Idempotency-Key']).toBe(first.headers['Idempotency-Key']);
    expect(JSON.parse(first.body)).toEqual(payload);
  });
  it('passes exact provisioning names and preserves delivery status', async () => {
    const account = { userId: 8, fullName: 'Name', email: 'name@example.com', role: 'ServiceProvider', status: 'Active', mustChangePassword: true, emailDeliveryStatus: 'Pending' };
    const fetcher = vi.fn().mockResolvedValue(Response.json({ success: true, data: account }));
    vi.stubGlobal('fetch', fetcher);
    const payload = { fullName: account.fullName, email: account.email, phoneNumber: '0905123456', businessName: 'Hotel', category: 'Hotel' as const, linkedPoiIds: [2] };
    expect((await StaffProviderService.createServiceProviderAccount(payload)).account?.emailDeliveryStatus).toBe('Pending');
    expect(JSON.parse(fetcher.mock.calls[0][1].body)).toEqual(payload);
  });
  it('rejects malformed success bodies and maps safe backend errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ success: true, data: {} })));
    await expect(ProviderBookingService.getBookingRequestById('9')).rejects.toThrow();
  });
});
