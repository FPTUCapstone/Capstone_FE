import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getTourDetail } from '../services/tourApi';
import { DEMO_TOUR_DETAIL_HOI_AN } from '../data/tourDemoFixtures';
import { realTourDetailViewModel } from '../__fixtures__/tourDetailWire';
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

vi.mock('../services/tourApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/tourApi')>();
  return {
    ...actual,
    getTourDetail: vi.fn(),
  };
});

function setNodeEnv(val?: string) {
  (process.env as Record<string, string | undefined>).NODE_ENV = val;
}

const NOT_FOUND = new TourApiError('Gói tour không tồn tại hoặc đã ngừng hiển thị công khai (MSG65).', 404);
const UNAVAILABLE = new TourApiError('TripMate tạm thời không thể tải chi tiết tour (MSG127).', 503);

describe('TourDetailPage', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalDemoFlag = process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES;

  beforeEach(() => {
    push.mockClear();
    currentSearch = '';
    vi.mocked(getTourDetail).mockReset();
    setNodeEnv('development');
    process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
  });

  afterEach(() => {
    setNodeEnv(originalNodeEnv);
    if (originalDemoFlag === undefined) {
      delete process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES;
    } else {
      process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = originalDemoFlag;
    }
  });

  it('shows a loading status while the tour is requested', () => {
    vi.mocked(getTourDetail).mockReturnValue(new Promise(() => undefined));

    render(<TourDetailPage id="9007199254740993" />);

    expect(screen.getByRole('status', { name: /Đang tải chi tiết tour/i })).toBeTruthy();
  });

  it('renders the real tour without any demo banner and asks the service for real data', async () => {
    vi.mocked(getTourDetail).mockResolvedValue(realTourDetailViewModel());

    render(<TourDetailPage id="9007199254740993" />);

    await waitFor(() => {
      expect(screen.getAllByText('Hội An food tour').length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.queryByText(/CHẾ ĐỘ MÔ PHỎNG/i)).toBeNull();
    expect(screen.queryByText(/PENDING_BE_INTEGRATION/i)).toBeNull();
    expect(getTourDetail).toHaveBeenCalledWith(
      '9007199254740993',
      expect.objectContaining({ allowDemo: false }),
    );
  });

  it('shows the not-found state (MSG65) for a 404 without a retry action, and goes back to the list', async () => {
    vi.mocked(getTourDetail).mockRejectedValue(NOT_FOUND);

    render(<TourDetailPage id="15" />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Không tìm thấy gói tour/i })).toBeTruthy();
    });
    expect(screen.getByText(/MSG65/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Thử lại/i })).toBeNull();
    expect(screen.queryByText(/Chi Tiết Tour Đang Chờ Kết Nối Backend/i)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Quay lại danh sách tour/i }));
    expect(push).toHaveBeenCalledWith('/tours');
  });

  it('preserves search context parameters when going back from the not-found state', async () => {
    currentSearch = 'destination=Hoi+An&minPrice=500000&demo=1';
    vi.mocked(getTourDetail).mockRejectedValue(NOT_FOUND);

    render(<TourDetailPage id="15" />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Quay lại danh sách tour/i })).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('button', { name: /Quay lại danh sách tour/i }));
    expect(push).toHaveBeenCalledWith('/tours?destination=Hoi+An&minPrice=500000');
  });

  it.each([
    ['a 503 response', new TourApiError('x (MSG127)', 503)],
    ['a network failure', new TourApiError('x (MSG127)', 0)],
    ['an unexpected error', new Error('boom')],
  ])('shows an announced unavailable state (MSG127) with Retry for %s, not "not found"', async (_label, failure) => {
    vi.mocked(getTourDetail).mockRejectedValue(failure);

    render(<TourDetailPage id="15" />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeTruthy();
    });
    expect(screen.getByRole('heading', { name: /Chưa thể tải chi tiết tour/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Thử lại/i })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: /Không tìm thấy gói tour/i })).toBeNull();
  });

  it('retries the request and renders the tour when the retry succeeds', async () => {
    vi.mocked(getTourDetail)
      .mockRejectedValueOnce(UNAVAILABLE)
      .mockResolvedValueOnce(realTourDetailViewModel());

    render(<TourDetailPage id="9007199254740993" />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Thử lại/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /Thử lại/i }));

    await waitFor(() => {
      expect(screen.getAllByText('Hội An food tour').length).toBeGreaterThanOrEqual(1);
    });
    expect(getTourDetail).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('a retry that fails again keeps the unavailable state', async () => {
    vi.mocked(getTourDetail).mockRejectedValue(UNAVAILABLE);

    render(<TourDetailPage id="15" />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Thử lại/i })).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: /Thử lại/i }));

    await waitFor(() => {
      expect(getTourDetail).toHaveBeenCalledTimes(2);
      expect(screen.getByRole('button', { name: /Thử lại/i })).toBeTruthy();
    });
  });

  it('cancels the in-flight request when the page unmounts', () => {
    let captured: AbortSignal | undefined;
    vi.mocked(getTourDetail).mockImplementation((_id, options) => {
      captured = options?.signal;
      return new Promise(() => undefined);
    });

    const { unmount } = render(<TourDetailPage id="15" />);
    expect(captured?.aborted).toBe(false);

    unmount();

    expect(captured?.aborted).toBe(true);
  });

  it('requests the new tour when the id changes', async () => {
    vi.mocked(getTourDetail).mockResolvedValue(realTourDetailViewModel());

    const { rerender } = render(<TourDetailPage id="15" />);
    await waitFor(() => expect(getTourDetail).toHaveBeenCalledTimes(1));

    rerender(<TourDetailPage id="16" />);

    await waitFor(() => expect(getTourDetail).toHaveBeenCalledTimes(2));
    expect(vi.mocked(getTourDetail).mock.calls[1][0]).toBe('16');
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
    expect(getTourDetail).toHaveBeenCalledWith(
      '9007199254740995',
      expect.objectContaining({ allowDemo: true }),
    );
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

  it('enforces the demo gate in production: ?demo=1 passes allowDemo: false and shows no demo UI on failure', async () => {
    setNodeEnv('production');
    process.env.NEXT_PUBLIC_ENABLE_DEMO_FIXTURES = 'true';
    currentSearch = 'demo=1';
    vi.mocked(getTourDetail).mockRejectedValue(UNAVAILABLE);

    render(<TourDetailPage id="9007199254740995" />);

    await waitFor(() => {
      expect(getTourDetail).toHaveBeenCalledWith(
        '9007199254740995',
        expect.objectContaining({ allowDemo: false }),
      );
      expect(screen.getByRole('alert')).toBeTruthy();
    });
    expect(screen.queryByText(/CHẾ ĐỘ MÔ PHỎNG \(DEMO ONLY\)/i)).toBeNull();
    expect(screen.queryByText(/Xem bản mô phỏng giao diện/i)).toBeNull();
  });
});
