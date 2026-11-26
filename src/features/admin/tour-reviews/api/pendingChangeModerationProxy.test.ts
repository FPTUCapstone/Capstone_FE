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

import {
  proxyApproveDraftVersion,
  proxyLiveTourForDiff,
  proxyModerationQueue,
  proxyPendingChangeDetail,
  proxyRejectDraftVersion,
} from './pendingChangeModerationProxy';

const testSecret = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8').toString('base64url');
const ORIGIN = 'http://localhost:3000';
let priorSecret: string | undefined;

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

describe('pending-change moderation proxy: access control', () => {
  it('requires a session on every route', async () => {
    mockSession(null);
    for (const response of [
      await proxyModerationQueue(get('/api/admin/tours/moderation-queue')),
      await proxyPendingChangeDetail(get('/api/admin/tours/pending-changes/55'), '55'),
      await proxyLiveTourForDiff(get('/api/admin/tours/42'), '42'),
      await proxyApproveDraftVersion(post('/api/admin/tours/pending-changes/55/approve', {}), '55'),
      await proxyRejectDraftVersion(post('/api/admin/tours/pending-changes/55/reject', { reason: 'x' }), '55'),
    ]) {
      expect(response.status).toBe(401);
    }
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('refuses an Administrator session without calling the backend (Staff-only function)', async () => {
    mockSession('Administrator');
    for (const response of [
      await proxyModerationQueue(get('/api/admin/tours/moderation-queue')),
      await proxyPendingChangeDetail(get('/api/admin/tours/pending-changes/55'), '55'),
      await proxyLiveTourForDiff(get('/api/admin/tours/42'), '42'),
      await proxyApproveDraftVersion(post('/api/admin/tours/pending-changes/55/approve', {}), '55'),
      await proxyRejectDraftVersion(post('/api/admin/tours/pending-changes/55/reject', { reason: 'x' }), '55'),
    ]) {
      expect(response.status).toBe(403);
    }
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('rejects decisions that do not come from the same origin', async () => {
    const approve = await proxyApproveDraftVersion(
      post('/api/admin/tours/pending-changes/55/approve', {}, { origin: 'https://evil.example' }),
      '55',
    );
    const reject = await proxyRejectDraftVersion(post('/api/admin/tours/pending-changes/55/reject', { reason: 'x' }, {}), '55');

    expect(approve.status).toBe(403);
    expect(reject.status).toBe(403);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it.each(['abc', '0', '-1', '1.5', '12abc', '../1', '9007199254740993'])('rejects a non-positive-integer id %s before any call', async (id) => {
    expect((await proxyPendingChangeDetail(get('/x'), id)).status).toBe(400);
    expect((await proxyLiveTourForDiff(get('/x'), id)).status).toBe(400);
    expect((await proxyApproveDraftVersion(post('/x', {}), id)).status).toBe(400);
    expect((await proxyRejectDraftVersion(post('/x', { reason: 'x' }), id)).status).toBe(400);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });
});

describe('pending-change moderation proxy: queue and detail', () => {
  it('forwards only the page field and forces the page size', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({ items: [] }));

    const response = await proxyModerationQueue(get('/api/admin/tours/moderation-queue?page=2&pageSize=999&status=Draft'));

    expect(response.status).toBe(200);
    const [path, init] = fetchBackendMock.mock.calls[0];
    expect(path).toBe('/api/v1/admin/tours/moderation-queue?page=2&pageSize=20');
    expect(init.headers.Authorization).toBe('Bearer staff-token');
    expect(response.headers.get('cache-control')).toContain('no-store');
  });

  it('forwards the pending-change detail request for a valid id', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({ id: 55, tourId: 42 }));

    const response = await proxyPendingChangeDetail(get('/api/admin/tours/pending-changes/55'), '55');

    expect(response.status).toBe(200);
    expect(fetchBackendMock.mock.calls[0][0]).toBe('/api/v1/admin/tours/pending-changes/55');
  });

  it('forwards the live-tour-for-diff request for a valid id', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({ id: 42 }));

    const response = await proxyLiveTourForDiff(get('/api/admin/tours/42'), '42');

    expect(response.status).toBe(200);
    expect(fetchBackendMock.mock.calls[0][0]).toBe('/api/v1/admin/tours/42');
  });
});

describe('pending-change moderation proxy: approval', () => {
  it('sends no body on approve (unlike first-time-submission approval, there is no checklist)', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({ id: 55, tourId: 42, status: 'Applied', tourStatus: 'Approved', message: 'MSG144' }));

    const response = await proxyApproveDraftVersion(post('/api/admin/tours/pending-changes/55/approve', {}), '55');

    expect(response.status).toBe(200);
    const [path, init] = fetchBackendMock.mock.calls[0];
    expect(path).toBe('/api/v1/admin/tours/pending-changes/55/approve');
    expect(init.method).toBe('POST');
    expect(init.body).toBeUndefined();
  });

  it('re-validates the rejection reason server-side (BR-115, 1..500 chars)', async () => {
    for (const body of [{}, { reason: '' }, { reason: '   ' }, { reason: 'x'.repeat(501) }]) {
      expect((await proxyRejectDraftVersion(post('/api/admin/tours/pending-changes/55/reject', body), '55')).status).toBe(400);
    }
    expect((await proxyRejectDraftVersion(post('/api/admin/tours/pending-changes/55/reject', 'not json'), '55')).status).toBe(400);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('forwards a trimmed rejection reason', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({ id: 55, tourId: 42, status: 'Rejected', tourStatus: 'Approved', message: 'MSG145' }));

    const response = await proxyRejectDraftVersion(
      post('/api/admin/tours/pending-changes/55/reject', { reason: '  Thiếu ảnh chất lượng cao  ' }),
      '55',
    );

    expect(response.status).toBe(200);
    const [path, init] = fetchBackendMock.mock.calls[0];
    expect(path).toBe('/api/v1/admin/tours/pending-changes/55/reject');
    expect(JSON.parse(init.body)).toEqual({ reason: 'Thiếu ảnh chất lượng cao' });
  });
});

describe('pending-change moderation proxy: backend failure mapping', () => {
  it('maps a 409 stale-decision failure through unchanged', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({ title: 'Stale', errorCode: 'operator_tour.invalid_state' }, { status: 409 }));

    const response = await proxyApproveDraftVersion(post('/api/admin/tours/pending-changes/55/approve', {}), '55');

    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.errorCode).toBe('operator_tour.invalid_state');
  });

  it('maps a 404 pending-change-not-found failure through unchanged', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({ title: 'Not found', errorCode: 'operator_tour.pending_change_not_found' }, { status: 404 }));

    const response = await proxyPendingChangeDetail(get('/api/admin/tours/pending-changes/999'), '999');

    expect(response.status).toBe(404);
  });

  it('maps an unreachable backend to a 503', async () => {
    fetchBackendMock.mockRejectedValue(new Error('network down'));

    const response = await proxyModerationQueue(get('/api/admin/tours/moderation-queue'));

    expect(response.status).toBe(503);
  });
});
