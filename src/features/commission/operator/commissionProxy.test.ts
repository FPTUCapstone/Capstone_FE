import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ cookies: vi.fn(), backend: vi.fn(), origin: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: mocks.cookies }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: mocks.backend }));
vi.mock('@/lib/server/adminSession', () => ({ isSameOriginRequest: mocks.origin }));
import { proxyOperatorMockCommissionPayment } from './commissionProxy';
beforeEach(() => { vi.clearAllMocks(); mocks.origin.mockReturnValue(true); mocks.cookies.mockResolvedValue({ get: () => ({ value: 'refresh' }) }); });
describe('commission mock BFF', () => {
  const request = (body: unknown) => new Request('http://localhost/api', { method: 'POST', body: JSON.stringify(body) });
  it('blocks cross-origin and client-supplied amount before forwarding', async () => {
    mocks.origin.mockReturnValue(false);
    expect((await proxyOperatorMockCommissionPayment(request({ paymentId: 1 }), '7')).status).toBe(403);
    mocks.origin.mockReturnValue(true);
    expect((await proxyOperatorMockCommissionPayment(request({ paymentId: 1, amount: 1 }), '7')).status).toBe(400);
    expect(mocks.backend).not.toHaveBeenCalled();
  });
  it('forwards only the owned statement and payment reference after exact role validation', async () => {
    mocks.backend.mockResolvedValueOnce(Response.json({ data: { role: 'TourOperator', accessToken: 'token' } })).mockResolvedValueOnce(Response.json({ success: true }));
    expect((await proxyOperatorMockCommissionPayment(request({ paymentId: 81 }), '7')).status).toBe(200);
    expect(mocks.backend.mock.calls[1][0]).toBe('/api/v1/operator/commission-statements/7/mock-complete');
    expect(JSON.parse(mocks.backend.mock.calls[1][1].body)).toEqual({ paymentId: 81 });
  });
});
