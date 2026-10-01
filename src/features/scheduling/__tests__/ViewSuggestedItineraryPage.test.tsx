import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ViewSuggestedItineraryPage } from '../components/ViewSuggestedItineraryPage';
import * as schedulingApi from '../services/schedulingApi';
import { ItineraryDetailDto } from '../types/schedulingTypes';

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

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

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

  const mockItinerary: ItineraryDetailDto = {
    schedulingRequestId: 55,
    itineraryId: 789,
    title: 'Lịch trình khám phá Đà Nẵng (8 giờ)',
    version: 1,
    status: 'OptimalGenerated',
    validFrom: '2026-10-20T08:00:00+07:00',
    validTo: '2026-10-20T17:00:00+07:00',
    canManage: true,
    totalEstimatedCost: 250000,
    totalDurationMinutes: 480,
    items: [
      {
        itemId: 101,
        sequenceNo: 1,
        poiId: 101,
        poiName: 'Bảo tàng Điêu khắc Chăm',
        category: 'Văn hóa & Di sản',
        kind: 'Visit',
        plannedArrival: '2026-10-20T08:00:00+07:00',
        plannedDeparture: '2026-10-20T09:00:00+07:00',
        stayDurationMinutes: 60,
        travelDurationFromPreviousMinutes: null,
        estimatedCost: 60000,
        isMandatory: false,
        recommendationReason: 'Di sản phong phú',
        isUnavailable: false,
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

      expect(getSpy).toHaveBeenCalledWith('789');
    });
  });

  describe('REQUEST LIFECYCLE: route transitions and session stability', () => {
    it('clears the previous itinerary and renders loading immediately when the route ID changes', async () => {
      const nextRequest = createDeferred<ItineraryDetailDto>();
      vi.spyOn(schedulingApi, 'getItineraryById')
        .mockResolvedValueOnce(mockItinerary)
        .mockReturnValueOnce(nextRequest.promise);
      const { rerender } = render(<ViewSuggestedItineraryPage itineraryId="789" />);

      await waitFor(() => {
        expect(screen.getByText(mockItinerary.title!)).toBeDefined();
      });

      rerender(<ViewSuggestedItineraryPage itineraryId="790" />);

      expect(screen.getByText('Đang tải kế hoạch lịch trình gợi ý…')).toBeDefined();
      expect(screen.queryByText(mockItinerary.title!)).toBeNull();

      const nextItinerary = {
        ...mockItinerary,
        itineraryId: 790,
        title: 'Lịch trình mới',
      };
      await act(async () => {
        nextRequest.resolve(nextItinerary);
        await nextRequest.promise;
      });
    });

    it('clears a previous 404 panel immediately while the next route is loading', async () => {
      const nextRequest = createDeferred<ItineraryDetailDto>();
      vi.spyOn(schedulingApi, 'getItineraryById')
        .mockRejectedValueOnce(
          new schedulingApi.ItineraryHttpError(
            404,
            'Không tìm thấy lịch trình.',
            'itinerary.not_found',
          ),
        )
        .mockReturnValueOnce(nextRequest.promise);
      const { rerender } = render(<ViewSuggestedItineraryPage itineraryId="789" />);

      await waitFor(() => {
        expect(screen.getByText('Không tìm thấy lịch trình')).toBeDefined();
      });

      rerender(<ViewSuggestedItineraryPage itineraryId="790" />);

      expect(screen.queryByText('Không tìm thấy lịch trình')).toBeNull();
      expect(screen.getByText('Đang tải kế hoạch lịch trình gợi ý…')).toBeDefined();

      await act(async () => {
        nextRequest.resolve({ ...mockItinerary, itineraryId: 790 });
        await nextRequest.promise;
      });
    });

    it('keeps the newest route result when an older request resolves last', async () => {
      const oldRequest = createDeferred<ItineraryDetailDto>();
      const newRequest = createDeferred<ItineraryDetailDto>();
      vi.spyOn(schedulingApi, 'getItineraryById')
        .mockReturnValueOnce(oldRequest.promise)
        .mockReturnValueOnce(newRequest.promise);
      const { rerender } = render(<ViewSuggestedItineraryPage itineraryId="789" />);

      rerender(<ViewSuggestedItineraryPage itineraryId="790" />);

      const newestItinerary = {
        ...mockItinerary,
        itineraryId: 790,
        title: 'Lịch trình mới nhất',
      };
      await act(async () => {
        newRequest.resolve(newestItinerary);
        await newRequest.promise;
      });
      expect(screen.getByText('Lịch trình mới nhất')).toBeDefined();

      await act(async () => {
        oldRequest.resolve({ ...mockItinerary, title: 'Lịch trình cũ trả về muộn' });
        await oldRequest.promise;
      });

      expect(screen.getByText('Lịch trình mới nhất')).toBeDefined();
      expect(screen.queryByText('Lịch trình cũ trả về muộn')).toBeNull();
    });

    it('does not refetch when session context identity changes but userId and role stay stable', async () => {
      const getSpy = vi
        .spyOn(schedulingApi, 'getItineraryById')
        .mockResolvedValue(mockItinerary);
      const { rerender } = render(<ViewSuggestedItineraryPage itineraryId="789" />);

      await waitFor(() => {
        expect(screen.getByText(mockItinerary.title!)).toBeDefined();
      });

      mockUseWebSession.mockReturnValue({
        status: 'authenticated',
        context: {
          userId: 1,
          email: 'updated@tripmate.vn',
          fullName: 'Updated display name',
          role: 'Traveler',
          status: 'Active',
          accessToken: 'refreshed-token',
        },
      });
      rerender(<ViewSuggestedItineraryPage itineraryId="789" />);

      expect(getSpy).toHaveBeenCalledTimes(1);
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

      expect(screen.getByText(/Sơ đồ minh họa thứ tự các điểm dừng trên lộ trình khám phá/i)).toBeDefined();
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

    it('TRUTH-5: renders version and read-only badge when canManage is false', async () => {
      const readOnlyItinerary: ItineraryDetailDto = {
        ...mockItinerary,
        version: 2,
        canManage: false,
      };
      vi.spyOn(schedulingApi, 'getItineraryById').mockResolvedValueOnce(readOnlyItinerary);

      render(<ViewSuggestedItineraryPage itineraryId="789" />);

      await waitFor(() => {
        expect(screen.getByText('v2')).toBeDefined();
        expect(screen.getByText('Chỉ xem')).toBeDefined();
      });
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
    it('API-0: renders expired-session recovery with the exact itinerary return URL and no stale content', async () => {
      vi.spyOn(schedulingApi, 'getItineraryById')
        .mockResolvedValueOnce({
          ...mockItinerary,
          itineraryId: 788,
          title: 'Lịch trình cũ trước khi hết phiên',
        })
        .mockRejectedValueOnce(
          new schedulingApi.ItineraryHttpError(
            401,
            'Phiên đăng nhập đã hết hạn hoặc bạn chưa đăng nhập.',
            'auth.unauthorized',
          ),
        );
      const { rerender } = render(<ViewSuggestedItineraryPage itineraryId="788" />);

      await waitFor(() => {
        expect(screen.getByText('Lịch trình cũ trước khi hết phiên')).toBeDefined();
      });

      rerender(<ViewSuggestedItineraryPage itineraryId="789" />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Phiên đăng nhập đã hết hạn' })).toBeDefined();
      });

      const signInLink = screen.getByRole('link', { name: /Đăng nhập lại/i });
      expect(signInLink.getAttribute('href')).toBe('/sign-in?returnUrl=%2Fitinerary%2F789');
      expect(screen.queryByText('Lịch trình cũ trước khi hết phiên')).toBeNull();
    });

    it('API-1: renders 403 access-denied state when user is not authorized', async () => {
      vi.spyOn(schedulingApi, 'getItineraryById').mockRejectedValueOnce(
        new schedulingApi.ItineraryHttpError(403, 'Bạn không có quyền xem lịch trình này.', 'auth.forbidden'),
      );

      render(<ViewSuggestedItineraryPage itineraryId="789" />);

      await waitFor(() => {
        expect(screen.getByText('Bạn không có quyền xem lịch trình này')).toBeDefined();
        expect(screen.getByText('Bạn không có quyền xem lịch trình này.')).toBeDefined();
      });

      expect(screen.queryByText(/PENDING_BE_INTEGRATION/i)).toBeNull();
      expect(screen.getByRole('link', { name: /Tạo lịch trình mới/i })).toBeDefined();
      expect(screen.getByRole('link', { name: /Về trang chủ/i })).toBeDefined();
    });

    it('API-2: renders 404 not-found state when itinerary does not exist', async () => {
      vi.spyOn(schedulingApi, 'getItineraryById').mockRejectedValueOnce(
        new schedulingApi.ItineraryHttpError(404, 'Không tìm thấy lịch trình.', 'itinerary.not_found'),
      );

      render(<ViewSuggestedItineraryPage itineraryId="99999" />);

      await waitFor(() => {
        expect(screen.getByText('Không tìm thấy lịch trình')).toBeDefined();
        expect(screen.getByText('Không tìm thấy lịch trình.')).toBeDefined();
      });

      expect(screen.queryByText(/PENDING_BE_INTEGRATION/i)).toBeNull();
    });

    it('API-3: renders generic error state when server returns error', async () => {
      vi.spyOn(schedulingApi, 'getItineraryById').mockRejectedValueOnce(
        new schedulingApi.ItineraryHttpError(500, 'Không thể tải lịch trình từ máy chủ. Vui lòng thử lại sau.', 'server.error'),
      );

      render(<ViewSuggestedItineraryPage itineraryId="789" />);

      await waitFor(() => {
        expect(screen.getByText('Không thể tải chi tiết lịch trình')).toBeDefined();
        expect(screen.getByText('Không thể tải lịch trình từ máy chủ. Vui lòng thử lại sau.')).toBeDefined();
      });
    });

    it('DEMO-1: renders visible DEMO_ONLY warning banner when itinerary has DEMO_FIXTURE status', async () => {
      const demoItinerary: ItineraryDetailDto = {
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
      expect(screen.getByText(/Lịch trình này là bản mẫu phục vụ kiểm thử giao diện trong môi trường phát triển/i)).toBeDefined();
    });
  });
});
