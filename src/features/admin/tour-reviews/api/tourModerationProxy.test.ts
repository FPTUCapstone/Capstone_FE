import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { cookiesMock, fetchBackendMock } = vi.hoisted(() => ({ cookiesMock: vi.fn(), fetchBackendMock: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: cookiesMock }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: fetchBackendMock }));

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_SESSION_SEAL_COOKIE,
  ADMIN_SESSION_SECRET_ENV,
  createAdminSessionSeal,
} from '@/lib/server/adminSession';

import { proxyApproveTour, proxyPendingTours, proxyRejectTour, proxyTourReview } from './tourModerationProxy';

const testSecret = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8').toString('base64url');
const ORIGIN = 'http://localhost:3000';
let priorSecret: string | undefined;

const fullChecklist = {
  contentCompleteness: true,
  imageAppropriateness: true,
  pricePlausibility: true,
  policyCompliance: true,
  itineraryFeasibility: true,
};

function mockSession(role: 'Administrator' | 'Staff' | null, token = 'staff-token') {
  if (role === null) {
    cookiesMock.mockResolvedValue({ get: () => undefined });
    return;
  }
  const sealed = createAdminSessionSeal({ token, role, expiresAt: new Date(Date.now() + 600_000), secret: testSecret })!;
  cookiesMock.mockResolvedValue({
    get: (name: string) =>
      name === ADMIN_ACCESS_TOKEN_COOKIE
        ? { value: token }
        : name === ADMIN_SESSION_SEAL_COOKIE
          ? { value: sealed.seal }
          : undefined,
  });
}

function get(path: string) {
  return new Request(`${ORIGIN}${path}`);
}

function post(path: string, body: unknown, headers: Record<string, string> = { origin: ORIGIN }) {
  return new Request(`${ORIGIN}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  priorSecret = process.env[ADMIN_SESSION_SECRET_ENV];
  process.env[ADMIN_SESSION_SECRET_ENV] = testSecret;
  mockSession('Staff');
});

afterEach(() => {
  if (priorSecret === undefined) delete process.env[ADMIN_SESSION_SECRET_ENV];
  else process.env[ADMIN_SESSION_SECRET_ENV] = priorSecret;
});

describe('tour moderation proxy: access control', () => {
  it('requires a session on every route', async () => {
    mockSession(null);
    for (const response of [
      await proxyPendingTours(get('/api/admin/tours/pending')),
      await proxyTourReview(get('/api/admin/tours/12/review'), '12'),
      await proxyApproveTour(post('/api/admin/tours/12/approve', { checklist: fullChecklist }), '12'),
      await proxyRejectTour(post('/api/admin/tours/12/reject', { reason: 'x' }), '12'),
    ]) {
      expect(response.status).toBe(401);
    }
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('refuses an Administrator session without calling the backend (Staff-only function)', async () => {
    mockSession('Administrator');
    for (const response of [
      await proxyPendingTours(get('/api/admin/tours/pending')),
      await proxyTourReview(get('/api/admin/tours/12/review'), '12'),
      await proxyApproveTour(post('/api/admin/tours/12/approve', { checklist: fullChecklist }), '12'),
      await proxyRejectTour(post('/api/admin/tours/12/reject', { reason: 'x' }), '12'),
    ]) {
      expect(response.status).toBe(403);
    }
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('rejects decisions that do not come from the same origin', async () => {
    const approve = await proxyApproveTour(
      post('/api/admin/tours/12/approve', { checklist: fullChecklist }, { origin: 'https://evil.example' }),
      '12',
    );
    const reject = await proxyRejectTour(post('/api/admin/tours/12/reject', { reason: 'x' }, {}), '12');

    expect(approve.status).toBe(403);
    expect(reject.status).toBe(403);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it.each(['abc', '0', '-1', '1.5', '12abc', '../1', '9007199254740993'])('rejects tour id %s before any call', async (id) => {
    expect((await proxyTourReview(get('/x'), id)).status).toBe(400);
    expect((await proxyApproveTour(post('/x', { checklist: fullChecklist }), id)).status).toBe(400);
    expect((await proxyRejectTour(post('/x', { reason: 'x' }), id)).status).toBe(400);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });
});

describe('tour moderation proxy: queue and detail', () => {
  it('forwards only whitelisted query fields and forces the page size', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({ items: [] }));

    const response = await proxyPendingTours(get('/api/admin/tours/pending?keyword=lantern&pageNumber=2&pageSize=999&status=Approved'));

    expect(response.status).toBe(200);
    const [path, init] = fetchBackendMock.mock.calls[0];
    expect(path).toBe('/api/v1/admin/tours?keyword=lantern&page=2&pageSize=20');
    expect(init.headers.Authorization).toBe('Bearer staff-token');
    expect(response.headers.get('cache-control')).toContain('no-store');
  });

  it('forwards the review request for a valid id', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({ tourId: 12 }));

    const response = await proxyTourReview(get('/api/admin/tours/12/review'), '12');

    expect(response.status).toBe(200);
    expect(fetchBackendMock.mock.calls[0][0]).toBe('/api/v1/admin/tours/12/review');
  });
});

describe('tour moderation proxy: approval', () => {
  it('re-validates the five-item checklist server-side', async () => {
    const missing = { ...fullChecklist } as Record<string, unknown>;
    delete missing.pricePlausibility;
    const notBoolean = { ...fullChecklist, policyCompliance: 'yes' };

    for (const body of [{}, { checklist: null }, { checklist: [] }, { checklist: missing }, { checklist: notBoolean }]) {
      expect((await proxyApproveTour(post('/api/admin/tours/12/approve', body), '12')).status).toBe(400);
    }
    expect((await proxyApproveTour(post('/api/admin/tours/12/approve', 'not json'), '12')).status).toBe(400);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('forwards the exact checklist keys and a trimmed note, dropping unknown fields', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({ tourId: 12, status: 'Approved' }));

    const response = await proxyApproveTour(
      post('/api/admin/tours/12/approve', { checklist: { ...fullChecklist, injected: true }, note: '  all good  ', role: 'Administrator' }),
      '12',
    );

    expect(response.status).toBe(200);
    const [path, init] = fetchBackendMock.mock.calls[0];
    expect(path).toBe('/api/v1/admin/tours/12/approve');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ checklist: fullChecklist, note: 'all good' });
  });

  it('omits a blank note and refuses an oversized one', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({ ok: true }));

    await proxyApproveTour(post('/api/admin/tours/12/approve', { checklist: fullChecklist, note: '   ' }), '12');
    expect(JSON.parse(fetchBackendMock.mock.calls[0][1].body)).toEqual({ checklist: fullChecklist });

    const tooLong = await proxyApproveTour(
      post('/api/admin/tours/12/approve', { checklist: fullChecklist, note: 'x'.repeat(1001) }),
      '12',
    );
    expect(tooLong.status).toBe(400);
  });
});

describe('tour moderation proxy: rejection', () => {
  it('requires a reason of 1 to 500 characters', async () => {
    for (const reason of ['', '   ', 'x'.repeat(501), 42, null]) {
      expect((await proxyRejectTour(post('/api/admin/tours/12/reject', { reason }), '12')).status).toBe(400);
    }
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('forwards only the trimmed reason', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({ tourId: 12, status: 'Rejected' }));

    const response = await proxyRejectTour(
      post('/api/admin/tours/12/reject', { reason: '  Price does not match  ', extra: 'x' }),
      '12',
    );

    expect(response.status).toBe(200);
    expect(JSON.parse(fetchBackendMock.mock.calls[0][1].body)).toEqual({ reason: 'Price does not match' });
  });
});

describe('tour moderation proxy: upstream error mapping', () => {
  it('clears the session and reports 401 when the backend says so', async () => {
    fetchBackendMock.mockResolvedValue(new Response('{}', { status: 401 }));
    const response = await proxyPendingTours(get('/api/admin/tours/pending'));
    expect(response.status).toBe(401);
  });

  it('maps a backend 403 to the Staff-required message', async () => {
    fetchBackendMock.mockResolvedValue(new Response('{}', { status: 403 }));
    const response = await proxyTourReview(get('/x'), '12');
    expect(response.status).toBe(403);
  });

  it('passes a 409 through but exposes only the title and a safe error code', async () => {
    fetchBackendMock.mockResolvedValue(
      Response.json(
        { title: 'The tour is not awaiting review.', errorCode: 'operator_tour.invalid_state', traceId: 'secret-trace', detail: 'stack' },
        { status: 409 },
      ),
    );

    const response = await proxyRejectTour(post('/api/admin/tours/12/reject', { reason: 'x' }), '12');

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ title: 'The tour is not awaiting review.', errorCode: 'operator_tour.invalid_state' });
  });

  it('keeps the exact MSG127 wording of a 503 that carries an error code', async () => {
    fetchBackendMock.mockResolvedValue(
      Response.json(
        { title: 'TripMate is temporarily unable to process your request. Please check your connection and try again.', errorCode: 'operator_tour.service_unavailable' },
        { status: 503 },
      ),
    );

    const response = await proxyApproveTour(post('/api/admin/tours/12/approve', { checklist: fullChecklist }), '12');

    expect(response.status).toBe(503);
    expect((await response.json()).errorCode).toBe('operator_tour.service_unavailable');
  });

  it('hides the details of an unexpected 500 behind a generic 503', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({ title: 'NullReferenceException at Foo.cs:12' }, { status: 500 }));

    const response = await proxyPendingTours(get('/api/admin/tours/pending'));

    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain('NullReference');
  });

  it('reports 503 when the backend cannot be reached', async () => {
    fetchBackendMock.mockRejectedValue(new Error('ECONNREFUSED'));
    expect((await proxyPendingTours(get('/api/admin/tours/pending'))).status).toBe(503);
  });
});
