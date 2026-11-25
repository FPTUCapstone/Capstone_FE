import { beforeEach, describe, expect, it, vi } from 'vitest';
const { cookiesMock, backend } = vi.hoisted(() => ({ cookiesMock: vi.fn(), backend: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: cookiesMock }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: backend }));
import { proxyOperatorContracts } from './operatorContractsProxy';

function request(path = '', method = 'GET', body?: string) {
  return new Request(`http://localhost:3002/api/operator/contracts${path}`, { method, headers: { Origin: 'http://localhost:3002', 'Content-Type': 'application/json' }, body });
}
beforeEach(() => { vi.clearAllMocks(); cookiesMock.mockResolvedValue({ get: () => ({ value: 'private-refresh' }) });
  backend.mockImplementation(async (path: string) => path === '/api/v1/auth/web/refresh'
    ? Response.json({ data: { role: 'TourOperator', accessToken: 'private-access' } }) : Response.json({ id: '1' })); });
describe('operator contract BFF boundary', () => {
  it('delivers the exact private PDF preview without triggering a browser download', async () => {
    backend.mockImplementation(async (path: string) => path.includes('refresh')
      ? Response.json({ data: { role: 'TourOperator', accessToken: 'private-access' } })
      : new Response('%PDF-test', { headers: { 'Content-Type': 'application/pdf' } }));
    const response = await proxyOperatorContracts(request('/2/documents/unsigned?format=preview'), ['2', 'documents', 'unsigned']);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(await response.json()).toEqual({ contentType: 'application/pdf', contentBase64: 'JVBERi10ZXN0' });
    expect(response.headers.get('cache-control')).toContain('no-store');
  });
  it('requires the HttpOnly session and the TO role', async () => {
    cookiesMock.mockResolvedValue({ get: () => undefined });
    expect((await proxyOperatorContracts(request('/current'), ['current'])).status).toBe(401);
    expect(backend).not.toHaveBeenCalled();
    cookiesMock.mockResolvedValue({ get: () => ({ value: 'refresh' }) });
    backend.mockResolvedValue(Response.json({ data: { role: 'Traveler', accessToken: 'token' } }));
    expect((await proxyOperatorContracts(request('/current'), ['current'])).status).toBe(403);
  });
  it('rejects cross-origin mutations and unknown routes before contacting the backend', async () => {
    const bad = new Request('http://localhost:3002/api/operator/contracts/1/prepare', { method: 'POST', headers: { Origin: 'https://other.example' } });
    expect((await proxyOperatorContracts(bad, ['1', 'prepare'])).status).toBe(403);
    expect((await proxyOperatorContracts(request('/1/activate', 'POST', '{}'), ['1', 'activate'])).status).toBe(404);
    expect(backend).not.toHaveBeenCalled();
  });
  it('forwards only a validated operation with a server-acquired access token', async () => {
    const response = await proxyOperatorContracts(request('/1/prepare', 'POST', '{}'), ['1', 'prepare']);
    expect(response.status).toBe(200);
    expect(backend.mock.calls[1][0]).toBe('/api/v1/operator/contracts/1/prepare');
    expect(backend.mock.calls[1][1].headers.Authorization).toBe('Bearer private-access');
  });
  it('bounds streamed mutation bodies and never returns private backend diagnostics', async () => {
    expect((await proxyOperatorContracts(request('/1/prepare', 'POST', 'x'.repeat(1024 * 1024 + 1)), ['1', 'prepare'])).status).toBe(413);
    backend.mockImplementation(async (path: string) => path.includes('refresh')
      ? Response.json({ data: { role: 'TourOperator', accessToken: 'private-access' } })
      : Response.json({ errorCode: 'operator_contract.version_changed', detail: 'private diagnostics', traceId: 'private trace' }, { status: 409 }));
    const response = await proxyOperatorContracts(request('/1/prepare', 'POST', '{}'), ['1', 'prepare']);
    expect(await response.json()).toEqual({ errorCode: 'operator_contract.version_changed' });
  });
  it('streams private PDFs with no-store and a safe attachment filename', async () => {
    backend.mockImplementation(async (path: string) => path.includes('refresh')
      ? Response.json({ data: { role: 'TourOperator', accessToken: 'private-access' } })
      : new Response('%PDF-test', { headers: { 'Content-Type': 'application/pdf', 'Set-Cookie': 'private-cookie=x' } }));
    const response = await proxyOperatorContracts(request('/1/documents/signed'), ['1', 'documents', 'signed']);
    expect(response.headers.get('cache-control')).toContain('no-store');
    expect(response.headers.get('content-disposition')).toContain('operator-contract-1-signed.pdf');
    expect(response.headers.get('content-disposition')).toMatch(/^inline;/);
    expect(response.headers.get('content-length')).toBe('9');
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(await response.text()).toBe('%PDF-test');
  });
});
