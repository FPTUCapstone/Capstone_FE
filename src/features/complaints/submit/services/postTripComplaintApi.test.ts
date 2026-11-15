import { afterEach, describe, expect, it, vi } from 'vitest';
import { submitPostTripComplaint } from './postTripComplaintApi';

describe('post-trip complaint API', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('sends exact FormData fields and no manually-set content type', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ complaintId: 1, bookingId: 2, status: 'AwaitingOperatorResponse', submittedAtUtc: '2026-11-20T08:00:00Z', responseDeadlineUtc: '2026-11-27T08:00:00Z', isReplay: false }), { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);
    await submitPostTripComplaint('2', { reasonCategory: 'Other', reasonDetail: 'Details', evidence: [new File(['proof'], 'proof.pdf', { type: 'application/pdf' })] }, 'd290f1ee-6c54-4b01-90e6-d701748f0851');
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/v1/traveler/bookings/2/post-trip-complaints');
    expect(options.headers).toEqual({ 'Idempotency-Key': 'd290f1ee-6c54-4b01-90e6-d701748f0851' });
    const form = options.body as FormData;
    expect(form.get('reasonCategory')).toBe('Other');
    expect(form.get('reasonDetail')).toBe('Details');
    expect((form.getAll('evidence')[0] as File).name).toBe('proof.pdf');
  });
});
