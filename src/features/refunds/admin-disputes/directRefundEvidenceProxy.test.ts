import { afterEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ cookies: vi.fn(), verify: vi.fn(), backend: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: mocks.cookies }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: mocks.backend }));
vi.mock('@/lib/server/adminSession', () => ({
  ADMIN_ACCESS_TOKEN_COOKIE: 'admin', verifyAdminSessionFromCookies: mocks.verify,
  clearAdminSession: (r: Response) => r, isSameOriginRequest: () => true,
  jsonNoStore: (body: unknown, status: number) => Response.json(body, { status }),
}));
import { proxyAdminDownloadDirectRefundEvidence } from './directRefundDisputesProxy';
afterEach(() => vi.resetAllMocks());

it('streams an authenticated evidence file instead of trying to parse it as JSON', async () => {
  mocks.cookies.mockResolvedValue({ get: () => ({ value: 'test-token' }) });
  mocks.verify.mockReturnValue({ role: 'Administrator' });
  mocks.backend.mockResolvedValue(new Response(new Uint8Array([137, 80, 78, 71]), { headers: { 'Content-Type': 'image/png', 'Content-Disposition': 'inline; filename="proof.png"' } }));
  const response = await proxyAdminDownloadDirectRefundEvidence(new Request('http://localhost/api/v1/admin/direct-refund-disputes/1/evidence/7'), '1', '7');
  expect(response.status).toBe(200);
  expect(response.headers.get('Content-Type')).toBe('image/png');
  expect(response.headers.get('Cache-Control')).toContain('no-store');
  expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([137, 80, 78, 71]));
});

it('blocks staff from downloading admin dispute evidence', async () => {
  mocks.cookies.mockResolvedValue({ get: () => ({ value: 'test-token' }) });
  mocks.verify.mockReturnValue({ role: 'Staff' });
  const response = await proxyAdminDownloadDirectRefundEvidence(new Request('http://localhost/test'), '1', '7');
  expect(response.status).toBe(403);
  expect(mocks.backend).not.toHaveBeenCalled();
});
