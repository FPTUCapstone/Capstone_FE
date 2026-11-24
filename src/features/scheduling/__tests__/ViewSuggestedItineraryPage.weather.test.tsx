import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ViewSuggestedItineraryPage } from '../components/ViewSuggestedItineraryPage';
import * as schedulingApi from '../services/schedulingApi';
import type { ItineraryDetailDto, WeatherTipsDto } from '../types/schedulingTypes';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
}));

const mockUseWebSession = vi.fn();

vi.mock('@/features/auth/session/useWebSession', () => ({
  useWebSession: () => mockUseWebSession(),
}));

vi.mock('@/components/navigation/PublicNavigation', () => ({
  PublicNavigation: () => <nav data-testid="public-navigation">Public Navigation</nav>,
}));

const TIPS: WeatherTipsDto = {
  date: '2026-10-20',
  timeZoneId: 'Asia/Ho_Chi_Minh',
  forecastAtUtc: '2026-10-19T03:00:00Z',
  summary: { minTempC: 24, maxTempC: 32, maxRainProbabilityPercent: 70, maxUvIndex: 9 },
  tips: [{ code: 'weather_tip.rain', severity: 'Info', text: 'Mang ô hoặc áo mưa' }],
};

function detail(itineraryId: number): ItineraryDetailDto {
  return {
    schedulingRequestId: 55,
    itineraryId,
    title: 'Lịch trình khám phá Đà Nẵng',
    version: 1,
    status: 'Draft',
    validFrom: '2026-10-20T08:00:00+07:00',
    validTo: '2026-10-20T17:00:00+07:00',
    canManage: true,
    totalEstimatedCost: 250000,
    totalDurationMinutes: 480,
    bookedServices: [
      {
        id: 1,
        serviceId: 2,
        poiId: null,
        serviceName: 'Thuê xe máy',
        serviceOption: null,
        status: 'Confirmed',
        startAtUtc: '2026-10-20T01:00:00Z',
        endAtUtc: null,
        quantity: 1,
        estimatedAmount: 150000,
        actualAmount: null,
      },
    ],
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
}

describe('ViewSuggestedItineraryPage weather tips (UC-10)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseWebSession.mockReturnValue({
      status: 'authenticated',
      context: { userId: 1, role: 'Traveler', accessToken: 'mock-token' },
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the weather card between the summary cards and the booked services', async () => {
    vi.spyOn(schedulingApi, 'getItineraryById').mockResolvedValue(detail(801));
    vi.spyOn(schedulingApi, 'getItineraryWeatherTips').mockResolvedValue(TIPS);

    render(<ViewSuggestedItineraryPage itineraryId="801" />);

    const card = await screen.findByRole('region', { name: 'Gợi ý theo thời tiết' });
    expect(screen.getByText('Thời tiết ngày 20/10')).toBeTruthy();
    expect(screen.getByText('Mang ô hoặc áo mưa')).toBeTruthy();
    const summary = screen.getByText('Tổng thời lượng');
    const booked = screen.getByText('Dịch vụ đã xác nhận');
    expect(summary.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(card.compareDocumentPosition(booked) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('shows no card and no error when the weather request returns null', async () => {
    vi.spyOn(schedulingApi, 'getItineraryById').mockResolvedValue(detail(802));
    const weather = vi.spyOn(schedulingApi, 'getItineraryWeatherTips').mockResolvedValue(null);

    render(<ViewSuggestedItineraryPage itineraryId="802" />);

    await screen.findByText('Tổng thời lượng');
    await waitFor(() => expect(weather).toHaveBeenCalled());
    expect(screen.queryByRole('region', { name: 'Gợi ý theo thời tiết' })).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('shows the itinerary normally and no card when the weather request rejects', async () => {
    vi.spyOn(schedulingApi, 'getItineraryById').mockResolvedValue(detail(803));
    const weather = vi.spyOn(schedulingApi, 'getItineraryWeatherTips').mockRejectedValue(new Error('boom'));

    render(<ViewSuggestedItineraryPage itineraryId="803" />);

    await screen.findByText('Tổng thời lượng');
    await waitFor(() => expect(weather).toHaveBeenCalled());
    expect(screen.queryByRole('region', { name: 'Gợi ý theo thời tiết' })).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByText('Dịch vụ đã xác nhận')).toBeTruthy();
  });

  it('shows the itinerary while the weather request never settles', async () => {
    vi.spyOn(schedulingApi, 'getItineraryById').mockResolvedValue(detail(804));
    vi.spyOn(schedulingApi, 'getItineraryWeatherTips').mockReturnValue(new Promise(() => {}));

    render(<ViewSuggestedItineraryPage itineraryId="804" />);

    expect(await screen.findByText('Tổng thời lượng')).toBeTruthy();
    expect(screen.queryByRole('region', { name: 'Gợi ý theo thời tiết' })).toBeNull();
  });

  it('requests weather once, for the itinerary id', async () => {
    vi.spyOn(schedulingApi, 'getItineraryById').mockResolvedValue(detail(805));
    const weather = vi.spyOn(schedulingApi, 'getItineraryWeatherTips').mockResolvedValue(TIPS);

    render(<ViewSuggestedItineraryPage itineraryId="805" />);
    await screen.findByRole('region', { name: 'Gợi ý theo thời tiết' });

    expect(weather).toHaveBeenCalledTimes(1);
    expect(weather).toHaveBeenCalledWith(805, expect.anything());
  });

  it('does not request weather before the itinerary has loaded', async () => {
    let finish!: (value: ItineraryDetailDto) => void;
    vi.spyOn(schedulingApi, 'getItineraryById').mockReturnValue(
      new Promise<ItineraryDetailDto>((resolve) => {
        finish = resolve;
      }),
    );
    const weather = vi.spyOn(schedulingApi, 'getItineraryWeatherTips').mockResolvedValue(TIPS);

    render(<ViewSuggestedItineraryPage itineraryId="806" />);
    await Promise.resolve();
    expect(weather).not.toHaveBeenCalled();

    finish(detail(806));
    await screen.findByRole('region', { name: 'Gợi ý theo thời tiết' });
    expect(weather).toHaveBeenCalledTimes(1);
  });
});