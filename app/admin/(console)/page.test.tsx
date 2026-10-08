import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({
  getCookie: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({ get: mocks.getCookie }),
}));
vi.mock('next/navigation', () => ({
  redirect: mocks.redirect,
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('@/features/admin/dashboard/AdminDashboard', () => ({
  AdminDashboard: () => <div>AdminDashboardMock</div>,
}));
vi.mock('@/features/admin/staff/components/StaffDashboardView', () => ({
  StaffDashboardView: () => <div>StaffDashboardMock</div>,
}));
vi.mock('@/features/admin/algorithm-config/AlgorithmConfigForm', () => ({
  AlgorithmConfigForm: () => <div>AlgorithmConfigMock</div>,
}));
vi.mock('@/features/admin/create-poi', () => ({
  CreatePoiPage: () => <div>CreatePoiMock</div>,
}));
vi.mock('@/features/admin/tour-reviews/TourReviewQueue', () => ({
  TourReviewQueue: () => <div>TourReviewQueueMock</div>,
}));
vi.mock(
  '@/features/admin/tour-operator-applications/components/TourOperatorApplicationDetailView',
  () => ({
    TourOperatorApplicationDetailView: () => <div>OperatorApplicationDetailMock</div>,
  }),
);

import NewPoiPage from '@/../app/admin/catalogue/points-of-interest/new/page';
import {
  ADMIN_ACCESS_TOKEN_COOKIE,
  ADMIN_SESSION_SEAL_COOKIE,
  ADMIN_SESSION_SECRET_ENV,
  createAdminSessionSeal,
} from '@/lib/server/adminSession';
import AdminConsoleLayout from './layout';
import AdminConsolePage from './page';
import AlgorithmParametersPage from './settings/algorithm-parameters/page';
import StaffDashboardPage from './staff/page';
import TourOperatorApplicationDetailPage from './tour-operator-applications/[userId]/page';
import AdminTourReviewQueuePage from './tours/reviews/page';

const TEST_SECRET = Buffer.from('0123456789abcdef0123456789abcdef', 'utf8').toString('base64url');

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

describe('Administration Console Route Access Control (Fail-Closed BFF Session)', () => {
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

  it('AdminConsoleLayout redirects unauthenticated or unsealed requests to /admin/login and renders navigation for valid sessions', async () => {
    mocks.getCookie.mockReturnValue(undefined);
    await AdminConsoleLayout({ children: <div>ChildContent</div> });
    expect(mocks.redirect).toHaveBeenCalledWith('/admin/login');

    mocks.redirect.mockClear();
    mocks.getCookie.mockImplementation((name: string) =>
      name === ADMIN_ACCESS_TOKEN_COOKIE ? { value: 'forged-unsealed-token' } : undefined,
    );
    await AdminConsoleLayout({ children: <div>ChildContent</div> });
    expect(mocks.redirect).toHaveBeenCalledWith('/admin/login');

    mocks.redirect.mockClear();
    mockSealedSession('Staff');
    render(await AdminConsoleLayout({ children: <div>ChildContent</div> }));
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(screen.getByText('ChildContent')).toBeTruthy();
  });

  it('AdminConsolePage (/admin) redirects unauthenticated users to login, redirects Staff to /admin/staff, and renders AdminDashboard for Administrator', async () => {
    mocks.getCookie.mockReturnValue(undefined);
    await AdminConsolePage();
    expect(mocks.redirect).toHaveBeenCalledWith('/admin/login?returnUrl=%2Fadmin');

    mocks.redirect.mockClear();
    mockSealedSession('Staff');
    await AdminConsolePage();
    expect(mocks.redirect).toHaveBeenCalledWith('/admin/staff');

    mocks.redirect.mockClear();
    mockSealedSession('Administrator');
    render(await AdminConsolePage());
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(screen.getByText('AdminDashboardMock')).toBeTruthy();
  });

  it('StaffDashboardPage (/admin/staff) redirects unauthenticated or unsealed requests to login and allows Staff and Administrator', async () => {
    mocks.getCookie.mockReturnValue(undefined);
    await StaffDashboardPage();
    expect(mocks.redirect).toHaveBeenCalledWith('/admin/login?returnUrl=%2Fadmin%2Fstaff');

    for (const role of ['Staff', 'Administrator'] as const) {
      mocks.redirect.mockClear();
      mockSealedSession(role);
      const { unmount } = render(await StaffDashboardPage());
      expect(mocks.redirect).not.toHaveBeenCalled();
      expect(screen.getByText('StaffDashboardMock')).toBeTruthy();
      unmount();
    }
  });

  it('AlgorithmParametersPage redirects unauthenticated requests to login, blocks Staff with AdminAccessDeniedView, and renders for Administrator', async () => {
    mocks.getCookie.mockReturnValue(undefined);
    await AlgorithmParametersPage();
    expect(mocks.redirect).toHaveBeenCalledWith(
      '/admin/login?returnUrl=%2Fadmin%2Fsettings%2Falgorithm-parameters',
    );

    mocks.redirect.mockClear();
    mockSealedSession('Staff');
    const denied = render(await AlgorithmParametersPage());
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Administrator Access Required' })).toBeTruthy();
    denied.unmount();

    mockSealedSession('Administrator');
    render(await AlgorithmParametersPage());
    expect(screen.getByText('AlgorithmConfigMock')).toBeTruthy();
  });

  it('NewPoiPage, AdminTourReviewQueuePage, and TourOperatorApplicationDetailPage block Staff with AdminAccessDeniedView and allow Administrator', async () => {
    mockSealedSession('Staff');
    const poiDenied = render(await NewPoiPage());
    expect(screen.getByRole('heading', { name: 'Administrator Access Required' })).toBeTruthy();
    poiDenied.unmount();

    const reviewDenied = render(await AdminTourReviewQueuePage());
    expect(screen.getByRole('heading', { name: 'Administrator Access Required' })).toBeTruthy();
    reviewDenied.unmount();

    const appDenied = render(
      await TourOperatorApplicationDetailPage({ params: Promise.resolve({ userId: '2' }) }),
    );
    expect(screen.getByRole('heading', { name: 'Administrator Access Required' })).toBeTruthy();
    appDenied.unmount();

    mockSealedSession('Administrator');
    const poiAllowed = render(await NewPoiPage());
    expect(screen.getByText('CreatePoiMock')).toBeTruthy();
    poiAllowed.unmount();
  });
});
