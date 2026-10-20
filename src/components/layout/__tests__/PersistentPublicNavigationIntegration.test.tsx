import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { PersistentPublicLayout } from '../PersistentPublicLayout';
import { PublicNavigation } from '@/components/navigation/PublicNavigation';
import { PageTransition } from '@/components/navigation/PageTransition';

let currentPath = '/';

vi.mock('next/navigation', () => ({
  usePathname: () => currentPath,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('@/features/auth/session/useWebSession', () => ({
  useWebSession: () => ({
    status: 'unauthenticated',
    context: null,
  }),
}));

vi.mock('@/components/brand/BrandLogo', () => ({
  BrandLogo: () => <div data-testid="brand-logo">TripMate Brand</div>,
}));

vi.mock('@/components/LogoutButton', () => ({
  default: () => <button data-testid="logout-btn">Đăng xuất</button>,
}));

vi.mock('@/features/account/profile/travelerProfileApi', () => ({
  getTravelerProfile: vi.fn().mockResolvedValue({}),
  TRAVELER_PROFILE_UPDATED_EVENT: 'traveler-profile-updated',
}));

describe('Persistent Public Navigation Integration', () => {
  beforeEach(() => {
    document.documentElement.lang = 'vi';
    currentPath = '/';
  });

  it('keeps PublicNavigation mounted and visible when route changes from / to /tours', () => {
    function NavHost({ route }: { route: string }) {
      return (
        <PersistentPublicLayout>
          <PageTransition>
            {route === '/' ? (
              <div data-testid="page-home">
                <h1>Homepage</h1>
              </div>
            ) : (
              <div data-testid="page-tours">
                <h1>Tours Page</h1>
              </div>
            )}
          </PageTransition>
        </PersistentPublicLayout>
      );
    }

    currentPath = '/';
    const { rerender } = render(<NavHost route="/" />);

    // On homepage: header is present
    expect(screen.getByRole('banner')).toBeDefined();
    expect(screen.getByTestId('brand-logo')).toBeDefined();
    expect(screen.getByTestId('page-home')).toBeDefined();

    // Navigate to /tours
    currentPath = '/tours';
    rerender(<NavHost route="/tours" />);

    // Header remains mounted
    expect(screen.getByRole('banner')).toBeDefined();
    expect(screen.getByTestId('brand-logo')).toBeDefined();
    expect(screen.getByTestId('page-tours')).toBeDefined();
    expect(screen.queryByTestId('page-home')).toBeNull();
  });

  it('keeps PublicNavigation visible even when route content is suspended in Suspense fallback', () => {
    currentPath = '/tours';

    function SuspendingComponent(): ReactNode {
      throw new Promise(() => {}); // never resolves to simulate pending network
    }

    render(
      <PersistentPublicLayout>
        <Suspense fallback={<div data-testid="tour-skeleton">Đang tải danh sách tour...</div>}>
          <SuspendingComponent />
        </Suspense>
      </PersistentPublicLayout>
    );

    // Header must remain visible and accessible
    expect(screen.getByRole('banner')).toBeDefined();
    expect(screen.getByTestId('brand-logo')).toBeDefined();

    // Skeleton is displayed in the content region
    expect(screen.getByTestId('tour-skeleton')).toBeDefined();
  });

  it('suppresses duplicate PublicNavigation if a child page renders it under PersistentPublicLayout', () => {
    currentPath = '/tours';

    function LegacyPageWithHeader() {
      return (
        <div>
          <PublicNavigation />
          <div data-testid="legacy-tours-content">Legacy Page Content</div>
        </div>
      );
    }

    render(
      <PersistentPublicLayout>
        <LegacyPageWithHeader />
      </PersistentPublicLayout>
    );

    // Only EXACTLY 1 header (banner role) must exist in the DOM
    const banners = screen.getAllByRole('banner');
    expect(banners).toHaveLength(1);
    expect(screen.getByTestId('legacy-tours-content')).toBeDefined();
  });

  it('updates the active tab link according to the current pathname', () => {
    currentPath = '/tours';

    render(
      <PersistentPublicLayout>
        <div>Content</div>
      </PersistentPublicLayout>
    );

    const toursLink = screen.getByRole('link', { name: /Tour du lịch|Local Tours/i });
    expect(toursLink.getAttribute('aria-current')).toBe('page');
  });

  it('suppresses PublicNavigation when navigating to /admin or /partner workspaces', () => {
    currentPath = '/admin/payouts';

    render(
      <PersistentPublicLayout>
        <div data-testid="admin-content">Admin Payouts Console</div>
      </PersistentPublicLayout>
    );

    expect(screen.queryByRole('banner')).toBeNull();
    expect(screen.getByTestId('admin-content')).toBeDefined();
  });
});
