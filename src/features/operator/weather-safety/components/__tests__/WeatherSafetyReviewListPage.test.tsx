import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor, fireEvent } from '@testing-library/react';
import { WeatherSafetyReviewListPage } from '../WeatherSafetyReviewListPage';
import * as api from '../../weatherSafetyApi';
import type { WeatherSafetyReview } from '../../types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const realtime = vi.hoisted(() => ({ onRefreshHint: undefined as undefined | (() => void) }));

vi.mock('../../realtime/useWeatherSafetyRealtime', () => ({
  useWeatherSafetyRealtime: (options: { onRefreshHint?: () => void }) => {
    realtime.onRefreshHint = options.onRefreshHint;
    return { isConnected: false, connectionState: 'Disconnected' };
  },
}));

const mockReviews: WeatherSafetyReview[] = [
  {
    id: 1,
    tourScheduleId: 101,
    tourId: 201,
    tourTitle: 'Bà Nà Hills Tour',
    scheduleStartAtUtc: '2026-11-03T01:00:00Z',
    scheduleEndAtUtc: '2026-11-03T09:00:00Z',
    scheduleStatus: 'Scheduled',
    provider: 'Tomorrow.io',
    providerEventId: 'evt-01',
    eventType: 'SevereTropicalStorm',
    severity: 'Severe',
    description: 'Bão mạnh đổ bộ',
    validFromUtc: '2026-11-03T00:00:00Z',
    validToUtc: '2026-11-03T12:00:00Z',
    originalAuthority: 'NCHMF',
    officialVietnamRiskLevel: 3,
    verifiedDirective: 'TravelProhibition',
    affectedAreaSummary: 'Đà Nẵng',
    isWithdrawn: false,
    status: 'PendingAcknowledgement',
    urgentNoticeSentAtUtc: '2026-11-02T12:00:00Z',
    acknowledgementDeadlineUtc: '2026-11-02T14:00:00Z',
    acknowledgedAtUtc: null,
    acknowledgedByOperatorId: null,
    escalatedAtUtc: null,
    escalationContact: null,
    immediateInstructions: null,
    createdAtUtc: '2026-11-02T12:00:00Z',
  },
];

describe('WeatherSafetyReviewListPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially, then shows list', async () => {
    vi.spyOn(api, 'listWeatherSafetyReviews').mockResolvedValueOnce(mockReviews);

    render(<WeatherSafetyReviewListPage />);
    expect(screen.getByText(/Đang tải danh sách cảnh báo/i)).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('Bà Nà Hills Tour')).toBeDefined();
    });
  });

  it('keeps the loaded list when a background refresh fails', async () => {
    const listSpy = vi
      .spyOn(api, 'listWeatherSafetyReviews')
      .mockResolvedValueOnce(mockReviews)
      .mockRejectedValueOnce(new Error('Network down'));

    render(<WeatherSafetyReviewListPage />);
    await waitFor(() => {
      expect(screen.getByText('Bà Nà Hills Tour')).toBeDefined();
    });

    await act(async () => {
      realtime.onRefreshHint?.();
    });

    await waitFor(() => expect(listSpy).toHaveBeenCalledTimes(2));
    expect(screen.queryByText(/Network down/)).toBeNull();
    expect(screen.getByText('Bà Nà Hills Tour')).toBeDefined();
  });

  it('renders empty state when there are no reviews', async () => {
    vi.spyOn(api, 'listWeatherSafetyReviews').mockResolvedValueOnce([]);

    render(<WeatherSafetyReviewListPage />);

    await waitFor(() => {
      expect(screen.getByText(/Hiện không có cảnh báo thời tiết nào/i)).toBeDefined();
    });
  });

  it('keeps the filter tabs when the selected tab has no reviews', async () => {
    const listSpy = vi
      .spyOn(api, 'listWeatherSafetyReviews')
      .mockResolvedValueOnce(mockReviews)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(mockReviews);

    render(<WeatherSafetyReviewListPage />);
    await waitFor(() => expect(screen.getByText('Bà Nà Hills Tour')).toBeDefined());

    fireEvent.click(screen.getByRole('button', { name: 'Đã đóng' }));

    await waitFor(() => {
      expect(screen.getByText(/Không có cảnh báo thời tiết nào trong mục này/i)).toBeDefined();
    });
    expect(screen.queryByText(/Hiện không có cảnh báo thời tiết nào/i)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Tất cả' }));

    await waitFor(() => expect(screen.getByText('Bà Nà Hills Tour')).toBeDefined());
    expect(listSpy).toHaveBeenCalledTimes(3);
  });

  it('renders error state and provides retry button on fetch failure', async () => {
    vi.spyOn(api, 'listWeatherSafetyReviews').mockRejectedValueOnce(
      new api.WeatherSafetyApiError('Network failure', 0, 'NETWORK_ERROR')
    );

    render(<WeatherSafetyReviewListPage />);

    await waitFor(() => {
      expect(screen.getByText(/Không thể tải danh sách cảnh báo/i)).toBeDefined();
    });

    vi.spyOn(api, 'listWeatherSafetyReviews').mockResolvedValueOnce(mockReviews);
    const retryButton = screen.getByRole('button', { name: /Thử lại/i });
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Bà Nà Hills Tour')).toBeDefined();
    });
  });
});
