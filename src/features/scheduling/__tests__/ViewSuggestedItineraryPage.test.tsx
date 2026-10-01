import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ViewSuggestedItineraryPage } from '../components/ViewSuggestedItineraryPage';
import * as schedulingApi from '../services/schedulingApi';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mocks.push,
    replace: mocks.replace,
  }),
}));

const mockUseWebSession = vi.fn();

vi.mock('@/features/auth/session/useWebSession', () => ({
  useWebSession: () => mockUseWebSession(),
}));

vi.mock('@/components/navigation/PublicNavigation', () => ({
  PublicNavigation: () => <nav data-testid="public-navigation">Public Navigation</nav>,
}));

describe('ViewSuggestedItineraryPage (UC-11)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWebSession.mockReturnValue({
      status: 'authenticated',
      context: {
        userId: 1,
        email: 'traveler@tripmate.vn',
        fullName: 'Nguyen Van A',
        role: 'Traveler',
        status: 'Active',
        accessToken: 'mock-token',
      },
    });
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

  describe('AUTH: session & role guards', () => {
    it('AUTH-1: redirects unauthenticated caller to sign in with returnUrl', () => {
      mockUseWebSession.mockReturnValue({
        status: 'unauthenticated',
        context: null,
      });

      render(<ViewSuggestedItineraryPage itineraryId="789" />);

      expect(mocks.replace).toHaveBeenCalledWith('/sign-in?returnUrl=%2Fitinerary%2F789');
    });

    it('AUTH-2: renders restoring indicator when session is restoring', () => {
      mockUseWebSession.mockReturnValue({
        status: 'restoring',
        context: null,
      });

      render(<ViewSuggestedItineraryPage itineraryId="789" />);

      expect(screen.getByText('Đang tải kế hoạch du lịch…')).toBeDefined();
    });

    it('AUTH-3: redirects TourOperator to partner dashboard', () => {
      mockUseWebSession.mockReturnValue({
        status: 'authenticated',
        context: {
          userId: 2,
          role: 'TourOperator',
        },
      });

      render(<ViewSuggestedItineraryPage itineraryId="789" />);

      expect(mocks.replace).toHaveBeenCalledWith('/partner');
    });

    it('AUTH-4: redirects Administrator to admin dashboard', () => {
      mockUseWebSession.mockReturnValue({
        status: 'authenticated',
        context: {
          userId: 3,
          role: 'Administrator',
        },
      });

      render(<ViewSuggestedItineraryPage itineraryId="789" />);

      expect(mocks.replace).toHaveBeenCalledWith('/admin');
    });

    it('AUTH-5: allows authenticated Traveler and passes context.userId to getItineraryById', async () => {
      const getSpy = vi.spyOn(schedulingApi, 'getItineraryById').mockResolvedValueOnce(mockItinerary);

      render(<ViewSuggestedItineraryPage itineraryId="789" />);

      await waitFor(() => {
        expect(screen.getByText('Lịch trình khám phá Đà Nẵng (8 giờ)')).toBeDefined();
      });

      expect(getSpy).toHaveBeenCalledWith('789', { currentUserId: 1 });
    });
  });

  describe('TRUTH: truthful rendering & actions', () => {
    it('TRUTH-1: does NOT render misleading "Chia sẻ" / Copy Link button', async () => {
      vi.spyOn(schedulingApi, 'getItineraryById').mockResolvedValueOnce(mockItinerary);

      render(<ViewSuggestedItineraryPage itineraryId="789" />);

      await waitFor(() => {
        expect(screen.getByText('Lịch trình khám phá Đà Nẵng (8 giờ)')).toBeDefined();
      });

      expect(screen.queryByRole('button', { name: /Chia sẻ/i })).toBeNull();
      expect(screen.queryByText(/Đã sao chép link/i)).toBeNull();
    });

    it('TRUTH-2: renders Print button and handles print action', async () => {
      vi.spyOn(schedulingApi, 'getItineraryById').mockResolvedValueOnce(mockItinerary);
      const printMock = vi.fn();
      window.print = printMock;

      render(<ViewSuggestedItineraryPage itineraryId="789" />);

      await waitFor(() => {
        expect(screen.getByText('Lịch trình khám phá Đà Nẵng (8 giờ)')).toBeDefined();
      });

      const printBtn = screen.getByRole('button', { name: /In lịch trình/i });
      fireEvent.click(printBtn);
      expect(printMock).toHaveBeenCalledTimes(1);
    });

    it('TRUTH-3: renders truthful sequential stops diagram without fake coordinates or radius', async () => {
      vi.spyOn(schedulingApi, 'getItineraryById').mockResolvedValueOnce(mockItinerary);

      render(<ViewSuggestedItineraryPage itineraryId="789" />);

      await waitFor(() => {
        expect(screen.getByText('Sơ đồ thứ tự điểm dừng')).toBeDefined();
      });

      expect(screen.getByText(/Thông tin bản đồ và tuyến đường chi tiết đang chờ dữ liệu tích hợp/i)).toBeDefined();
      expect(screen.queryByText(/16\.0544/i)).toBeNull();
      expect(screen.queryByText(/Bán kính hoạt động: 10 km/i)).toBeNull();
      expect(screen.queryByText(/Lộ trình khép kín/i)).toBeNull();
    });

    it('TRUTH-4: renders neutral subtitle in Stat 4 card', async () => {
      vi.spyOn(schedulingApi, 'getItineraryById').mockResolvedValueOnce(mockItinerary);

      render(<ViewSuggestedItineraryPage itineraryId="789" />);

      await waitFor(() => {
        expect(screen.getByText('Đã tạo lịch trình')).toBeDefined();
      });

      expect(screen.queryByText('Khớp sở thích cá nhân')).toBeNull();
    });

    it('TIME-1: formats departure time in travel tips under Asia/Ho_Chi_Minh', async () => {
      vi.spyOn(schedulingApi, 'getItineraryById').mockResolvedValueOnce(mockItinerary);

      render(<ViewSuggestedItineraryPage itineraryId="789" />);

      await waitFor(() => {
        expect(screen.getByText(/Nên xuất phát đúng giờ dự kiến \(08:00\)/i)).toBeDefined();
      });
    });
  });

  describe('API & DEMO: errors and demo fixtures', () => {
    it('API-1: renders explicit unavailable state (Pending Backend Integration) when itinerary cannot be loaded', async () => {
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

    it('DEMO-1: renders visible DEMO_ONLY warning banner when itinerary has DEMO_FIXTURE status', async () => {
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
});
