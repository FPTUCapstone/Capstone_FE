import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ cookies: vi.fn(), verify: vi.fn(), backend: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: mocks.cookies }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: mocks.backend }));
vi.mock('@/lib/server/adminSession', async original => ({ ...await original<typeof import('@/lib/server/adminSession')>(), verifyAdminSessionFromCookies: mocks.verify }));
import { proxyRoutes } from './route-proxy';
beforeEach(() => {
  vi.clearAllMocks();
  mocks.cookies.mockResolvedValue({ get: () => ({ value: 'staff-token' }) });
  mocks.verify.mockReturnValue({ role: 'Staff' });
  mocks.backend.mockResolvedValue(Response.json({ id: 1 }, { status: 201 }));
});
const post = (origin = 'http://localhost:3001') => new Request('http://localhost:3001/api/admin/routes', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json', 'Idempotency-Key': 'key' }, body: '{}' });
describe('Staff routes BFF', () => {
  it('forwards the operation key and bearer only from sealed Staff cookies', async () => {
    const response = await proxyRoutes(post());
    expect(response.status).toBe(201);
    expect(mocks.backend.mock.calls[0][1].headers).toMatchObject({ Authorization: 'Bearer staff-token', 'Idempotency-Key': 'key' });
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });
  it('refuses Administrator before calling the backend', async () => {
    mocks.verify.mockReturnValue({ role: 'Administrator' });
    const response = await proxyRoutes(post());
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ errorCode: 'MSG126' });
    expect(mocks.backend).not.toHaveBeenCalled();
  });
  it('refuses unsealed sessions and cross-origin writes', async () => {
    mocks.verify.mockReturnValue(null);
    expect((await proxyRoutes(post())).status).toBe(401);
    expect((await proxyRoutes(post('https://attacker.test'))).status).toBe(403);
    expect(mocks.backend).not.toHaveBeenCalled();
  });
  it('preserves domain errors but normalizes database failure', async () => {
    mocks.backend.mockResolvedValueOnce(Response.json({ errorCode: 'MSG141' }, { status: 400 }));
    expect(await (await proxyRoutes(post())).json()).toMatchObject({ errorCode: 'MSG141' });
    mocks.backend.mockRejectedValueOnce(new Error('database connection secret'));
    const response = await proxyRoutes(post());
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ errorCode: 'MSG127' });
  });
  it('only forwards supported list query parameters', async () => {
    await proxyRoutes(new Request('http://localhost:3001/api/admin/routes?page=2&pageSize=20&token=untrusted'));
    expect(mocks.backend.mock.calls[0][0]).toBe('/api/v1/admin/routes?page=2&pageSize=20');
  });
});
