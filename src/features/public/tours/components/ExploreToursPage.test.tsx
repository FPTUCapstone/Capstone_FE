import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getTourCategories, getTourRecommendations, refreshTourRecommendations, searchTours } from '../services/tourApi';
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

vi.mock('../services/tourApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/tourApi')>();
  return {
    ...actual,
    searchTours: vi.fn(),
    getTourCategories: vi.fn(),
    getTourRecommendations: vi.fn(),
    refreshTourRecommendations: vi.fn(),
  };
});

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

function setNodeEnv(val?: string) {
  (process.env as Record<string, string | undefined>).NODE_ENV = val;
}

describe('ExploreToursPage', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalDemoFlag = process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES;

  beforeEach(() => {
    localStorage.setItem('tripmate.uc24.locale', 'vi');
    push.mockClear();
    currentSearch = '';
    vi.mocked(searchTours).mockReset();
    vi.mocked(getTourCategories).mockReset();
    vi.mocked(getTourRecommendations).mockReset();
    vi.mocked(refreshTourRecommendations).mockReset();

    vi.mocked(searchTours).mockResolvedValue(mockToursResponse);
    vi.mocked(getTourCategories).mockResolvedValue([]);
    vi.mocked(getTourRecommendations).mockResolvedValue({
      page: 1,
      pageSize: 20,
      totalCount: 0,
      totalPages: 0,
      asOfUtc: '2026-10-01T00:00:00Z',
      criteria: { destination: null, startDate: null, endDate: null, minBudget: null, maxBudget: null },
      items: [],
      isDemo: false,
    });
    vi.mocked(refreshTourRecommendations).mockResolvedValue({
      page: 1, pageSize: 20, totalCount: 0, totalPages: 0,
      asOfUtc: '2026-10-01T00:00:00Z',
      criteria: { destination: null, startDate: null, endDate: null, minBudget: null, maxBudget: null },
      items: [], isDemo: false,
    });
  });

  afterEach(() => {
    localStorage.removeItem('tripmate.uc24.locale');
    setNodeEnv(originalNodeEnv);
    if (originalDemoFlag === undefined) {
      delete process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES;
    } else {
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = originalDemoFlag;
    }
  });

  it('renders page layout, navigation, filters, and results', async () => {
    render(<ExploreToursPage />);
    expect(await screen.findByText(/Tour Trải Nghiệm/)).toBeTruthy();
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

    const minInput = screen.getByLabelText('Giá tối thiểu');
    const maxInput = screen.getByLabelText('Giá tối đa');

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
      expect(screen.getByText('Không tìm thấy gói tour phù hợp với điểm đến và ngày của bạn.')).toBeTruthy();
    });
  });

  it('renders error state (MSG127) when API fails', async () => {
    vi.mocked(searchTours).mockRejectedValue(
      new TourApiError('Lỗi kết nối máy chủ tour.', 500),
    );

    render(<ExploreToursPage />);

    await waitFor(() => {
      expect(screen.getByText(/TripMate tạm thời không thể xử lý yêu cầu/)).toBeTruthy();
      expect(screen.queryByText('Lỗi kết nối máy chủ tour.')).toBeNull();
    });
  });

  it('persists English without dispatching a search or resetting the draft', async () => {
    render(<ExploreToursPage />);
    const input = await screen.findByLabelText('Từ khóa');
    fireEvent.change(input, { target: { value: 'Huế' } });
    const calls = vi.mocked(searchTours).mock.calls.length;
    fireEvent.change(screen.getByLabelText('Ngôn ngữ tìm kiếm'), { target: { value: 'en' } });
    expect((screen.getByLabelText('Keyword') as HTMLInputElement).value).toBe('Huế');
    expect(localStorage.getItem('tripmate.uc24.locale')).toBe('en');
    expect(searchTours).toHaveBeenCalledTimes(calls);
  });

  it('maps missing interest tags to MSG183 with Travel Preferences', async () => {
    vi.mocked(getTourRecommendations).mockRejectedValue(new TourApiError(
      'Interest tags required', 422,
      { errorCode: 'tour_recommendation.interest_tags_required' },
    ));
    const { container } = render(<ExploreToursPage />);
    await waitFor(() => {
      const alert = container.querySelector('[data-message-code="MSG183"]');
      expect(alert?.textContent).toContain('thẻ sở thích');
      expect(alert?.querySelector('a')?.getAttribute('href')).toBe('/account/preferences');
    });
  });

  it('renders the MSG64 empty recommendation state without fake production data', async () => {
    render(<ExploreToursPage />);

    await waitFor(() => {
      expect(
        screen.getByText(/Không tìm thấy tour phù hợp \(MSG64\)/i),
      ).toBeTruthy();
    });
  });

  it('keeps bilingual Search results when Recommendations refresh and change page', async () => {
    currentSearch = 'keyword=Hue&destination=Hu%E1%BA%BF&startDate=2026-12-10&minPrice=500000';
    const originalUrl = window.location.href;
    const recommendation = { tour: { ...mockToursResponse.items[0], title: 'Recommended tour' }, matchingScore: 92, matchingReasons: [] };
    const recommendationPage = {
      page: 1, pageSize: 20, totalCount: 21, totalPages: 2,
      asOfUtc: '2026-10-01T00:00:00Z', criteria: null,
      items: [recommendation], isDemo: false,
    };
    vi.mocked(refreshTourRecommendations).mockResolvedValue(recommendationPage);
    vi.mocked(getTourRecommendations).mockResolvedValueOnce(recommendationPage).mockResolvedValueOnce({
      ...recommendationPage, page: 2,
      items: [{ ...recommendation, tour: { ...recommendation.tour, title: 'Next recommended tour' } }],
    });

    try {
      const { rerender } = render(<ExploreToursPage />);
      const recommendations = within(screen.getByRole('region', { name: 'Gợi ý tour cá nhân hóa' }));
      await recommendations.findByText('Recommended tour');
      await screen.findByText('Hành Trình Di Sản Phố Cổ Hội An');
      expect(getTourRecommendations).toHaveBeenCalledWith(expect.objectContaining({
        allowDemo: false,
        initialCriteria: { destination: 'Huế', startDate: '2026-12-10', endDate: null, minBudget: 500000, maxBudget: null },
      }));

      const searches = vi.mocked(searchTours).mock.calls.length;
      fireEvent.change(screen.getByLabelText('Ngôn ngữ tìm kiếm'), { target: { value: 'en' } });
      expect((screen.getByLabelText('Keyword') as HTMLInputElement).value).toBe('Hue');
      expect(recommendations.getByText('Recommended tour')).toBeTruthy();
      expect(getTourRecommendations).toHaveBeenCalledTimes(1);

      fireEvent.click(recommendations.getByRole('button', { name: /Làm mới/ }));
      await waitFor(() => expect(refreshTourRecommendations).toHaveBeenCalledWith({
        destination: 'Huế', startDate: '2026-12-10', endDate: null, minBudget: 500000, maxBudget: null,
      }));
      await waitFor(() => expect((recommendations.getByRole('button', { name: 'Trang sau' }) as HTMLButtonElement).disabled).toBe(false));
      fireEvent.click(recommendations.getByRole('button', { name: 'Trang sau' }));
      await recommendations.findByText('Next recommended tour');
      expect(getTourRecommendations).toHaveBeenLastCalledWith({ page: 2, allowDemo: false });
      fireEvent.change(screen.getByLabelText('Keyword'), { target: { value: 'Unsubmitted draft' } });
      currentSearch += '&recommendationPage=2';
      rerender(<ExploreToursPage />);
      expect((screen.getByLabelText('Keyword') as HTMLInputElement).value).toBe('Unsubmitted draft');
      const detailLink = screen.getByRole('link', { name: 'Hành Trình Di Sản Phố Cổ Hội An' });
      expect(detailLink.getAttribute('href')).toContain('recommendationPage=2');
      expect(screen.getByText('Hành Trình Di Sản Phố Cổ Hội An')).toBeTruthy();
      expect(searchTours).toHaveBeenCalledTimes(searches);
    } finally {
      window.history.replaceState(null, '', originalUrl);
    }
  });


  describe('demo fixture environment lockdown (Blocker 2)', () => {
    it('DEMO-1: NODE_ENV=production + NEXT_PUBLIC_ENABLE_DEMO_FIXTURES=true + ?demo=1 -> NO fixture', async () => {
      setNodeEnv('production');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
      currentSearch = 'demo=1';

      render(<ExploreToursPage />);

      await waitFor(() => {
        expect(getTourRecommendations).toHaveBeenCalledWith(
          expect.objectContaining({ allowDemo: false }),
        );
        expect(screen.queryByText(/CHẾ ĐỘ MÔ PHỎNG \(DEMO ONLY\)/i)).toBeNull();
        expect(screen.queryByText(/CHẾ ĐỘ MÔ PHỎNG/)).toBeNull();
      });
    });

    it('DEMO-2: NODE_ENV=development + flag missing + ?demo=1 -> NO fixture', async () => {
      setNodeEnv('development');
      delete process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES;
      currentSearch = 'demo=1';

      render(<ExploreToursPage />);

      await waitFor(() => {
        expect(getTourRecommendations).toHaveBeenCalledWith(
          expect.objectContaining({ allowDemo: false }),
        );
        expect(screen.queryByText(/CHẾ ĐỘ MÔ PHỎNG \(DEMO ONLY\)/i)).toBeNull();
      });
    });

    it('DEMO-3: NODE_ENV=development + flag=false + ?demo=1 -> NO fixture', async () => {
      setNodeEnv('development');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'false';
      currentSearch = 'demo=1';

      render(<ExploreToursPage />);

      await waitFor(() => {
        expect(getTourRecommendations).toHaveBeenCalledWith(
          expect.objectContaining({ allowDemo: false }),
        );
        expect(screen.queryByText(/CHẾ ĐỘ MÔ PHỎNG \(DEMO ONLY\)/i)).toBeNull();
      });
    });

    it('DEMO-4: NODE_ENV=development + flag=true + ?demo=1 -> fixture allowed + visible DEMO ONLY state', async () => {
      setNodeEnv('development');
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
      currentSearch = 'demo=1';

      vi.mocked(getTourRecommendations).mockResolvedValue({
        page: 1,
        pageSize: 20,
        totalCount: 1,
        totalPages: 1,
        asOfUtc: '2026-10-01T00:00:00Z',
        criteria: null,
        items: [
          {
            tour: mockToursResponse.items[0],
            matchingScore: 92,
            matchingReasons: ['Phù hợp với sở thích Văn hóa'],
          },
        ],
        isDemo: true,
      });

      render(<ExploreToursPage />);

      await waitFor(() => {
        expect(getTourRecommendations).toHaveBeenCalledWith(
          expect.objectContaining({ allowDemo: true }),
        );
        expect(screen.getByText(/CHẾ ĐỘ MÔ PHỎNG \(DEMO ONLY\)/i)).toBeTruthy();
        expect(screen.getByText(/Match 92%/)).toBeTruthy();
      });
    });
  });

  it('resets filters when clicking quick destination or clear button', async () => {
    currentSearch = 'destination=Hoi+An';
    render(<ExploreToursPage />);

    const clearBtn = await screen.findByRole('button', { name: /Xóa bộ lọc/i });
    fireEvent.click(clearBtn);

    expect(push).toHaveBeenCalledWith('/tours');
  });

  it('clears an unsubmitted draft while preserving keyword when the URL is unchanged', async () => {
    currentSearch = 'keyword=bi%E1%BB%83n';
    render(<ExploreToursPage />);
    await screen.findByText('Hành Trình Di Sản Phố Cổ Hội An');

    const keyword = screen.getByLabelText('Từ khóa') as HTMLInputElement;
    const minPrice = screen.getByLabelText('Giá tối thiểu') as HTMLInputElement;
    const destination = screen.getByLabelText('Điểm đến / Khu vực') as HTMLInputElement;
    fireEvent.change(minPrice, { target: { value: '100000' } });
    fireEvent.change(destination, { target: { value: 'Huế' } });

    fireEvent.click(screen.getByRole('button', { name: /Xóa bộ lọc/i }));

    expect(keyword.value).toBe('biển');
    expect(minPrice.value).toBe('');
    expect(destination.value).toBe('');
    expect(push).not.toHaveBeenCalled();
  });
});
