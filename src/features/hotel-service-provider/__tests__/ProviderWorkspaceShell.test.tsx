import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ProviderWorkspaceShell } from '../components/ProviderWorkspaceShell';
import { ServiceBookingRequestsView } from '../components/w103/ServiceBookingRequestsView';
import { ProviderBookingService } from '../services/providerBookingService';
import { formatRemainingSla } from '../utils/formatters';
import { testBooking } from './testBooking';

const navMock = vi.hoisted(() => ({
  pathname: '/provider/bookings',
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => navMock.pathname,
  useRouter: () => ({ replace: navMock.replace, refresh: navMock.refresh }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('../services/providerBookingService', () => ({
  ProviderBookingService: { fetchBookingRequests: vi.fn() },
}));

vi.mock('@/features/notifications/WorkspaceNotificationBell', () => ({
  WebSessionNotificationBell: ({ role }: { role: string }) => (
    <button type="button" aria-label={`Notifications for ${role}`}>
      Bell
    </button>
  ),
}));

vi.mock('@/lib/authApi', () => ({
  webLogout: vi.fn().mockResolvedValue(undefined),
}));

describe('ProviderWorkspaceShell & unified locale consistency', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    navMock.pathname = '/provider/bookings';
    vi.mocked(ProviderBookingService.fetchBookingRequests).mockResolvedValue({
      items: [testBooking],
      totalCount: 1,
      page: 1,
      pageSize: 20,
    });
  });

  it('renders authenticated user identity, all 3 nav links, notification bell, and switches VI/EN cleanly', async () => {
    render(
      <ProviderWorkspaceShell userName="Nguyen Van Minh" userEmail="minh@hoianhotel.vn">
        <ServiceBookingRequestsView />
      </ProviderWorkspaceShell>
    );

    await screen.findAllByText('SR-9');

    // Displays real authenticated user info, not hardcoded mocks
    expect(screen.getAllByText('Nguyen Van Minh').length).toBeGreaterThan(0);
    expect(screen.getByText('minh@hoianhotel.vn')).toBeDefined();
    expect(screen.queryByText('Trần Thị Lan')).toBeNull();

    // All 3 workspace routes and real notification bell present
    expect(screen.getByRole('link', { name: /Yêu cầu đặt dịch vụ/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /Lịch dịch vụ/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /Bảng kê hoa hồng/i })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Notifications for ServiceProvider' })).toBeDefined();

    // Default inside workspace shell is 100% Vietnamese (headings + StatusBadge + nav)
    expect(screen.getByRole('heading', { name: 'Yêu cầu đặt dịch vụ' })).toBeDefined();
    expect(screen.getAllByText('Chờ xác nhận').length).toBeGreaterThan(0);
    expect(screen.queryByText('Pending Confirmation')).toBeNull();

    // Switching to EN switches navigation, page copy, and StatusBadge together
    fireEvent.click(screen.getByRole('button', { name: 'EN' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Service Booking Requests' })).toBeDefined();
      expect(screen.getByRole('link', { name: /Service Availability/i })).toBeDefined();
      expect(screen.getAllByText('Pending Confirmation').length).toBeGreaterThan(0);
      expect(screen.queryByText('Chờ xác nhận')).toBeNull();
    });
  });

  it('filters immediately when clicking a quick status tab', async () => {
    render(
      <ProviderWorkspaceShell>
        <ServiceBookingRequestsView />
      </ProviderWorkspaceShell>
    );

    await screen.findAllByText('SR-9');
    fireEvent.click(screen.getByRole('tab', { name: 'Đã xác nhận' }));

    await waitFor(() => {
      expect(ProviderBookingService.fetchBookingRequests).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'Confirmed', page: 1 })
      );
    });
  });
});

describe('formatRemainingSla', () => {
  it('formats hours, days, minutes, and expired deadlines in vi and en', () => {
    const base = Date.parse('2026-11-25T10:00:00Z');
    expect(formatRemainingSla('2026-11-25T15:30:00Z', base, 'vi')).toEqual({
      text: 'Còn 5g 30p',
      isUrgent: true,
      isExpired: false,
    });
    expect(formatRemainingSla('2026-11-25T15:30:00Z', base, 'en')).toEqual({
      text: '5h 30m left',
      isUrgent: true,
      isExpired: false,
    });
    expect(formatRemainingSla('2026-11-27T13:00:00Z', base, 'vi')?.isUrgent).toBe(false);
    expect(formatRemainingSla('2026-11-25T09:00:00Z', base, 'vi')).toEqual({
      text: 'Đã hết hạn phản hồi',
      isUrgent: true,
      isExpired: true,
    });
    expect(formatRemainingSla(undefined, base, 'vi')).toBeNull();
  });
});
