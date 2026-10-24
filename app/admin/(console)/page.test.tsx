import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({
  resolveWebSession: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('@/lib/server/webSession', () => ({ resolveWebSession: mocks.resolveWebSession }));
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
import AdminConsoleLayout from './layout';
import AdminConsolePage from './page';
import AlgorithmParametersPage from './settings/algorithm-parameters/page';
import StaffDashboardPage from './staff/page';
import TourOperatorApplicationDetailPage from './tour-operator-applications/[userId]/page';
import AdminTourReviewQueuePage from './tours/reviews/page';

function mockSession(role: 'Administrator' | 'Staff') {
  mocks.resolveWebSession.mockResolvedValue({ accessToken: 'valid-backend-token', role });
}

describe('Administration Console Route Access Control (Fail-Closed BFF Session)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('AdminConsoleLayout redirects unauthenticated requests to /sign-in and renders navigation for valid sessions', async () => {
    mocks.resolveWebSession.mockResolvedValue(null);
    await AdminConsoleLayout({ children: <div>ChildContent</div> });
    expect(mocks.redirect).toHaveBeenCalledWith('/sign-in');

    mocks.redirect.mockClear();
    mockSession('Staff');
    render(await AdminConsoleLayout({ children: <div>ChildContent</div> }));
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(screen.getByText('ChildContent')).toBeTruthy();
  });

  it('AdminConsolePage (/admin) redirects unauthenticated users to sign-in, redirects Staff to /admin/staff, and renders AdminDashboard for Administrator', async () => {
    mocks.resolveWebSession.mockResolvedValue(null);
    await AdminConsolePage();
    expect(mocks.redirect).toHaveBeenCalledWith('/sign-in?returnUrl=%2Fadmin');

    mocks.redirect.mockClear();
    mockSession('Staff');
    await AdminConsolePage();
    expect(mocks.redirect).toHaveBeenCalledWith('/admin/staff');

    mocks.redirect.mockClear();
    mockSession('Administrator');
    render(await AdminConsolePage());
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(screen.getByText('AdminDashboardMock')).toBeTruthy();
  });

  it('StaffDashboardPage (/admin/staff) redirects unauthenticated requests to sign-in and allows Staff and Administrator', async () => {
    mocks.resolveWebSession.mockResolvedValue(null);
    await StaffDashboardPage();
    expect(mocks.redirect).toHaveBeenCalledWith('/sign-in?returnUrl=%2Fadmin%2Fstaff');

    for (const role of ['Staff', 'Administrator'] as const) {
      mocks.redirect.mockClear();
      mockSession(role);
      const { unmount } = render(await StaffDashboardPage());
      expect(mocks.redirect).not.toHaveBeenCalled();
      expect(screen.getByText('StaffDashboardMock')).toBeTruthy();
      unmount();
    }
  });

  it('AlgorithmParametersPage redirects unauthenticated requests to sign-in, blocks Staff with AdminAccessDeniedView, and renders for Administrator', async () => {
    mocks.resolveWebSession.mockResolvedValue(null);
    await AlgorithmParametersPage();
    expect(mocks.redirect).toHaveBeenCalledWith(
      '/sign-in?returnUrl=%2Fadmin%2Fsettings%2Falgorithm-parameters',
    );

    mocks.redirect.mockClear();
    mockSession('Staff');
    const denied = render(await AlgorithmParametersPage());
    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(screen.getByRole('heading', { name: 'Administrator Access Required' })).toBeTruthy();
    denied.unmount();

    mockSession('Administrator');
    render(await AlgorithmParametersPage());
    expect(screen.getByText('AlgorithmConfigMock')).toBeTruthy();
  });

  it('AdminTourReviewQueuePage and TourOperatorApplicationDetailPage block Staff with AdminAccessDeniedView', async () => {
    mockSession('Staff');
    const reviewDenied = render(await AdminTourReviewQueuePage());
    expect(screen.getByRole('heading', { name: 'Administrator Access Required' })).toBeTruthy();
    reviewDenied.unmount();

    const appDenied = render(
      await TourOperatorApplicationDetailPage({ params: Promise.resolve({ userId: '2' }) }),
    );
    expect(screen.getByRole('heading', { name: 'Administrator Access Required' })).toBeTruthy();
    appDenied.unmount();
  });

  it('NewPoiPage allows Staff and blocks Administrator with the Staff-required view', async () => {
    mockSession('Administrator');
    const denied = render(await NewPoiPage());
    expect(screen.getByRole('heading', { name: 'Staff Access Required' })).toBeTruthy();
    expect(screen.queryByText('CreatePoiMock')).toBeNull();
    denied.unmount();

    mockSession('Staff');
    render(await NewPoiPage());
    expect(screen.getByText('CreatePoiMock')).toBeTruthy();
  });
});
