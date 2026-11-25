import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { PartnerHeader } from '../PartnerHeader';
import * as useNotificationInboxModule from '@/features/notifications/useNotificationInbox';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock('@/features/notifications/useNotificationInbox');
vi.mock('@/features/auth/session/useWebSession', () => ({
  useWebSession: () => ({ status: 'authenticated', context: { role: 'TourOperator', userId: 1 } }),
}));

function mockInbox(overrides?: Partial<ReturnType<typeof useNotificationInboxModule.useNotificationInbox>>) {
  vi.mocked(useNotificationInboxModule.useNotificationInbox).mockReturnValue({
    items: [],
    unreadCount: 0,
    unreadOnly: false,
    setUnreadOnly: vi.fn(),
    error: null,
    loading: false,
    loadMore: undefined,
    refresh: vi.fn(),
    markRead: vi.fn(),
    ...overrides,
  });
}

describe('PartnerHeader', () => {
  beforeEach(() => {
    mockInbox();
  });

  it('renders breadcrumb indicating current active tab', () => {
    render(<PartnerHeader activeTab="tours" />);

    expect(screen.getByText('Quản lý đối tác')).toBeDefined();
    expect(screen.getByText('Gói tour')).toBeDefined();
  });

  it('renders custom breadcrumbs when supplied', () => {
    render(
      <PartnerHeader
        activeTab="tours"
        breadcrumbs={[
          { label: 'Gói tour', href: '/partner/tours' },
          { label: 'Tạo tour mới' },
        ]}
      />
    );

    expect(screen.getByText('Tạo tour mới')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Gói tour' })).toBeDefined();
  });

  it('toggles mobile menu on button click and provides accessible labels', () => {
    const handleToggle = vi.fn();
    render(<PartnerHeader activeTab="dashboard" mobileOpen={false} onToggleMobileMenu={handleToggle} />);

    const menuButton = screen.getByRole('button', { name: 'Mở menu quản lý' });
    expect(menuButton.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(menuButton);
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it('renders demo badge when isDemo is true', () => {
    render(<PartnerHeader activeTab="dashboard" isDemo={true} />);

    expect(screen.getByText(/Chế độ thử nghiệm/i)).toBeDefined();
  });

  it('renders operator name when supplied', () => {
    render(<PartnerHeader activeTab="dashboard" operatorName="Han River Travel Co." />);

    expect(screen.getByText('Han River Travel Co.')).toBeDefined();
  });

  it('renders the notification bell with an unread badge', () => {
    mockInbox({
      unreadCount: 2,
      items: [
        {
          id: 1,
          type: 'TourApproved',
          title: 'Tour approved',
          body: 'Your tour package was approved.',
          relatedEntityType: 'Tour',
          relatedEntityId: 196,
          createdAtUtc: '2026-11-24T03:55:57.729Z',
          isRead: false,
        },
      ],
    });

    render(<PartnerHeader activeTab="dashboard" />);

    expect(screen.getByRole('button', { name: /thông báo/i })).toBeDefined();
    expect(screen.getByTestId('notification-badge').textContent).toBe('2');
  });

  it('calls markRead when a notification item is clicked', () => {
    const markRead = vi.fn();
    mockInbox({
      unreadCount: 1,
      markRead,
      items: [
        {
          id: 1,
          type: 'TourApproved',
          title: 'Tour approved',
          body: 'Your tour package was approved.',
          relatedEntityType: 'Tour',
          relatedEntityId: 196,
          createdAtUtc: '2026-11-24T03:55:57.729Z',
          isRead: false,
        },
      ],
    });

    render(<PartnerHeader activeTab="dashboard" />);

    fireEvent.click(screen.getByRole('button', { name: /thông báo/i }));
    fireEvent.click(screen.getByText('Tour approved'));

    expect(markRead).toHaveBeenCalledWith(1);
  });
});
