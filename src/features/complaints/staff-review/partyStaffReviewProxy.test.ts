import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ cookies: vi.fn(), backend: vi.fn(), origin: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: mocks.cookies }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: mocks.backend }));
vi.mock('@/lib/server/adminSession', () => ({ isSameOriginRequest: mocks.origin }));
import { proxyPartyStaffReview } from './partyStaffReviewProxy';
beforeEach(() => { vi.clearAllMocks(); mocks.cookies.mockResolvedValue({ get: () => ({ value: 'refresh' }) }); mocks.origin.mockReturnValue(true); });
describe('party Staff review proxy', () => {
  it('allows the owner to read original WebP evidence without broadening new upload types', async () => {
    mocks.backend.mockResolvedValueOnce(Response.json({ data: { role: 'Traveler', accessToken: 'token' } })).mockResolvedValueOnce(new Response('webp', { headers: { 'Content-Type': 'image/webp' } }));
    const response = await proxyPartyStaffReview(new Request('http://localhost/api'), 'Traveler', '1', 'evidence', '2');
    expect(response.status).toBe(200); expect(response.headers.get('content-type')).toBe('image/webp');
  });
  it('rejects cross-origin evidence before authentication or backend work', async () => {
    mocks.origin.mockReturnValue(false);
    const response = await proxyPartyStaffReview(new Request('http://localhost/api', { method: 'POST' }), 'Traveler', '1', 'staff-evidence');
    expect(response.status).toBe(403); expect(mocks.backend).not.toHaveBeenCalled();
  });
  it('does not allow a different role to view the complaint', async () => {
    mocks.backend.mockResolvedValueOnce(Response.json({ data: { role: 'Traveler', accessToken: 'token' } }));
    expect((await proxyPartyStaffReview(new Request('http://localhost/api'), 'Operator', '1', 'staff-review')).status).toBe(403);
    expect(mocks.backend).toHaveBeenCalledTimes(1);
  });
  it('removes unexpected sensitive fields from a valid review response', async () => {
    mocks.backend.mockResolvedValueOnce(Response.json({ data: { role: 'Traveler', accessToken: 'token' } })).mockResolvedValueOnce(Response.json({ data: { complaintId: 1, status: 'AwaitingStaffReview', allowedActions: [], reviewHistory: [], storageKey: 'private', beneficiaryAccount: 'secret' } }));
    const response = await proxyPartyStaffReview(new Request('http://localhost/api'), 'Traveler', '1', 'staff-review');
    expect(response.status).toBe(200); expect(response.headers.get('cache-control')).toContain('no-store');
    const body = await response.json(); expect(body.storageKey).toBeUndefined(); expect(body.beneficiaryAccount).toBeUndefined();
  });
});
