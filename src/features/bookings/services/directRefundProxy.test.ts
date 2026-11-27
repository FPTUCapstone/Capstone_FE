import { afterEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ auth: vi.fn(), backend: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('./bookingBffAuth', () => ({ bookingAccessToken: mocks.auth }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: mocks.backend }));

import { proxyGetDirectRefundCase, proxyRespondToDirectRefundTransfer } from './directRefundProxy';

afterEach(() => { vi.unstubAllEnvs(); vi.resetAllMocks(); });

it('aligns the refund countdown with the backend business clock including local simulation', async () => {
  mocks.auth.mockResolvedValue({ token: 'test-token' });
  mocks.backend.mockResolvedValue(Response.json({ caseId: 1 }, { headers: { 'X-TripMate-Server-Time': '2026-09-01T02:08:16Z' } }));
  const response = await proxyGetDirectRefundCase(new Request('http://localhost:3001/api/v1/traveler/direct-refunds/1'), '1');
  expect((await response.json()).serverNowUtc).toBe('2026-09-01T02:08:16.000Z');
});

it('accepts the local browser origin when Next uses its bind address and handles a 204 response', async () => {
  vi.stubEnv('NODE_ENV', 'development');
  mocks.auth.mockResolvedValue({ token: 'test-token' });
  mocks.backend.mockResolvedValue(new Response(null, { status: 204 }));
  const response = await proxyRespondToDirectRefundTransfer(new Request('http://0.0.0.0:3001/api/v1/traveler/direct-refunds/1/response', {
    method: 'POST', headers: { Origin: 'http://localhost:3001', 'Content-Type': 'application/json' }, body: '{}',
  }), '1');
  expect(response.status).toBe(200);
  expect(mocks.backend).toHaveBeenCalledOnce();
});

it('rejects an external origin before accessing the backend', async () => {
  const response = await proxyRespondToDirectRefundTransfer(new Request('http://localhost:3001/api/v1/traveler/direct-refunds/1/response', {
    method: 'POST', headers: { Origin: 'https://untrusted.example' }, body: '{}',
  }), '1');
  expect(response.status).toBe(403);
  expect(mocks.backend).not.toHaveBeenCalled();
});
