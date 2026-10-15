// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { cookiesMock, fetchBackendMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(), fetchBackendMock: vi.fn(),
}));
vi.mock('next/headers', () => ({ cookies: cookiesMock }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: fetchBackendMock }));

import { proxyCanonicalReview } from './canonicalReviewProxy';
import { backendContext } from './canonicalReviewWireFixtures';

describe('canonical review BFF', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookiesMock.mockResolvedValue({ get: () => ({ value: 'refresh' }) });
    fetchBackendMock.mockImplementation(async (path: string) => path === '/api/v1/auth/web/refresh'
      ? Response.json({ data: { role: 'Traveler', accessToken: 'token' } })
      : Response.json(JSON.parse(backendContext(true, '7')).review, { status: 201 }));
  });

  it('re-encodes metadata as a JSON form field without a filename', async () => {
    const form = new FormData();
    form.set('metadata', JSON.stringify({ overallRating: 5, title: 'Great', content: 'Good' }));
    form.append('files', new File(['image'], 'photo.png', { type: 'image/png' }));
    const request = new Request('http://localhost:3000/api/v1/bookings/7/review', {
      method: 'POST', headers: { Origin: 'http://localhost:3000' }, body: form,
    });
    expect((await proxyCanonicalReview(request, 'commerceBooking', '7')).status).toBe(201);
    const options = fetchBackendMock.mock.calls[1][1];
    const body = await (options.body as Blob).text();
    expect(options.headers.get('Content-Type')).toMatch(/^multipart\/form-data; boundary=tripmate-/);
    expect(body).toContain('name="metadata"\r\nContent-Type: application/json; charset=utf-8');
    expect(body).not.toContain('name="metadata"; filename=');
    expect(body).toContain('name="files"; filename="photo.png"');
  });

  it('rejects an oversized chunked request before forwarding review data', async () => {
    let sent = 0;
    const body = new ReadableStream<Uint8Array>({ pull(controller) {
      controller.enqueue(new Uint8Array(1_000_000));
      if (++sent === 27) controller.close();
    }});
    const request = new Request('http://localhost:3000/api/v1/bookings/7/review', {
      method: 'POST', headers: { Origin: 'http://localhost:3000',
        'Content-Type': 'multipart/form-data; boundary=test' }, body, duplex: 'half',
    } as RequestInit & { duplex: 'half' });
    const response = await proxyCanonicalReview(request, 'commerceBooking', '7');
    expect(response.status).toBe(413);
    expect(fetchBackendMock).toHaveBeenCalledTimes(1);
  });

  it('keeps equal numeric IDs in distinct backend namespaces', async () => {
    await proxyCanonicalReview(new Request('http://localhost/api'), 'serviceBooking', '9');
    expect(fetchBackendMock.mock.calls[1][0]).toBe('/api/v1/service-bookings/9/review');
  });

  it('preserves the canonical optimistic-concurrency error code', async () => {
    fetchBackendMock.mockImplementation(async (path: string) => path === '/api/v1/auth/web/refresh'
      ? Response.json({ data: { role: 'Traveler', accessToken: 'token' } })
      : Response.json({ errorCode: 'trip_review.stale_version' }, { status: 409 }));
    const response = await proxyCanonicalReview(new Request('http://localhost/api'), 'commerceBooking', '9');
    expect(await response.json()).toEqual({ errorCode: 'trip_review.stale_version' });
  });

  it('forwards an int64 identifier without converting it to a JavaScript number', async () => {
    await proxyCanonicalReview(new Request('http://localhost/api'), 'commerceBooking', '9223372036854775807');
    expect(fetchBackendMock.mock.calls[1][0]).toBe('/api/v1/bookings/9223372036854775807/review');
  });

  it.each(['0', '-1', '01', '9223372036854775808'])('rejects invalid signed int64 ID %s', async (id) => {
    const response = await proxyCanonicalReview(new Request('http://localhost/api'), 'commerceBooking', id);
    expect(response.status).toBe(400);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });
});
