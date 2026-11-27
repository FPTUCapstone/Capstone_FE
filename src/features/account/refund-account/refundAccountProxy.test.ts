import { afterEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ cookies: vi.fn(), backend: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: mocks.cookies }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: mocks.backend }));
import { proxyRefundAccount } from './refundAccountProxy';
afterEach(() => vi.resetAllMocks());
const account = { bankCode: 'VCB', accountNumber: '1234567890', accountHolder: 'TEST' };

it('returns only own bank fields and makes the response private', async () => {
  mocks.cookies.mockResolvedValue({ get: () => ({ value: 'test-refresh' }) });
  mocks.backend.mockResolvedValueOnce(Response.json({ data: { role: 'Traveler', accessToken: 'test-token' } })).mockResolvedValueOnce(Response.json({ ...account, internalKey: 'private-value' }));
  const response = await proxyRefundAccount(new Request('http://localhost/api/v1/traveler/refund-account?userId=99'));
  expect(await response.json()).toEqual(account);
  expect(response.headers.get('Cache-Control')).toContain('no-store');
  expect(mocks.backend.mock.calls[1][0]).toBe('/api/v1/traveler/refund-account');
});

it('does not permit a TO session to read a Traveler bank profile', async () => {
  mocks.cookies.mockResolvedValue({ get: () => ({ value: 'test-refresh' }) });
  mocks.backend.mockResolvedValueOnce(Response.json({ data: { role: 'TourOperator', accessToken: 'test-token' } }));
  const response = await proxyRefundAccount(new Request('http://localhost/test'));
  expect(response.status).toBe(403);
  expect(mocks.backend).toHaveBeenCalledTimes(1);
});

it('rejects cross-origin writes before fetching authentication', async () => {
  const response = await proxyRefundAccount(new Request('http://localhost/test', { method: 'PUT', headers: { Origin: 'https://untrusted.example' }, body: '{}' }));
  expect(response.status).toBe(403);
  expect(mocks.backend).not.toHaveBeenCalled();
});

it('forwards only bank fields on update and never a client userId', async () => {
  mocks.cookies.mockResolvedValue({ get: () => ({ value: 'test-refresh' }) });
  mocks.backend.mockResolvedValueOnce(Response.json({ data: { role: 'Traveler', accessToken: 'test-token' } })).mockResolvedValueOnce(Response.json(account));
  const response = await proxyRefundAccount(new Request('http://localhost/test', { method: 'PUT', headers: { Origin: 'http://localhost', 'Content-Type': 'application/json' }, body: JSON.stringify({ ...account, userId: 99 }) }));
  expect(response.status).toBe(200);
  expect(JSON.parse(mocks.backend.mock.calls[1][1].body)).toEqual(account);
});
