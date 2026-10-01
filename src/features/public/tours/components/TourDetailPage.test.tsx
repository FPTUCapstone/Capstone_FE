import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getTourDetail } from '../services/tourApi';
import { DEMO_TOUR_DETAIL_HOI_AN } from '../data/tourDemoFixtures';
import { TourDetailPage } from './TourDetailPage';
import { TourApiError } from '../types/tour';

const push = vi.fn();
let currentSearch = '';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(currentSearch),
}));

vi.mock('@/components/navigation/PublicNavigation', () => ({
  PublicNavigation: () => <div data-testid="public-navigation" />,
}));

vi.mock('@/features/auth/session/useWebSession', () => ({
  useWebSession: () => ({ status: 'unauthenticated', context: null }),
}));

vi.mock('../services/tourApi', () => ({
  getTourDetail: vi.fn(),
}));

describe('TourDetailPage', () => {
  beforeEach(() => {
    push.mockClear();
    currentSearch = '';
    vi.mocked(getTourDetail).mockReset();
  });

  it('renders pending BE integration state in production mode when BE endpoint does not exist', async () => {
    vi.mocked(getTourDetail).mockRejectedValue(
      new TourApiError(
        'Chi tiết tour đang chờ hoàn tất kết nối API từ máy chủ (UC-26 — PENDING_BE_INTEGRATION).',
        501,
      ),
    );

    render(<TourDetailPage id="9007199254740995" />);

    await waitFor(() => {
      expect(
        screen.getByText(/Chi Tiết Tour Đang Chờ Kết Nối Backend/i),
      ).toBeTruthy();
      expect(screen.getByText(/PENDING_BE_INTEGRATION/i)).toBeTruthy();
    });

    const backButton = screen.getByRole('button', { name: /Quay lại danh sách tour/i });
    fireEvent.click(backButton);
    expect(push).toHaveBeenCalledWith('/tours');
  });

  it('preserves search context parameters when clicking back to results from pending state', async () => {
    currentSearch = 'destination=Hoi+An&minPrice=500000';
    vi.mocked(getTourDetail).mockRejectedValue(
      new TourApiError('Pending BE', 501),
    );

    render(<TourDetailPage id="9007199254740995" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Quay lại danh sách tour/i })).toBeTruthy();
    });

    const backButton = screen.getByRole('button', { name: /Quay lại danh sách tour/i });
    fireEvent.click(backButton);
    expect(push).toHaveBeenCalledWith('/tours?destination=Hoi+An&minPrice=500000');
  });

  it('renders full tour detail view when demo mode is explicitly enabled (?demo=1)', async () => {
    currentSearch = 'demo=1';
    vi.mocked(getTourDetail).mockResolvedValue(DEMO_TOUR_DETAIL_HOI_AN);

    render(<TourDetailPage id="9007199254740995" />);

    await waitFor(() => {
      expect(screen.getAllByText(DEMO_TOUR_DETAIL_HOI_AN.title).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/CHẾ ĐỘ MÔ PHỎNG \(DEMO ONLY\)/i)).toBeTruthy();
      expect(screen.getByText('Giới Thiệu Chuyến Đi')).toBeTruthy();
      expect(screen.getByText('Lịch Trình Chi Tiết')).toBeTruthy();
      expect(screen.getByText('Dịch Vụ Bao Gồm & Không Bao Gồm')).toBeTruthy();
      expect(screen.getByText('Chính Sách Hoàn Hủy Tour')).toBeTruthy();
      expect(screen.getByText('Đánh Giá Từ Du Khách')).toBeTruthy();
      expect(screen.getByText(/Đăng nhập để đặt tour/i)).toBeTruthy();
    });
  });

  it('allows selecting departure schedules and updates slot info', async () => {
    currentSearch = 'demo=1';
    vi.mocked(getTourDetail).mockResolvedValue(DEMO_TOUR_DETAIL_HOI_AN);

    render(<TourDetailPage id="9007199254740995" />);

    await waitFor(() => {
      expect(screen.getByText('Còn 11 chỗ')).toBeTruthy();
    });

    // Sold out button should be disabled
    const soldOutScheduleBtn = screen.getByRole('button', { name: /Hết chỗ/i });
    expect(soldOutScheduleBtn.hasAttribute('disabled')).toBe(true);
  });
});
