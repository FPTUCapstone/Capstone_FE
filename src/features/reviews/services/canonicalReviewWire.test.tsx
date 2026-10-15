import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ push: vi.fn(), cookies: vi.fn(), backend: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('next/headers', () => ({ cookies: mocks.cookies }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: mocks.backend }));
vi.mock('@/components/navigation/PublicNavigation', () => ({ PublicNavigation: () => null }));

import { CanonicalTripReviewPage } from '../components/CanonicalTripReviewPage';
import { getReviewContext } from './canonicalReviewApi';
import { proxyCanonicalReview } from './canonicalReviewProxy';

const id = '9223372036854775807';
const reference = { kind: 'commerceBooking' as const, id };
import { backendContext } from './canonicalReviewWireFixtures';
function json(text: string, status = 200) {
  return new Response(text, { status, headers: { 'Content-Type': 'application/json' } });
}
let reads = 0;
let recovery: 'success' | 'failed' | 'wrong' = 'success';

describe('canonical review UI through browser API and BFF wire boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks(); reads = 0; recovery = 'success';
    mocks.cookies.mockResolvedValue({ get: () => ({ value: 'test-refresh' }) });
    mocks.backend.mockImplementation(async (path: string, options: RequestInit) => {
      if (path === '/api/v1/auth/web/refresh') return Response.json({ data: { role: 'Traveler', accessToken: 'test-token' } });
      if (options.method === 'POST') return Response.json({ errorCode: 'trip_review.duplicate' }, { status: 409 });
      reads++;
      if (reads > 1 && recovery === 'failed') return Response.json({ errorCode: 'trip_review.policy_unavailable' }, { status: 503 });
      return json(backendContext(reads > 1, reads > 1 && recovery === 'wrong' ? '9223372036854775806' : id));
    });
    vi.stubGlobal('fetch', vi.fn(async (path: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers);
      let body = options.body;
      if (options.method === 'POST') {
        // Encode the browser FormData into its actual multipart wire shape so
        // Node Request does not depend on jsdom's separate FormData realm.
        headers.set('Content-Type', 'multipart/form-data; boundary=browser-test');
        body = `--browser-test\r\nContent-Disposition: form-data; name="metadata"\r\n\r\n${(body as FormData).get('metadata')}\r\n--browser-test--\r\n`;
        headers.set('Origin', 'http://localhost:3000');
      }
      return proxyCanonicalReview(new Request(`http://localhost:3000${path}`, { ...options, headers, body }), reference.kind, id);
    }));
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  async function submit() {
    render(<CanonicalTripReviewPage reference={reference} />);
    await screen.findByText('Hoi An wire fixture');
    fireEvent.click(screen.getByRole('radio', { name: '5 stars' }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Great' } });
    fireEvent.change(screen.getByLabelText('Review'), { target: { value: 'Excellent' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publish review' }));
  }
  function onlyOnePost() {
    expect(mocks.backend.mock.calls.filter(([path, options]) => path !== '/api/v1/auth/web/refresh' && options.method === 'POST')).toHaveLength(1);
    expect(mocks.backend.mock.calls.filter(([path]) => path !== '/api/v1/auth/web/refresh').every(([path]) => path === `/api/v1/bookings/${id}/review`)).toBe(true);
    expect(mocks.push).not.toHaveBeenCalled();
    expect(screen.queryByText('Review published. Returning to Trip History…')).toBeNull();
  }

  it('preserves raw maximum Int64 Backend identity across BFF and browser API', async () => {
    expect((await getReviewContext(reference)).reviewableRecord.id).toBe(id);
  });
  it('opens the existing review after duplicate with exact maximum Int64 identity', async () => {
    await submit();
    expect(await screen.findByText('A review already exists. The existing review is shown below.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Update review' })).toBeTruthy();
    expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe('Existing review');
    expect(reads).toBe(2); onlyOnePost();
  });
  it.each(['failed', 'wrong'] as const)('fails duplicate recovery safely on %s GET', async mode => {
    recovery = mode;
    await submit();
    expect(await screen.findByText('The existing review could not be loaded. Please try again.')).toBeTruthy();
    await waitFor(() => expect(reads).toBe(2));
    expect(screen.queryByText('A review already exists. The existing review is shown below.')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Update review' })).toBeNull();
    onlyOnePost();
  });
  it('retains booking_not_found while stripping Backend diagnostic fields', async () => {
    mocks.backend.mockImplementation(async (path: string) => path === '/api/v1/auth/web/refresh'
      ? Response.json({ data: { role: 'Traveler', accessToken: 'test-token' } })
      : Response.json({ errorCode: 'trip_review.booking_not_found', detail: 'sensitive diagnostic', traceId: 'private' }, { status: 404 }));
    const response = await proxyCanonicalReview(new Request('http://localhost:3000/api'), reference.kind, id);
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ errorCode: 'trip_review.booking_not_found' });
  });
});
