import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({
  getCookie: vi.fn(),
  loadPoiManagement: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: mocks.getCookie }),
}));
vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
  usePathname: () => '/admin/catalogue/points-of-interest',
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('@/features/admin/catalogue/services/poi-management-api', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('@/features/admin/catalogue/services/poi-management-api')
  >();
  return { ...actual, loadPoiManagement: mocks.loadPoiManagement };
});

import AdminPoiCatalogPage from './page';
import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_SESSION_SEAL_COOKIE,
  ADMIN_SESSION_SECRET_ENV,
  createAdminSessionSeal,
} from '@/lib/server/adminSession';
import { PoiManagementApiError } from '@/features/admin/catalogue/services/poi-management-api';
import type { PoiManagementResponse } from '@/features/admin/catalogue/types/poi-management';

const TEST_SECRET = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8').toString('base64url');
const LOGIN_REDIRECT = '/admin/login?returnUrl=%2Fadmin%2Fcatalogue%2Fpoints-of-interest';

function clientResponse(): PoiManagementResponse {
  return {
    page: 1,
    pageSize: 20,
    totalCount: 1,
    totalPages: 1,
    metadata: { categories: [{ id: 7, name: 'Attraction' }] },
    items: [{
      id: '9007199254740993',
      name: 'Client-backed Point of Interest',
      categoryId: 7,
      categoryName: 'Attraction',
      address: null,
      latitude: 16.003,
      longitude: 108.264,
      openingHours: [],
      status: 'Active',
    }],
  };
}

function mockSealedSession(role: 'Administrator' | 'Staff', token = 'valid-backend-token') {
  const sealed = createAdminSessionSeal({
    token,
    role,
    userId: role === 'Administrator' ? 1 : 2,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    secret: TEST_SECRET,
  })!;
  mocks.getCookie.mockImplementation((name: string) => {
    if (name === ADMIN_ACCESS_TOKEN_COOKIE) return { value: token };
    if (name === ADMIN_SESSION_SEAL_COOKIE) return { value: sealed.seal };
    return undefined;
  });
}

describe('AdminPoiCatalogPage (/admin/catalogue/points-of-interest, Screen #16)', () => {
  let priorSecret: string | undefined;

  beforeEach(() => {
    vi.resetAllMocks();
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

  it('redirects both missing and unsealed sessions to login with the exact returnUrl', async () => {
    mocks.getCookie.mockReturnValue(undefined);
    await AdminPoiCatalogPage();
    expect(mocks.redirect).toHaveBeenCalledWith(LOGIN_REDIRECT);

    mocks.redirect.mockClear();
    mocks.getCookie.mockImplementation((name: string) => (
      name === ADMIN_ACCESS_TOKEN_COOKIE ? { value: 'unsealed-token' } : undefined
    ));
    await AdminPoiCatalogPage();
    expect(mocks.redirect).toHaveBeenCalledWith(LOGIN_REDIRECT);
    expect(mocks.loadPoiManagement).not.toHaveBeenCalled();
  });

  it.each(['Staff', 'Administrator'] as const)(
    'renders one shell and performs one client list load for a sealed %s session',
    async (role) => {
      mockSealedSession(role);
      mocks.loadPoiManagement.mockResolvedValueOnce(clientResponse());
      const result = await AdminPoiCatalogPage();
      render(result);

      expect(mocks.redirect).not.toHaveBeenCalled();
      expect(screen.getByRole('heading', { level: 1, name: 'Points of Interest Catalog' })).toBeTruthy();
      expect(screen.getByText('Master Data Management')).toBeTruthy();
      expect(screen.getAllByRole('main')).toHaveLength(1);
      expect(await screen.findByText('Client-backed Point of Interest')).toBeTruthy();
      await waitFor(() => expect(mocks.loadPoiManagement).toHaveBeenCalledTimes(1));
      expect(mocks.loadPoiManagement).toHaveBeenCalledWith(
        { page: 1, pageSize: 20 },
        expect.any(AbortSignal),
      );
      expect(screen.queryByText(/Remove/i)).toBeNull();
    },
  );

  it('shows backend current-account denial instead of trusting a valid role seal or faking an empty catalogue', async () => {
    mockSealedSession('Administrator', 'valid-but-now-inactive-backend-token');
    mocks.loadPoiManagement.mockRejectedValueOnce(new PoiManagementApiError(
      403,
      'POI_MANAGEMENT_ACCESS_REQUIRED',
    ));

    const result = await AdminPoiCatalogPage();
    render(result);

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect((await screen.findByRole('alert')).textContent).toContain(
      'An active Administrator or Staff account is required.',
    );
    expect(screen.queryByText('No points of interest available')).toBeNull();
    expect(mocks.loadPoiManagement).toHaveBeenCalledTimes(1);
  });
});
