import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/server/backend', () => ({
  fetchBackend: vi.fn(async () => new Response(JSON.stringify({ items: [], totalPages: 1 }), {
    headers: { 'Content-Type': 'application/json' },
  })),
}));

const mocks = vi.hoisted(() => ({
  getCookie: vi.fn(),
  redirect: vi.fn(),
  fetchBackend: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: mocks.getCookie }),
}));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/lib/server/backend', () => ({ fetchBackend: mocks.fetchBackend }));

import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_SESSION_SEAL_COOKIE,
  ADMIN_SESSION_SECRET_ENV,
  createAdminSessionSeal,
} from '@/lib/server/adminSession';
import UserAccountsPage from './page';
import UserAccountsLoading from './loading';

const TEST_SECRET = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8').toString('base64url');

function mockSealedCookies(role: 'Administrator' | 'Staff' = 'Administrator', token = 'backend-access-token') {
  const sealed = createAdminSessionSeal({
    token,
    role,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    secret: TEST_SECRET,
  })!;
  mocks.getCookie.mockImplementation((name: string) => {
    if (name === ADMIN_ACCESS_TOKEN_COOKIE) return { value: token };
    if (name === ADMIN_SESSION_SEAL_COOKIE) return { value: sealed.seal };
    return undefined;
  });
}

describe('UC-46 User Accounts Directory page route', () => {
  let priorSecret: string | undefined;

  beforeEach(() => {
    vi.resetAllMocks();
    mocks.fetchBackend.mockResolvedValue(Response.json({ items: [], totalPages: 0 }));
    priorSecret = process.env[ADMIN_SESSION_SECRET_ENV];
    process.env[ADMIN_SESSION_SECRET_ENV] = TEST_SECRET;
  });

  afterEach(() => {
    if (priorSecret === undefined) {
      delete process.env[ADMIN_SESSION_SECRET_ENV];
    } else {
      process.env[ADMIN_SESSION_SECRET_ENV] = priorSecret;
    }
  });

  it('redirects missing session cookies to login with returnUrl', async () => {
    mocks.getCookie.mockReturnValue(undefined);

    await UserAccountsPage({});

    expect(mocks.redirect).toHaveBeenCalledWith(
      '/admin/login?returnUrl=%2Fadmin%2Fusers',
    );
  });

  it('redirects unsealed or invalid token to login', async () => {
    mocks.getCookie.mockImplementation((name: string) =>
      name === ADMIN_ACCESS_TOKEN_COOKIE ? { value: 'unsealed-token' } : undefined,
    );

    await UserAccountsPage({});

    expect(mocks.redirect).toHaveBeenCalledWith(
      '/admin/login?returnUrl=%2Fadmin%2Fusers',
    );
  });

  it('redirects expired session seal to login', async () => {
    const expiredSealed = createAdminSessionSeal({
      token: 'backend-access-token',
      role: 'Administrator',
      nowMs: Date.now() - 20 * 60 * 1000,
      expiresAt: new Date(Date.now() - 10 * 60 * 1000),
      secret: TEST_SECRET,
    })!;
    mocks.getCookie.mockImplementation((name: string) => {
      if (name === ADMIN_ACCESS_TOKEN_COOKIE) return { value: 'backend-access-token' };
      if (name === ADMIN_SESSION_SEAL_COOKIE) return { value: expiredSealed.seal };
      return undefined;
    });

    await UserAccountsPage({});

    expect(mocks.redirect).toHaveBeenCalledWith(
      '/admin/login?returnUrl=%2Fadmin%2Fusers',
    );
  });

  it('redirects tampered session seal to login', async () => {
    const validSealed = createAdminSessionSeal({
      token: 'backend-access-token',
      role: 'Administrator',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      secret: TEST_SECRET,
    })!;
    const tamperedSeal = validSealed.seal.slice(0, -1) + (validSealed.seal.endsWith('a') ? 'b' : 'a');
    mocks.getCookie.mockImplementation((name: string) => {
      if (name === ADMIN_ACCESS_TOKEN_COOKIE) return { value: 'backend-access-token' };
      if (name === ADMIN_SESSION_SEAL_COOKIE) return { value: tamperedSeal };
      return undefined;
    });

    await UserAccountsPage({});

    expect(mocks.redirect).toHaveBeenCalledWith(
      '/admin/login?returnUrl=%2Fadmin%2Fusers',
    );
  });

  it('redirects access token mismatch to login', async () => {
    const sealed = createAdminSessionSeal({
      token: 'original-backend-token',
      role: 'Administrator',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      secret: TEST_SECRET,
    })!;
    mocks.getCookie.mockImplementation((name: string) => {
      if (name === ADMIN_ACCESS_TOKEN_COOKIE) return { value: 'different-backend-token' };
      if (name === ADMIN_SESSION_SEAL_COOKIE) return { value: sealed.seal };
      return undefined;
    });

    await UserAccountsPage({});

    expect(mocks.redirect).toHaveBeenCalledWith(
      '/admin/login?returnUrl=%2Fadmin%2Fusers',
    );
  });

  it('renders directory when valid Administrator session is present', async () => {
    mockSealedCookies('Administrator');

    const view = await UserAccountsPage({});

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(view).toBeTruthy();
    render(view!);
    expect(screen.getByRole('link', { name: 'Create Staff Account' }).getAttribute('href'))
      .toBe('/admin/users/create-staff');
    const markup = renderToStaticMarkup(view!);
    expect(markup).toContain('<option>Staff</option>');
    expect(markup).not.toContain('<option>Traveler</option>');
  });

  it('renders user management with the Staff provisioning entrypoint', async () => {
    mockSealedCookies('Staff');

    const view = await UserAccountsPage({});

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(view).toBeTruthy();
    render(view!);
    expect(screen.getByRole('link', { name: 'Create Service Provider Account' }).getAttribute('href'))
      .toBe('/admin/service-providers/create');
    const markup = renderToStaticMarkup(view!);
    expect(markup).toContain('<option>ServiceProvider</option>');
    expect(markup).not.toContain('<option>Administrator</option>');
    expect(markup).not.toContain('<option>Staff</option>');
  });

  it('forwards scoped filters and the full Vietnam-local end date without rendering the token', async () => {
    mockSealedCookies('Staff');
    mocks.fetchBackend.mockResolvedValue(Response.json({ items: [], totalPages: 4 }));
    const searchParams = Promise.resolve({
      search: 'Mai', role: 'ServiceProvider', status: 'Active',
      registeredFrom: '2024-02-29', registeredTo: '2024-03-01', page: '2',
    });
    const markup = renderToStaticMarkup((await UserAccountsPage({ searchParams }))!);
    const [path, init] = mocks.fetchBackend.mock.calls[0];
    const query = new URL(path, 'http://localhost').searchParams;
    expect(Object.fromEntries(query)).toEqual({
      search: 'Mai', role: 'ServiceProvider', status: 'Active',
      registeredFrom: '2024-02-29T00:00:00+07:00',
      registeredTo: '2024-03-01T23:59:59.9999999+07:00', page: '2',
    });
    expect(init.headers.get('Authorization')).toBe('Bearer backend-access-token');
    expect(markup).toContain('page=3');
    expect(markup).toContain('No matching accounts.');
    expect(markup).not.toContain('backend-access-token');
  });

  it('displays accurate totalCount when provided by backend', async () => {
    mockSealedCookies('Administrator');
    mocks.fetchBackend.mockResolvedValue(
      Response.json({
        items: [
          {
            userId: '101',
            fullName: 'Nguyen Staff',
            email: 'staff@tripmate.vn',
            role: 'Staff',
            status: 'Active',
            createdAtUtc: '2026-03-01T08:00:00Z',
            lastLoginAtUtc: null,
          },
        ],
        totalPages: 5,
        totalCount: 48,
      }),
    );

    const markup = renderToStaticMarkup((await UserAccountsPage({}))!);
    expect(markup).toContain('of <strong class="text-[#1D2D2B] font-bold">48</strong> total accounts');
    expect(markup).toContain('Page <strong class="text-[#1D2D2B] font-bold">1</strong> of <strong class="text-[#1D2D2B] font-bold">5</strong>');
  });

  it('renders accurate message without misleading total when totalCount is not provided', async () => {
    mockSealedCookies('Administrator');
    mocks.fetchBackend.mockResolvedValue(
      Response.json({
        items: [
          {
            userId: '101',
            fullName: 'Nguyen Staff',
            email: 'staff@tripmate.vn',
            role: 'Staff',
            status: 'Active',
            createdAtUtc: '2026-03-01T08:00:00Z',
            lastLoginAtUtc: null,
          },
        ],
        totalPages: 2,
      }),
    );

    const markup = renderToStaticMarkup((await UserAccountsPage({}))!);
    expect(markup).toContain('Showing <strong class="text-[#1D2D2B] font-bold">1</strong> account');
    expect(markup).not.toContain('total accounts');
  });

  it('informs user with non-misleading notice when page has records outside user role management scope', async () => {
    mockSealedCookies('Administrator');
    mocks.fetchBackend.mockResolvedValue(
      Response.json({
        items: [
          {
            userId: '201',
            fullName: 'Tran Traveler',
            email: 'traveler@gmail.com',
            role: 'Traveler',
            status: 'Active',
            createdAtUtc: '2026-03-01T08:00:00Z',
            lastLoginAtUtc: null,
          },
        ],
        totalPages: 1,
        totalCount: 1,
      }),
    );

    const markup = renderToStaticMarkup((await UserAccountsPage({}))!);
    expect(markup).toContain('No permitted accounts on this page.');
    expect(markup).toContain('none match your Administrator management scope');
  });

  it.each([
    { registeredFrom: '0001-01-01' },
    { registeredFrom: '2026-02-29' },
    { registeredFrom: '2026-02-23', registeredTo: '2026-02-22' },
  ])('shows the date error for a direct invalid URL', async (filters) => {
    mockSealedCookies();
    const view = await UserAccountsPage({ searchParams: Promise.resolve(filters) });
    expect(renderToStaticMarkup(view!)).toContain('The selected date range is invalid.');
    expect(mocks.fetchBackend).not.toHaveBeenCalled();
  });

  it('shows a safe retrieval failure', async () => {
    mockSealedCookies();
    mocks.fetchBackend.mockResolvedValue(Response.json({ title: 'Internal error' }, { status: 500 }));
    expect(renderToStaticMarkup((await UserAccountsPage({}))!)).toContain('User accounts could not be loaded.');
  });

  it('announces loading before the account route resolves', () => {
    expect(renderToStaticMarkup(<UserAccountsLoading />)).toContain('role="status"');
  });
});
