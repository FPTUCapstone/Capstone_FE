import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getTourRecommendations, searchTours } from '../services/tourApi';
import { ExploreToursPage } from './ExploreToursPage';
import type { PagedToursResponseDto } from '../types/tour';
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

vi.mock('../services/tourApi', () => ({
  searchTours: vi.fn(),
  getTourRecommendations: vi.fn(),
}));

const mockToursResponse: PagedToursResponseDto = {
  page: 1,
  pageSize: 20,
  totalCount: 2,
  totalPages: 1,
  asOfUtc: '2026-10-01T00:00:00Z',
  items: [
    {
      tourId: '9007199254740995',
      title: 'Hành Trình Di Sản Phố Cổ Hội An',
      destinations: ['Đà Nẵng', 'Hội An'],
      operatorName: 'Endpoint Travel',
      durationDays: 2,
      basePrice: 800000,
      currency: 'VND',
      representativeScheduleId: '9007199254740997',
      departureAtUtc: '2026-10-15T07:30:00Z',
      availabilityStatus: 'Available',
      remainingSlots: 11,
      thumbnailUrl: null,
    },
    {
      tourId: '9007199254740996',
      title: 'Bà Nà Hills & Cầu Vàng 1 Ngày',
      destinations: ['Đà Nẵng'],
      operatorName: 'Sơn Trà Eco',
      durationDays: 1,
      basePrice: 1250000,
      currency: 'VND',
      representativeScheduleId: null,
      departureAtUtc: '2026-10-18T08:00:00Z',
      availabilityStatus: 'Available',
      remainingSlots: 5,
      thumbnailUrl: null,
    },
  ],
};

describe('ExploreToursPage', () => {
  beforeEach(() => {
    push.mockClear();
    currentSearch = '';
    vi.mocked(searchTours).mockReset();
    vi.mocked(getTourRecommendations).mockReset();

    vi.mocked(searchTours).mockResolvedValue(mockToursResponse);
    vi.mocked(getTourRecommendations).mockResolvedValue({
      items: [],
      isPendingBe: true,
      isDemo: false,
    });
  });

  it('renders page layout, navigation, filters, and results', async () => {
    render(<ExploreToursPage />);

    expect(screen.getByTestId('public-navigation')).toBeTruthy();
    expect(screen.getByText(/Tour Trải Nghiệm/)).toBeTruthy();
    expect(screen.getByLabelText('Bộ lọc tìm kiếm tour')).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText('Hành Trình Di Sản Phố Cổ Hội An')).toBeTruthy();
      expect(screen.getByText('Bà Nà Hills & Cầu Vàng 1 Ngày')).toBeTruthy();
    });
  });

  it('submits search filters and calls router.push with valid URL parameters', async () => {
    render(<ExploreToursPage />);
    await screen.findByText('Hành Trình Di Sản Phố Cổ Hội An');

    const destInput = screen.getByLabelText('Điểm đến / Khu vực');
    fireEvent.change(destInput, { target: { value: 'Huế' } });

    const submitBtn = screen.getByRole('button', { name: /Tìm kiếm tour/i });
    fireEvent.click(submitBtn);

    expect(push).toHaveBeenCalledWith('/tours?destination=Hu%E1%BA%BF');
  });

  it('validates price range and displays error when minPrice > maxPrice (BR-53, MSG29)', async () => {
    render(<ExploreToursPage />);
    await screen.findByText('Hành Trình Di Sản Phố Cổ Hội An');

    const minInput = screen.getByLabelText(/Giá tối thiểu/i);
    const maxInput = screen.getByLabelText(/Giá tối đa/i);

    fireEvent.change(minInput, { target: { value: '2000000' } });
    fireEvent.change(maxInput, { target: { value: '1000000' } });

    const submitBtn = screen.getByRole('button', { name: /Tìm kiếm tour/i });
    fireEvent.click(submitBtn);

    expect(
      screen.getByText(/Giá tối thiểu không được lớn hơn giá tối đa/i),
    ).toBeTruthy();
    expect(push).not.toHaveBeenCalled();
  });

  it('renders empty state (MSG64) when search returns no tours', async () => {
    vi.mocked(searchTours).mockResolvedValue({
      page: 1,
      pageSize: 20,
      totalCount: 0,
      totalPages: 0,
      asOfUtc: '2026-10-01T00:00:00Z',
      items: [],
    });

    render(<ExploreToursPage />);

    await waitFor(() => {
      expect(screen.getByText('Không tìm thấy tour phù hợp')).toBeTruthy();
      expect(screen.getByText(/MSG64/)).toBeTruthy();
    });
  });

  it('renders error state (MSG127) when API fails', async () => {
    vi.mocked(searchTours).mockRejectedValue(
      new TourApiError('Lỗi kết nối máy chủ tour.', 500),
    );

    render(<ExploreToursPage />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy();
      expect(screen.getByText('Lỗi kết nối máy chủ tour.')).toBeTruthy();
    });
  });

  it('enforces NO PHANTOM API rule on UC-25 recommendations: displays pending status, no fake production data', async () => {
    render(<ExploreToursPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/Tính Năng Gợi Ý AI Đang Được Kết Nối/i),
      ).toBeTruthy();
      expect(screen.getByText('PENDING_BE_INTEGRATION')).toBeTruthy();
    });
  });

  it('displays explicit DEMO_ONLY banner and demo recommendations only when ?demo=1', async () => {
    currentSearch = 'demo=1';
    vi.mocked(getTourRecommendations).mockResolvedValue({
      items: [
        {
          tour: mockToursResponse.items[0],
          matchingScore: 92,
          matchingReasons: ['Phù hợp với sở thích Văn hóa'],
        },
      ],
      isPendingBe: false,
      isDemo: true,
    });

    render(<ExploreToursPage />);

    await waitFor(() => {
      expect(screen.getByText(/CHẾ ĐỘ MÔ PHỎNG \(DEMO ONLY\)/i)).toBeTruthy();
      expect(screen.getByText(/Match 92%/)).toBeTruthy();
    });
  });

  it('resets filters when clicking quick destination or clear button', async () => {
    currentSearch = 'destination=Hoi+An';
    render(<ExploreToursPage />);

    const clearBtn = await screen.findByRole('button', { name: /Xóa bộ lọc/i });
    fireEvent.click(clearBtn);

    expect(push).toHaveBeenCalledWith('/tours');
  });
});
