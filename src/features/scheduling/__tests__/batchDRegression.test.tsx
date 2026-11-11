import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ViewSuggestedItineraryPage } from '../components/ViewSuggestedItineraryPage';
import { MyItinerariesPage } from '../components/MyItinerariesPage';
import * as schedulingApi from '../services/schedulingApi';
import type { ItineraryDetailDto } from '../types/schedulingTypes';
import type { ItinerarySummaryDto } from '../services/schedulingApi';

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
  PublicNavigation: () => <nav data-testid="public-navigation" />,
}));

vi.mock('@/lib/mapboxToken', () => ({
  getMapboxPublicToken: () => 'pk.mockMapboxToken',
}));

vi.mock('../components/maps/LazyMaps', () => ({
  LazyItineraryMap: ({ highlightedItemId }: { highlightedItemId: number | null }) => (
    <div data-testid="lazy-itinerary-map" data-highlighted-id={highlightedItemId ?? 'none'}>
      Mapbox Map
    </div>
  ),
}));

describe('Batch D Regression Coverage', () => {
  const travelerSession = {
    status: 'authenticated',
    context: {
      userId: 1,
      email: 'traveler@tripmate.vn',
      fullName: 'Nguyen Van A',
      role: 'Traveler',
      status: 'Active',
      accessToken: 'traveler-token',
    },
  };

  beforeEach(() => {
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    vi.clearAllMocks();
    mockUseWebSession.mockReturnValue(travelerSession);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('D2: Journey Workspace — Day Navigation & Timeline Highlight', () => {
    const multiDayItinerary: ItineraryDetailDto = {
      schedulingRequestId: 1001,
      itineraryId: 789,
      title: 'Hành trình di sản 2 ngày 1 đêm',
      version: 2,
      status: 'Active',
      validFrom: '2026-10-25T08:00:00+07:00',
      validTo: '2026-10-26T18:00:00+07:00',
      canManage: true,
      totalEstimatedCost: 500000,
      totalDurationMinutes: 720,
      items: [
        {
          itemId: 101,
          sequenceNo: 1,
          poiId: 1,
          poiName: 'Bảo tàng Chăm',
          category: 'Văn hóa',
          kind: 'Visit',
          latitude: 16.0601,
          longitude: 108.2229,
          plannedArrival: '2026-10-25T08:30:00+07:00',
          plannedDeparture: '2026-10-25T10:00:00+07:00',
          travelDurationFromPreviousMinutes: null,
          stayDurationMinutes: 90,
          estimatedCost: 60000,
          isMandatory: true,
          recommendationReason: 'Di sản phong phú',
          isUnavailable: false,
        },
        {
          itemId: 102,
          sequenceNo: 2,
          poiId: 2,
          poiName: 'Cầu Rồng',
          category: 'Cảnh quan',
          kind: 'Visit',
          latitude: 16.0611,
          longitude: 108.2272,
          plannedArrival: '2026-10-25T10:30:00+07:00',
          plannedDeparture: '2026-10-25T11:30:00+07:00',
          travelDurationFromPreviousMinutes: 15,
          stayDurationMinutes: 60,
          estimatedCost: 0,
          isMandatory: false,
          recommendationReason: 'Biểu tượng Đà Nẵng',
          isUnavailable: false,
        },
        {
          itemId: 201,
          sequenceNo: 3,
          poiId: 3,
          poiName: 'Phố cổ Hội An',
          category: 'Di sản',
          kind: 'Visit',
          latitude: 15.8778,
          longitude: 108.3262,
          plannedArrival: '2026-10-26T09:00:00+07:00',
          plannedDeparture: '2026-10-26T12:00:00+07:00',
          travelDurationFromPreviousMinutes: 45,
          stayDurationMinutes: 180,
          estimatedCost: 150000,
          isMandatory: true,
          recommendationReason: 'Di sản UNESCO',
          isUnavailable: false,
        },
      ],
    };

    it('renders Day Navigation tabs when itinerary spans multiple days', async () => {
      vi.spyOn(schedulingApi, 'getItineraryById').mockResolvedValueOnce(multiDayItinerary);

      render(<ViewSuggestedItineraryPage itineraryId="789" />);

      await waitFor(() => {
        expect(screen.getByText('Hành trình di sản 2 ngày 1 đêm')).toBeDefined();
      });

      // Assert Journey Header metadata
      expect(screen.getAllByText(/789/).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/v2/)).toBeDefined();
      expect(screen.getByText('Active')).toBeDefined();

      // Assert Day Navigation container and day tabs
      expect(screen.getByText(/Lộ trình theo ngày/i)).toBeDefined();
      const day1Btn = screen.getByRole('button', { name: /Ngày 1/i });
      const day2Btn = screen.getByRole('button', { name: /Ngày 2/i });
      expect(day1Btn).toBeDefined();
      expect(day2Btn).toBeDefined();

      // Verify scrollIntoView invocation on tab click
      const scrollSpy = vi.spyOn(window.HTMLElement.prototype, 'scrollIntoView');
      fireEvent.click(day2Btn);
      expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    });

    it('synchronizes hovered timeline item with map highlight state', async () => {
      vi.spyOn(schedulingApi, 'getItineraryById').mockResolvedValueOnce(multiDayItinerary);

      render(<ViewSuggestedItineraryPage itineraryId="789" />);

      await waitFor(() => {
        expect(screen.getByText('Bảo tàng Chăm')).toBeDefined();
      });

      const mapContainer = screen.getByTestId('lazy-itinerary-map');
      expect(mapContainer.getAttribute('data-highlighted-id')).toBe('none');

      // Mouse enter item 101
      const itemEl = screen.getByText('Bảo tàng Chăm').closest('[data-item-id="101"]');
      expect(itemEl).not.toBeNull();
      if (itemEl) {
        fireEvent.mouseEnter(itemEl);
        expect(mapContainer.getAttribute('data-highlighted-id')).toBe('101');

        fireEvent.mouseLeave(itemEl);
        expect(mapContainer.getAttribute('data-highlighted-id')).toBe('none');
      }
    });
  });

  describe('D3: My Trip Library — Card Presentation & Status Tags', () => {
    const sampleTrips: ItinerarySummaryDto[] = [
      {
        itineraryId: 501,
        schedulingRequestId: 201,
        title: 'Chuyến đi đang diễn ra',
        version: 1,
        status: 'Active',
        validFrom: '2026-10-25T08:00:00+07:00',
        validTo: '2026-10-25T18:00:00+07:00',
        canManage: true,
        stopCount: 4,
        openNavigationSessionId: 88,
      },
      {
        itineraryId: 502,
        schedulingRequestId: 202,
        title: 'Chuyến đi đã chấp nhận',
        version: 3,
        status: 'Accepted',
        validFrom: '2026-10-20T09:00:00+07:00',
        validTo: '2026-10-20T17:00:00+07:00',
        canManage: true,
        stopCount: 3,
        openNavigationSessionId: null,
      },
      {
        itineraryId: 503,
        schedulingRequestId: 203,
        title: 'Kế hoạch bản nháp',
        version: 1,
        status: 'Draft',
        validFrom: null,
        validTo: null,
        canManage: true,
        stopCount: 2,
        openNavigationSessionId: null,
      },
      {
        itineraryId: 504,
        schedulingRequestId: 204,
        title: 'Lịch trình đã hết hạn',
        version: 1,
        status: 'Expired',
        validFrom: '2026-10-01T08:00:00+07:00',
        validTo: '2026-10-01T17:00:00+07:00',
        canManage: true,
        stopCount: 2,
        openNavigationSessionId: null,
      },
    ];

    it('renders trip cards with accurate version badges, status labels, and direct link', async () => {
      vi.spyOn(schedulingApi, 'listMyItineraries').mockResolvedValueOnce({
        items: sampleTrips,
        page: 1,
        pageSize: 20,
        totalCount: 4,
      });

      render(<MyItinerariesPage />);

      await waitFor(() => {
        expect(screen.getByText('Chuyến đi đang diễn ra')).toBeDefined();
      });

      // Version badges
      expect(screen.getAllByText('v1')).toHaveLength(3);
      expect(screen.getByText('v3')).toBeDefined();

      // Status badges matching backend status contract
      expect(screen.getByText('Active')).toBeDefined();
      expect(screen.getByText('Accepted')).toBeDefined();
      expect(screen.getByText('Draft')).toBeDefined();
      expect(screen.getByText('Expired')).toBeDefined();

      // Navigation session indicator
      expect(screen.getByText('Đang diễn ra trên app')).toBeDefined();

      // Direct links to itinerary workspace
      const detailLinks = screen.getAllByRole('link', { name: /Xem lịch trình chi tiết/i });
      expect(detailLinks).toHaveLength(4);
      expect(detailLinks[0].getAttribute('href')).toBe('/itinerary/501');
      expect(detailLinks[1].getAttribute('href')).toBe('/itinerary/502');
    });
  });
});
