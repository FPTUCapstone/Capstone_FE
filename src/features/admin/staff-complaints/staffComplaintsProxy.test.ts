import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ cookies: vi.fn(), session: vi.fn(), backend: vi.fn(), origin: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: mocks.cookies }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: mocks.backend }));
vi.mock('@/lib/server/adminSession', () => ({ ADMIN_ACCESS_TOKEN_COOKIE: 'token', verifyAdminSessionFromCookies: mocks.session,
  isSameOriginRequest: mocks.origin, clearAdminSession: (r: Response) => r,
  jsonNoStore: (body: unknown, status = 200) => Response.json(body, { status }) }));
import { proxyStaffComplaints } from './staffComplaintsProxy';
describe('Staff complaint BFF authority and request contract', () => {
  it.each(['image/webp', 'application/pdf'])('allows existing original %s evidence up to the original 10 MB limit', async contentType => {
    mocks.backend.mockResolvedValue(new Response(new Uint8Array(6 * 1024 * 1024), { headers: { 'Content-Type': contentType } }));
    const result = await proxyStaffComplaints(new Request('http://localhost/api/staff/post-trip-complaints/1/evidence/2'), '1', 'evidence', '2');
    expect(result.status).toBe(200); expect(result.headers.get('Content-Type')).toBe(contentType);
  });
  beforeEach(() => { vi.clearAllMocks(); mocks.cookies.mockResolvedValue({ get: () => ({ value: 'secret' }) }); mocks.session.mockReturnValue({ role: 'Staff' }); mocks.origin.mockReturnValue(true); mocks.backend.mockResolvedValue(Response.json({ items: [] })); });
  it('accepts Staff and forwards only pagination/filter fields', async () => {
    expect((await proxyStaffComplaints(new Request('http://localhost/api/staff/post-trip-complaints?page=2&token=leak&status=AwaitingStaffReview'))).status).toBe(200);
    expect(mocks.backend.mock.calls[0][0]).toBe('/api/v1/staff/post-trip-complaints?page=2&status=AwaitingStaffReview');
  });
  it('does not grant Administrator the Staff role', async () => { mocks.session.mockReturnValue({ role: 'Administrator' }); expect((await proxyStaffComplaints(new Request('http://localhost/api/staff/post-trip-complaints'))).status).toBe(403); expect(mocks.backend).not.toHaveBeenCalled(); });
  it('requires a signed session', async () => { mocks.session.mockReturnValue(null); expect((await proxyStaffComplaints(new Request('http://localhost/api/staff/post-trip-complaints'))).status).toBe(401); });
  const payload = { action: 'RefundPartial', amount: 10000, reason: 'Verified service failure', contractBasis: 'Clause 3', expectedVersion: 'AAAAAAABAAA=', operationId: '9d141711-6da4-4b88-883b-745635e61456' };
  const post = (body: unknown) => new Request('http://localhost/api/staff/post-trip-complaints/1/decisions', { method: 'POST', body: JSON.stringify(body) });
  it('blocks foreign origin writes', async () => { mocks.origin.mockReturnValue(false); expect((await proxyStaffComplaints(post(payload), '1', 'decisions')).status).toBe(403); });
  it.each([{ ...payload, amount: 1.5 }, { ...payload, amount: 0 }, { ...payload, expectedVersion: '' }, { ...payload, contractBasis: '' }, { ...payload, action: 'Complete' }, { ...payload, operationId: 'bad' }])('rejects malformed decisions', async body => { expect((await proxyStaffComplaints(post(body), '1', 'decisions')).status).toBe(400); expect(mocks.backend).not.toHaveBeenCalled(); });
  it('projects a valid decision and preserves operation identity', async () => { expect((await proxyStaffComplaints(post({ ...payload, token: 'not-forwarded' }), '1', 'decisions')).status).toBe(200); expect(JSON.parse(mocks.backend.mock.calls[0][1].body)).toEqual(payload); });
  it('serves private evidence bytes only', async () => { mocks.backend.mockResolvedValue(new Response('pdf', { headers: { 'Content-Type': 'application/pdf' } })); const result = await proxyStaffComplaints(new Request('http://localhost/api/staff/post-trip-complaints/1/evidence/2'), '1', 'evidence', '2'); expect(result.headers.get('Cache-Control')).toBe('private, no-store'); expect(result.headers.get('X-Content-Type-Options')).toBe('nosniff'); });
});
