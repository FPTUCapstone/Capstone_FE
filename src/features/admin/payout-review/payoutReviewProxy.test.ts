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
import { proxyApprovePayout, proxyGetPayoutDetail, proxyRejectPayout } from './payoutReviewProxy';

const TEST_SECRET = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8').toString('base64url');

function mockSealedCookies(role: 'Administrator' | 'Staff', token = 'admin-token') {
  const sealed = createAdminSessionSeal({
    token,
    role,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    secret: TEST_SECRET,
  })!;
  cookiesMock.mockResolvedValue({
    get: (name: string) => {
      if (name === ADMIN_ACCESS_TOKEN_COOKIE) return { value: token };
      if (name === ADMIN_SESSION_SEAL_COOKIE) return { value: sealed.seal };
      return undefined;
    },
  });
}

const SAME_ORIGIN = 'http://localhost:3000';

function mutationRequest(
  action: 'approve' | 'reject',
  body?: unknown,
  origin: string | null = SAME_ORIGIN,
) {
  return new Request(`${SAME_ORIGIN}/api/admin/payouts/123/${action}`, {
    method: 'POST',
    headers: {
      ...(origin === null ? {} : { Origin: origin }),
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

let priorSecret: string | undefined;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('TRIPMATE_WEB_ORIGIN', '');
  priorSecret = process.env[ADMIN_SESSION_SECRET_ENV];
  process.env[ADMIN_SESSION_SECRET_ENV] = TEST_SECRET;
  mockSealedCookies('Staff');
});
afterEach(() => {
  vi.unstubAllEnvs();
  if (priorSecret === undefined) delete process.env[ADMIN_SESSION_SECRET_ENV];
  else process.env[ADMIN_SESSION_SECRET_ENV] = priorSecret;
});

describe('proxyGetPayoutDetail', () => {
  it('rejects a malformed payoutId before contacting the backend', async () => {
    const res = await proxyGetPayoutDetail('not-a-number');
    expect(res.status).toBe(400);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('forwards to the backend detail endpoint with the bearer token', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({ payoutId: '123' }));
    const res = await proxyGetPayoutDetail('123');
    expect(res.status).toBe(200);
    const [path, init] = fetchBackendMock.mock.calls[0];
    expect(path).toBe('/api/v1/admin/payouts/123');
    expect(init.method).toBe('GET');
    expect(init.headers.Authorization).toBe('Bearer admin-token');
  });

  it('answers 401 without contacting the backend when the session is missing', async () => {
    cookiesMock.mockResolvedValue({ get: () => undefined });
    const res = await proxyGetPayoutDetail('123');
    expect(res.status).toBe(401);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('rejects Administrator before calling the Staff review endpoint', async () => {
    mockSealedCookies('Administrator');
    const res = await proxyGetPayoutDetail('123');
    expect(res.status).toBe(403);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('maps upstream 404 through with a safe body', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({
      title: 'The requested payout record was not found.',
      errorCode: 'payout.not_found',
      traceId: 'private',
    }, { status: 404 }));
    const res = await proxyGetPayoutDetail('999');
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({
      title: 'The requested payout record was not found.',
      errorCode: 'payout.not_found',
    });
  });

  it('maps a backend connection failure to 503', async () => {
    fetchBackendMock.mockRejectedValue(new TypeError('failed'));
    const res = await proxyGetPayoutDetail('123');
    expect(res.status).toBe(503);
  });
});

describe('proxyApprovePayout', () => {
  it.each([null, 'null', 'https://attacker.example'])(
    'rejects an approve mutation from origin %s before reading the Staff session',
    async (origin) => {
      const res = await proxyApprovePayout('123', mutationRequest('approve', undefined, origin));
      expect(res.status).toBe(403);
      await expect(res.json()).resolves.toEqual({ title: 'Request origin is not allowed.' });
      expect(res.headers.get('Cache-Control')).toBe('no-store');
      expect(cookiesMock).not.toHaveBeenCalled();
      expect(fetchBackendMock).not.toHaveBeenCalled();
    },
  );

  it('forwards a POST with no body to the approve endpoint', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({
      payoutId: '123', status: 'ApprovedForSettlement', decidedAtUtc: '2026-10-14T09:00:00Z',
    }));
    const res = await proxyApprovePayout('123', mutationRequest('approve'));
    expect(res.status).toBe(200);
    const [path, init] = fetchBackendMock.mock.calls[0];
    expect(path).toBe('/api/v1/admin/payouts/123/approve');
    expect(init.method).toBe('POST');
    expect(init.body).toBeUndefined();
  });

  it('forwards the currentStatus extension on a 409 conflict', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({
      title: 'The payout request is no longer pending review.',
      errorCode: 'payout.not_pending_review',
      currentStatus: 'Rejected',
    }, { status: 409 }));
    const res = await proxyApprovePayout('123', mutationRequest('approve'));
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toEqual({
      title: 'The payout request is no longer pending review.',
      errorCode: 'payout.not_pending_review',
      currentStatus: 'Rejected',
    });
  });

  it('rejects a malformed payoutId before contacting the backend', async () => {
    const res = await proxyApprovePayout('../etc/passwd', mutationRequest('approve'));
    expect(res.status).toBe(400);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('accepts the configured public origin behind a reverse proxy', async () => {
    vi.stubEnv('TRIPMATE_WEB_ORIGIN', 'https://public.tripmate.test');
    fetchBackendMock.mockResolvedValue(Response.json({ payoutId: '123', status: 'ApprovedForSettlement' }));
    const res = await proxyApprovePayout(
      '123',
      mutationRequest('approve', undefined, 'https://public.tripmate.test'),
    );
    expect(res.status).toBe(200);
    expect(cookiesMock).toHaveBeenCalledOnce();
    expect(fetchBackendMock).toHaveBeenCalledOnce();
  });
});

describe('proxyRejectPayout', () => {
  it.each([null, 'null', 'https://attacker.example'])(
    'rejects a reject mutation from origin %s before reading the Staff session or body',
    async (origin) => {
      const request = mutationRequest(
        'reject',
        { reason: 'Bank details could not be verified.' },
        origin,
      );
      const res = await proxyRejectPayout('123', request);
      expect(res.status).toBe(403);
      await expect(res.json()).resolves.toEqual({ title: 'Request origin is not allowed.' });
      expect(res.headers.get('Cache-Control')).toBe('no-store');
      expect(request.bodyUsed).toBe(false);
      expect(cookiesMock).not.toHaveBeenCalled();
      expect(fetchBackendMock).not.toHaveBeenCalled();
    },
  );

  it('forwards only the reason field, even when the browser sends more', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({
      payoutId: '123', status: 'Rejected', decidedAtUtc: '2026-10-14T09:00:00Z',
      rejectionReason: 'Bank details could not be verified.',
    }));
    const res = await proxyRejectPayout('123', mutationRequest('reject', {
      reason: 'Bank details could not be verified.',
      currentStatus: 'ApprovedForSettlement', // must never be forwarded
    }));
    expect(res.status).toBe(200);
    const [path, init] = fetchBackendMock.mock.calls[0];
    expect(path).toBe('/api/v1/admin/payouts/123/reject');
    expect(JSON.parse(init.body)).toEqual({ reason: 'Bank details could not be verified.' });
  });

  it('forwards an empty reason as an empty string, letting the backend validate it', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({
      title: 'Rejection reason must be between 10 and 500 characters.',
      errorCode: 'payout.rejection_reason_invalid',
      errors: { reason: ['Rejection reason must be between 10 and 500 characters.'] },
    }, { status: 400 }));
    const res = await proxyRejectPayout('123', mutationRequest('reject', {}));
    expect(res.status).toBe(400);
    const [, init] = fetchBackendMock.mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({ reason: '' });
    await expect(res.json()).resolves.toEqual({
      title: 'Rejection reason must be between 10 and 500 characters.',
      errorCode: 'payout.rejection_reason_invalid',
      errors: { reason: ['Rejection reason must be between 10 and 500 characters.'] },
    });
  });

  it('rejects Administrator before reading the body or calling the backend', async () => {
    mockSealedCookies('Administrator');
    const res = await proxyRejectPayout('123', mutationRequest('reject', { reason: 'anything at all here' }));
    expect(res.status).toBe(403);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });
});
