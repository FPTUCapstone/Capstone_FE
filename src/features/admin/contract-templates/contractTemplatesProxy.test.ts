import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { cookiesMock, backend } = vi.hoisted(() => ({ cookiesMock: vi.fn(), backend: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: cookiesMock }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: backend }));
import { ADMIN_ACCESS_TOKEN_COOKIE, ADMIN_SESSION_SEAL_COOKIE, ADMIN_SESSION_SECRET_ENV, createAdminSessionSeal } from '@/lib/server/adminSession';
import { proxyContractTemplates } from './contractTemplatesProxy';

const secret = Buffer.from('0123456789abcdef0123456789abcdef').toString('base64url');
function jar(role: 'Administrator' | 'Staff' = 'Administrator') {
  const seal = createAdminSessionSeal({ token: 'test-token', role, secret, expiresAt: new Date(Date.now() + 600000) });
  if (!seal) throw new Error('Test session seal is required');
  return { get: (name: string) => name === ADMIN_ACCESS_TOKEN_COOKIE ? { value: 'test-token' } : name === ADMIN_SESSION_SEAL_COOKIE ? { value: seal.seal } : undefined };
}
let previous: string | undefined;
beforeEach(() => { previous = process.env[ADMIN_SESSION_SECRET_ENV]; process.env[ADMIN_SESSION_SECRET_ENV] = secret; cookiesMock.mockResolvedValue(jar()); });
afterEach(() => { vi.clearAllMocks(); if (previous === undefined) delete process.env[ADMIN_SESSION_SECRET_ENV]; else process.env[ADMIN_SESSION_SECRET_ENV] = previous; });
const request = (method = 'GET', suffix = '', body?: BodyInit, headers: Record<string, string> = {}) => new Request(`http://localhost:3001/api/admin/contract-templates${suffix}`, { method, body, headers });

describe('private Administrator contract template proxy', () => {
  it('forwards only allowed list query fields and keeps the bearer server-side', async () => {
    backend.mockResolvedValue(Response.json({ items: [] }));
    const response = await proxyContractTemplates(request('GET', '?status=Draft&page=2&pageSize=10&secret=bad'), []);
    expect(response.status).toBe(200);
    expect(backend.mock.calls[0][0]).toBe('/api/v1/admin/contract-templates?status=Draft&page=2&pageSize=10');
    expect(backend.mock.calls[0][1].headers.Authorization).toBe('Bearer test-token');
    expect(response.headers.get('cache-control')).toContain('no-store');
  });
  it('denies Staff before calling the backend', async () => {
    cookiesMock.mockResolvedValue(jar('Staff'));
    expect((await proxyContractTemplates(request(), [])).status).toBe(403);
    expect(backend).not.toHaveBeenCalled();
  });
  it('denies a missing or unsealed session', async () => {
    cookiesMock.mockResolvedValue({ get: () => undefined });
    expect((await proxyContractTemplates(request(), [])).status).toBe(401);
    expect(backend).not.toHaveBeenCalled();
  });
  it('rejects foreign-origin writes and unsupported paths', async () => {
    expect((await proxyContractTemplates(request('POST', '', '{}', { origin: 'https://other.test', 'content-type': 'application/json' }), [])).status).toBe(403);
    expect((await proxyContractTemplates(request(), ['1', 'documents', 'secrets'])).status).toBe(404);
    expect(backend).not.toHaveBeenCalled();
  });
  it('forwards multipart bytes without replacing the boundary', async () => {
    backend.mockResolvedValue(Response.json({ id: '1' }));
    const form = new FormData(); form.set('title', 'Partner'); form.set('file', new Blob(['docx']), 'sample.docx');
    const incoming = request('POST', '', form, { origin: 'http://localhost:3001' });
    expect((await proxyContractTemplates(incoming, [])).status).toBe(200);
    expect(backend.mock.calls[0][1].headers['Content-Type']).toContain('multipart/form-data; boundary=');
    expect(backend.mock.calls[0][1].body).toBeInstanceOf(ArrayBuffer);
  });
  it('streams a private preview with safe response headers', async () => {
    backend.mockResolvedValue(new Response('%PDF-test', { headers: { 'content-type': 'application/pdf', 'set-cookie': 'bad=1' } }));
    const response = await proxyContractTemplates(request(), ['1', 'documents', 'preview']);
    expect(await response.text()).toBe('%PDF-test');
    expect(response.headers.get('content-type')).toBe('application/pdf');
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
  });
  it('does not expose upstream internals when rendering is unavailable', async () => {
    backend.mockResolvedValue(Response.json({ traceId: 'internal', detail: 'storage password' }, { status: 500 }));
    const response = await proxyContractTemplates(request('POST', '', '{}', { origin: 'http://localhost:3001', 'content-type': 'application/json' }), ['1', 'preview']);
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('password');
  });
});
