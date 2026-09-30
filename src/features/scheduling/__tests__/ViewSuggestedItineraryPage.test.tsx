import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ViewSuggestedItineraryPage } from '../components/ViewSuggestedItineraryPage';
import * as schedulingApi from '../services/schedulingApi';

vi.mock('@/components/navigation/PublicNavigation', () => ({
  PublicNavigation: () => <nav data-testid="public-navigation">Public Navigation</nav>,
}));

describe('ViewSuggestedItineraryPage (UC-11)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  const mockItinerary = {
    schedulingRequestId: 55,
    itineraryId: 789,
    title: 'Lịch trình khám phá Đà Nẵng (8 giờ)',
    status: 'OptimalGenerated',
    totalEstimatedCost: 250000,
    totalDurationMinutes: 480,
    items: [
      {
        sequenceNo: 1,
        poiId: 101,
        poiName: 'Bảo tàng Điêu khắc Chăm',
        itemKind: 'Visit' as const,
        plannedArrival: '2026-10-20T08:00:00+07:00',
        plannedDeparture: '2026-10-20T09:00:00+07:00',
        stayDurationMinutes: 60,
        travelDurationToNextMinutes: 15,
        estimatedCost: 60000,
        isMandatory: false,
        recommendationReason: 'Di sản phong phú',
      },
    ],
  };

  it('renders loading state initially and then renders full itinerary details', async () => {
    vi.spyOn(schedulingApi, 'getItineraryById').mockResolvedValueOnce(mockItinerary);

    render(<ViewSuggestedItineraryPage itineraryId="789" />);

    expect(screen.getByText(/Đang tải kế hoạch lịch trình gợi ý/i)).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('Lịch trình khám phá Đà Nẵng (8 giờ)')).toBeDefined();
    });

    expect(screen.getByTestId('public-navigation')).toBeDefined();
    expect(screen.getByText('Lịch trình #789')).toBeDefined();
    expect(screen.getAllByText(/Thuật toán CSP/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Bảo tàng Điêu khắc Chăm')).toBeDefined();
    expect(screen.getByText('250.000 đ')).toBeDefined();
  });

  it('triggers link copy action', async () => {
    vi.spyOn(schedulingApi, 'getItineraryById').mockResolvedValueOnce(mockItinerary);

    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(<ViewSuggestedItineraryPage itineraryId="789" />);

    await waitFor(() => {
      expect(screen.getByText('Lịch trình khám phá Đà Nẵng (8 giờ)')).toBeDefined();
    });

    const shareBtn = screen.getByRole('button', { name: /Chia sẻ/i });
    fireEvent.click(shareBtn);

    expect(writeTextMock).toHaveBeenCalled();
  });

  it('renders explicit unavailable state (Pending Backend Integration) when itinerary cannot be loaded', async () => {
    vi.spyOn(schedulingApi, 'getItineraryById').mockRejectedValueOnce(
      new Error('Không tìm thấy lịch trình #99999. Năng lực truy xuất lịch trình từ máy chủ đang chờ tích hợp Backend (Pending Backend Integration).'),
    );

    render(<ViewSuggestedItineraryPage itineraryId="99999" />);

    await waitFor(() => {
      expect(screen.getByText('Không tìm thấy lịch trình hoặc dữ liệu chưa sẵn sàng')).toBeDefined();
      expect(screen.getByText(/Không tìm thấy lịch trình #99999/i)).toBeDefined();
      expect(screen.getByText(/Trạng thái tích hợp: PENDING_BE_INTEGRATION/i)).toBeDefined();
    });

    expect(screen.getByRole('link', { name: /Tạo lịch trình mới/i })).toBeDefined();
    expect(screen.getByRole('link', { name: /Về trang chủ/i })).toBeDefined();
  });

  it('renders visible DEMO_ONLY warning banner when itinerary has DEMO_FIXTURE status', async () => {
    const demoItinerary = {
      ...mockItinerary,
      status: 'DEMO_FIXTURE',
      title: '[DEMO_ONLY] Lịch trình khám phá Đà Nẵng',
    };
    vi.spyOn(schedulingApi, 'getItineraryById').mockResolvedValueOnce(demoItinerary);

    render(<ViewSuggestedItineraryPage itineraryId="demo" />);

    await waitFor(() => {
      expect(screen.getByText('[DEMO_ONLY] Lịch trình khám phá Đà Nẵng')).toBeDefined();
    });

    expect(screen.getByText(/Bản mẫu thử nghiệm \(DEMO_ONLY Fixture\)/i)).toBeDefined();
    expect(screen.getByText(/Lịch trình này là bản mẫu phục vụ kiểm thử giao diện/i)).toBeDefined();
  });
});
