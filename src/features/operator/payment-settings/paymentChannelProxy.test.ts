import { beforeEach, describe, expect, it, vi } from 'vitest';
const { cookiesMock, backend, adminSession } = vi.hoisted(() => ({ cookiesMock: vi.fn(), backend: vi.fn(), adminSession: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: cookiesMock }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: backend }));
vi.mock('@/lib/server/adminSession', async (load) => ({ ...await load<object>(), verifyAdminSessionFromCookies: adminSession }));
import { proxyPaymentChannel } from './paymentChannelProxy';

const request = (method = 'GET', body?: unknown, suffix = '') => new Request(`http://localhost:3001/api/operator/payment-channel${suffix}`, { method, ...(body === undefined ? {} : { body: JSON.stringify(body), headers: { origin: 'http://localhost:3001', 'content-type': 'application/json' } }) });
const dto = { status: 'Ready', allowedActions: ['submit_credentials'], beneficiaryAccountName: 'TO', apiKey: 'do-not-echo', detail: 'private-diagnostic' };
beforeEach(() => { vi.resetAllMocks(); cookiesMock.mockResolvedValue({ get: () => ({ value: 'test-token' }) }); adminSession.mockReturnValue({ role: 'Administrator' }); });
function operator() { backend.mockResolvedValueOnce(Response.json({ data: { role: 'TourOperator', accessToken: 'test-bearer' } })); }
describe('payment channel BFF boundaries', () => {
  it('keeps operator credentials server-side and projects only safe response fields', async () => {
    operator(); backend.mockResolvedValueOnce(Response.json(dto));
    const response = await proxyPaymentChannel(request('PUT', { clientId: 'client', apiKey: 'secret', checksumKey: 'check', beneficiaryAccountName: 'TO', beneficiaryAccountNumber: '12345', beneficiaryBankCode: '970422', injected: 'bad' }), 'operator');
    expect(response.status).toBe(200);
    expect(backend.mock.calls[1][0]).toBe('/api/v1/operator/payment-channel');
    expect(JSON.parse(backend.mock.calls[1][1].body)).not.toHaveProperty('injected');
    expect(backend.mock.calls[1][1].headers.Authorization).toBe('Bearer test-bearer');
    const data = await response.json(); expect(data.status).toBe('Ready'); expect(data).not.toHaveProperty('apiKey'); expect(data).not.toHaveProperty('detail');
    expect(response.headers.get('cache-control')).toContain('no-store');
  });
  it('denies foreign-origin writes, unknown operations and Staff administration', async () => {
    const foreign = new Request('http://localhost:3001/api/operator/payment-channel', { method: 'PUT', headers: { origin: 'https://evil.test' } });
    expect((await proxyPaymentChannel(foreign, 'operator')).status).toBe(403);
    expect((await proxyPaymentChannel(request(), 'operator', ['secrets'])).status).toBe(404);
    adminSession.mockReturnValue({ role: 'Staff' });
    expect((await proxyPaymentChannel(request(), 'admin')).status).toBe(403);
    expect(backend).not.toHaveBeenCalled();
  });
  it('denies non-operator session and missing authentication', async () => {
    cookiesMock.mockResolvedValue({ get: () => undefined });
    expect((await proxyPaymentChannel(request(), 'operator')).status).toBe(401);
    cookiesMock.mockResolvedValue({ get: () => ({ value: 'refresh' }) });
    backend.mockResolvedValueOnce(Response.json({ data: { role: 'Traveler', accessToken: 'x' } }));
    expect((await proxyPaymentChannel(request(), 'operator')).status).toBe(403);
    expect(backend).toHaveBeenCalledTimes(1);
  });
  it('filters list parameters and sanitizes upstream errors', async () => {
    backend.mockResolvedValueOnce(Response.json({ items: [{ channelId: 1, status: 'PendingVerification', apiKey: 'secret' }], page: 2, pageSize: 20, totalCount: 1 }));
    const result = await proxyPaymentChannel(request('GET', undefined, '?status=PendingVerification&page=2&pageSize=20&key=secret'), 'admin');
    expect(backend.mock.calls[0][0]).toBe('/api/v1/admin/operator-payment-channels?status=PendingVerification&page=2&pageSize=20');
    expect((await result.json()).items[0]).not.toHaveProperty('apiKey');
    backend.mockResolvedValueOnce(Response.json({ errorCode: 'payment_channel.version_conflict', detail: 'secret', traceId: 'internal' }, { status: 409 }));
    const error = await proxyPaymentChannel(request('POST', { operationId: 'test', expectedVersion: 2, reason: 'checked' }), 'admin', ['1', 'approve']);
    expect(error.status).toBe(409); expect(await error.json()).toEqual({ errorCode: 'payment_channel.version_conflict' });
  });
  it('bounds JSON bodies and handles network errors without leaking submitted values', async () => {
    const response = await proxyPaymentChannel(request('PUT', { apiKey: 'x'.repeat(17000) }), 'operator');
    expect(response.status).toBe(413); expect(backend).not.toHaveBeenCalled();
    backend.mockRejectedValueOnce(new Error('secret'));
    expect(await (await proxyPaymentChannel(request(), 'operator')).json()).toEqual({ errorCode: 'payment_channel.unavailable' });
  });
});
