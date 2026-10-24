import { beforeEach, describe, expect, it, vi } from 'vitest';

const { resolveWebSessionMock, fetchBackendMock } = vi.hoisted(() => ({
  resolveWebSessionMock: vi.fn(),
  fetchBackendMock: vi.fn(),
}));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/server/webSession', () => ({ resolveWebSession: resolveWebSessionMock }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: fetchBackendMock }));

import { proxyApprovePayout, proxyGetPayoutDetail, proxyRejectPayout } from './payoutReviewProxy';

function mockSession(role: 'Administrator' | 'Staff' | null, accessToken = 'admin-token') {
  resolveWebSessionMock.mockResolvedValue(role ? { accessToken, role } : null);
}

function rejectRequest(body: unknown) {
  return new Request('http://localhost:3000/api/admin/payouts/123/reject', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSession('Staff');
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

  it('answers 401 without contacting the backend when there is no web session', async () => {
    mockSession(null);
    const res = await proxyGetPayoutDetail('123');
    expect(res.status).toBe(401);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it('rejects Administrator before calling the Staff review endpoint', async () => {
    mockSession('Administrator');
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
  it('forwards a POST with no body to the approve endpoint', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({
      payoutId: '123', status: 'ApprovedForSettlement', decidedAtUtc: '2026-10-14T09:00:00Z',
    }));
    const res = await proxyApprovePayout('123');
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
    const res = await proxyApprovePayout('123');
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toEqual({
      title: 'The payout request is no longer pending review.',
      errorCode: 'payout.not_pending_review',
      currentStatus: 'Rejected',
    });
  });

  it('rejects a malformed payoutId before contacting the backend', async () => {
    const res = await proxyApprovePayout('../etc/passwd');
    expect(res.status).toBe(400);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });
});

describe('proxyRejectPayout', () => {
  it('forwards only the reason field, even when the browser sends more', async () => {
    fetchBackendMock.mockResolvedValue(Response.json({
      payoutId: '123', status: 'Rejected', decidedAtUtc: '2026-10-14T09:00:00Z',
      rejectionReason: 'Bank details could not be verified.',
    }));
    const res = await proxyRejectPayout('123', rejectRequest({
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
    const res = await proxyRejectPayout('123', rejectRequest({}));
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
    mockSession('Administrator');
    const res = await proxyRejectPayout('123', rejectRequest({ reason: 'anything at all here' }));
    expect(res.status).toBe(403);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });
});
