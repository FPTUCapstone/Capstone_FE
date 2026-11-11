import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { cookiesMock, fetchBackendMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  fetchBackendMock: vi.fn(),
}));
vi.mock('next/headers', () => ({ cookies: cookiesMock }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: fetchBackendMock }));

import { proxyOperatorPayout } from './operatorPayoutProxy';

const origin = 'https://tripmate.test';
function request(method = 'POST', requestOrigin: string | null = origin, body?: string) {
  return new Request(`${origin}/api/operator/payouts?year=2026`, {
    method,
    headers: requestOrigin === null ? {} : { Origin: requestOrigin },
    body,
  });
}
function authorize(role = 'TourOperator') {
  fetchBackendMock.mockResolvedValueOnce(Response.json({ data: { accessToken: 'access', role } }));
}

describe('operator payout mutation origin boundary', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv('TRIPMATE_WEB_ORIGIN', '');
    cookiesMock.mockResolvedValue({ get: () => ({ value: 'refresh' }) });
  });
  afterEach(() => vi.unstubAllEnvs());

  for (const [method, resource] of [['POST', ''], ['PUT', 'bank-account'], ['POST', 'PO-01/cancel']]) {
    it.each([null, 'null', 'https://foreign.test'])(`rejects ${method} ${resource} from %s before session access`, async (source) => {
      const response = await proxyOperatorPayout(request(method, source), resource);
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({ errorCode: 'OPERATOR_NOT_APPROVED' });
      expect(response.headers.get('Cache-Control')).toContain('no-store');
      expect(cookiesMock).not.toHaveBeenCalled();
      expect(fetchBackendMock).not.toHaveBeenCalled();
    });
  }

  it('checks the effective overridden write method before cookies', async () => {
    const response = await proxyOperatorPayout(request('GET', null), '', { method: 'POST' });
    expect(response.status).toBe(403);
    expect(cookiesMock).not.toHaveBeenCalled();
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it.each([['POST', ''], ['PUT', 'bank-account'], ['POST', 'PO-01/cancel']])('preserves authorized %s %s forwarding', async (method, resource) => {
    authorize();
    const data = { payoutCode: 'PO-01', status: 'PendingReview' };
    fetchBackendMock.mockResolvedValueOnce(Response.json(data, { status: 201 }));
    const payload = method === 'PUT' ? '{"accountNumber":"123456"}' : undefined;
    const input = request(method, origin, payload);
    const response = await proxyOperatorPayout(input, resource, { forwardQuery: false });
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual(data);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(fetchBackendMock).toHaveBeenNthCalledWith(2,
      `/api/v1/operator/payouts${resource ? `/${resource}` : ''}`,
      expect.objectContaining({ method, signal: input.signal, headers: expect.objectContaining({ Authorization: 'Bearer access' }) }));
    expect(fetchBackendMock.mock.calls[1][1].body).toBe(payload);
    expect(fetchBackendMock.mock.calls[1][1].headers['Content-Type']).toBe(payload ? 'application/json' : undefined);
  });

  it('accepts the configured public origin behind a reverse proxy', async () => {
    vi.stubEnv('TRIPMATE_WEB_ORIGIN', 'https://public.tripmate.test');
    authorize();
    fetchBackendMock.mockResolvedValueOnce(Response.json({ ok: true }));
    const response = await proxyOperatorPayout(request('POST', 'https://public.tripmate.test'), '');
    expect(response.status).toBe(200);
    expect(fetchBackendMock).toHaveBeenCalledTimes(2);
  });

  it('preserves originless GET and query forwarding', async () => {
    authorize();
    fetchBackendMock.mockResolvedValueOnce(Response.json({ items: [] }));
    const response = await proxyOperatorPayout(request('GET', null), 'settlement-months');
    expect(response.status).toBe(200);
    expect(fetchBackendMock.mock.calls[1][0]).toBe('/api/v1/operator/payouts/settlement-months?year=2026');
    expect(fetchBackendMock.mock.calls[1][1].method).toBe('GET');
  });

  it('preserves missing-cookie rejection for same-origin writes', async () => {
    cookiesMock.mockResolvedValue({ get: () => undefined });
    const response = await proxyOperatorPayout(request(), '');
    expect(response.status).toBe(401);
    expect(fetchBackendMock).not.toHaveBeenCalled();
  });

  it.each([{ data: { accessToken: 'access', role: 'Traveler' } }, {}, null])('rejects invalid refresh contexts without dispatching a write', async (context) => {
    fetchBackendMock.mockResolvedValueOnce(Response.json(context));
    const response = await proxyOperatorPayout(request(), '');
    expect(response.status).toBe(401);
    expect(fetchBackendMock).toHaveBeenCalledTimes(1);
  });

  it('preserves upstream conflict status and response', async () => {
    authorize();
    fetchBackendMock.mockResolvedValueOnce(Response.json({ errorCode: 'PAYOUT_NOT_CANCELLABLE' }, { status: 409 }));
    const response = await proxyOperatorPayout(request(), 'PO-01/cancel');
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ errorCode: 'PAYOUT_NOT_CANCELLABLE' });
  });

  it('preserves safe network failure handling', async () => {
    fetchBackendMock.mockRejectedValueOnce(new Error('private upstream detail'));
    const response = await proxyOperatorPayout(request(), '');
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ errorCode: 'SYSTEM_ERROR' });
  });
});
