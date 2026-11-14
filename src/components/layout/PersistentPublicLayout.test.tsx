import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { PersistentPublicLayout } from './PersistentPublicLayout';

let mockPathname = '/';

vi.mock('@/features/traveler/support-chat/SupportChat', () => ({
  SupportChat: () => <aside aria-label="Support chat entry point" />,
}));

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock('@/components/navigation/PublicNavigation', () => ({
  PublicNavigation: () => <header data-testid="persistent-public-navigation">Public Navigation</header>,
  PersistentHeaderContext: {
    Provider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    Consumer: ({ children }: { children: (val: boolean) => ReactNode }) => children(true),
  },
}));

describe('PersistentPublicLayout', () => {
  beforeEach(() => {
    mockPathname = '/';
  });

  it.each(['/account/trips', '/partner/bookings', '/partner'])('mounts the shared support entry point on %s', (pathname) => {
    mockPathname = pathname;
    render(<PersistentPublicLayout><div>Content</div></PersistentPublicLayout>);
    expect(screen.getByLabelText('Support chat entry point')).toBeDefined();
  });

  it.each(['/sign-in', '/admin', '/admin/users'])('keeps support entry point off %s', (pathname) => {
    mockPathname = pathname;
    render(<PersistentPublicLayout><div>Content</div></PersistentPublicLayout>);
    expect(screen.queryByLabelText('Support chat entry point')).toBeNull();
  });

  it('renders persistent PublicNavigation on root homepage', () => {
    mockPathname = '/';
    render(
      <PersistentPublicLayout>
        <div data-testid="page-content">Home Content</div>
      </PersistentPublicLayout>
    );

    expect(screen.getByTestId('persistent-public-navigation')).toBeDefined();
    expect(screen.getByTestId('page-content')).toBeDefined();
  });

  it('renders persistent PublicNavigation on /tours exploration route', () => {
    mockPathname = '/tours';
    render(
      <PersistentPublicLayout>
        <div data-testid="tours-content">Tours Content</div>
      </PersistentPublicLayout>
    );

    expect(screen.getByTestId('persistent-public-navigation')).toBeDefined();
    expect(screen.getByTestId('tours-content')).toBeDefined();
  });

  it('renders persistent PublicNavigation on /pois exploration route', () => {
    mockPathname = '/pois';
    render(
      <PersistentPublicLayout>
        <div data-testid="pois-content">POIs Content</div>
      </PersistentPublicLayout>
    );

    expect(screen.getByTestId('persistent-public-navigation')).toBeDefined();
    expect(screen.getByTestId('pois-content')).toBeDefined();
  });

  it('renders persistent PublicNavigation on /plan smart itinerary route', () => {
    mockPathname = '/plan';
    render(
      <PersistentPublicLayout>
        <div data-testid="plan-content">Plan Content</div>
      </PersistentPublicLayout>
    );

    expect(screen.getByTestId('persistent-public-navigation')).toBeDefined();
    expect(screen.getByTestId('plan-content')).toBeDefined();
  });

  it('does NOT render PublicNavigation on /admin console workspace routes', () => {
    mockPathname = '/admin/users';
    render(
      <PersistentPublicLayout>
        <div data-testid="admin-content">Admin Users</div>
      </PersistentPublicLayout>
    );

    expect(screen.queryByTestId('persistent-public-navigation')).toBeNull();
    expect(screen.getByTestId('admin-content')).toBeDefined();
  });

  it('does NOT render PublicNavigation on /partner workspace routes', () => {
    mockPathname = '/partner/tours';
    render(
      <PersistentPublicLayout>
        <div data-testid="partner-content">Partner Tours</div>
      </PersistentPublicLayout>
    );

    expect(screen.queryByTestId('persistent-public-navigation')).toBeNull();
    expect(screen.getByTestId('partner-content')).toBeDefined();
  });

  it('does NOT render PublicNavigation on standalone auth routes (/sign-in, /register)', () => {
    mockPathname = '/sign-in';
    render(
      <PersistentPublicLayout>
        <div data-testid="sign-in-content">Sign In</div>
      </PersistentPublicLayout>
    );

    expect(screen.queryByTestId('persistent-public-navigation')).toBeNull();
    expect(screen.getByTestId('sign-in-content')).toBeDefined();
  });
});
