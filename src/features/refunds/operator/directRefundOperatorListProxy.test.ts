import { afterEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ cookies: vi.fn(), backend: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: mocks.cookies }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: mocks.backend }));
vi.mock('@/lib/server/adminSession', () => ({ isSameOriginRequest: () => true }));
import { proxyOperatorListDirectRefundCases } from './directRefundOperatorProxy';
afterEach(() => vi.resetAllMocks());

it('forwards only supported list filters after verifying the operator session', async () => {
  mocks.cookies.mockResolvedValue({ get: () => ({ value: 'refresh-test' }) });
  mocks.backend.mockResolvedValueOnce(Response.json({ data: { accessToken: 'token-test', role: 'TourOperator' } })).mockResolvedValueOnce(Response.json({ items: [], totalCount: 0, pageNumber: 2, pageSize: 20 }));
  const response = await proxyOperatorListDirectRefundCases(new Request('http://localhost/api/v1/operator/direct-refunds?pageNumber=2&pageSize=20&status=Disputed&operatorId=999'));
  expect(response.status).toBe(200);
  const [path, init] = mocks.backend.mock.calls[1];
  expect(path).toBe('/api/v1/operator/direct-refunds?pageNumber=2&pageSize=20&status=Disputed');
  expect(init.headers.Authorization).toBe('Bearer token-test');
});

it('does not fetch a list when no session exists', async () => {
  mocks.cookies.mockResolvedValue({ get: () => undefined });
  const response = await proxyOperatorListDirectRefundCases(new Request('http://localhost/test'));
  expect(response.status).toBe(401);
  expect(mocks.backend).not.toHaveBeenCalled();
});
