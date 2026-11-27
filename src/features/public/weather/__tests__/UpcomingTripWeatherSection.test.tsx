import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UpcomingTripWeatherSection } from '../components/UpcomingTripWeatherSection';
import type { UpcomingTripWeatherDto } from '../types/weatherForecast';

function makeTrip(overrides: Partial<UpcomingTripWeatherDto> = {}): UpcomingTripWeatherDto {
  return {
    bookingId: 101,
    bookingCode: 'BK-0001',
    tourScheduleId: 1101,
    tourTitle: 'Tour Bà Nà',
    startAtUtc: '2026-11-27T23:30:00+00:00', // 06:30 on 28/11 in GMT+7
    endAtUtc: '2026-11-28T09:30:00+00:00',
    inProgress: false,
    point: {
      name: 'Khách sạn Đà Nẵng',
      latitude: 16.0544,
      longitude: 108.2022,
    },
    forecastDate: '2026-11-28',
    forecast: {
      date: '2026-11-28',
      minTempC: 21,
      maxTempC: 28,
      maxApparentTempC: 30,
      maxRainProbabilityPercent: 80,
      maxRainMmPerHour: 3.5,
      totalRainMm: 12,
      maxUvIndex: 6,
      maxWindSpeedMps: 9,
      thunderstorm: true,
      weatherCode: 8000,
      humidityAvgPercent: 85,
      sunriseTime: '05:56',
      sunsetTime: '17:18',
    },
    warning: null,
    ...overrides,
  };
}

describe('UpcomingTripWeatherSection', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders nothing when trips list is empty', () => {
    const { container } = render(
      <UpcomingTripWeatherSection
        trips={[]}
        activeCoordKey="16.05,108.2"
        onSelectLocation={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders warning banners with VN date, time range, status copy, booking link, and role="status" (not alert)', () => {
    const trips: UpcomingTripWeatherDto[] = [
      makeTrip({
        bookingId: 101,
        tourTitle: 'Tour Bà Nà',
        startAtUtc: '2026-11-27T23:30:00+00:00', // 28/11 VN
        warning: {
          reviewStatus: 'PendingAcknowledgement',
          eventType: 'Thunderstorm',
          severity: 'Severe',
          description: 'Dông lớn',
          validFromUtc: '2026-11-28T07:00:00+00:00', // 14:00 VN
          validToUtc: '2026-11-28T10:00:00+00:00', // 17:00 VN
          operatorInstructions: null,
        },
      }),
      makeTrip({
        bookingId: 102,
        tourTitle: 'Tour Hội An',
        startAtUtc: '2026-11-29T01:00:00+00:00', // 29/11 VN
        warning: {
          reviewStatus: 'Acknowledged',
          eventType: 'HeavyRain',
          severity: 'High',
          description: null,
          validFromUtc: null,
          validToUtc: null,
          operatorInstructions: 'Mang áo mưa, tập trung tại sảnh lúc 07:30.',
        },
      }),
      makeTrip({
        bookingId: 103,
        tourTitle: 'Tour Huế',
        startAtUtc: '2026-11-30T01:00:00+00:00', // 30/11 VN
        warning: {
          reviewStatus: 'Escalated',
          eventType: 'Wind',
          severity: 'Severe',
          description: 'Gió giật mạnh',
          validFromUtc: null,
          validToUtc: null,
          operatorInstructions: null,
        },
      }),
    ];

    render(
      <UpcomingTripWeatherSection
        trips={trips}
        activeCoordKey="16.05,108.2"
        onSelectLocation={vi.fn()}
      />,
    );

    expect(screen.queryByRole('alert')).toBeNull();
    const banners = screen.getAllByRole('status');
    expect(banners).toHaveLength(3);

    expect(banners[0].textContent).toContain('Tour Bà Nà (28/11): Dông lớn.');
    expect(banners[0].textContent).toContain('Nhà điều hành đang xem xét.');
    expect(banners[0].textContent).toContain('14:00–17:00');
    expect(banners[0].querySelector('a')?.getAttribute('href')).toBe('/bookings/101/ticket');

    expect(banners[1].textContent).toContain('Tour Hội An (29/11): Cảnh báo thời tiết khẩn.');
    expect(banners[1].textContent).toContain('Nhà điều hành đã xác nhận.');
    expect(banners[1].textContent).toContain('Lời dặn: Mang áo mưa, tập trung tại sảnh lúc 07:30.');
    expect(banners[1].querySelector('a')?.getAttribute('href')).toBe('/bookings/102/ticket');

    expect(banners[2].textContent).toContain('Tour Huế (30/11): Gió giật mạnh.');
    expect(banners[2].textContent).toContain('Đội hỗ trợ TripMate đang xử lý.');
  });

  it('does not crash on unknown reviewStatus and appends no extra status sentence', () => {
    const trip = makeTrip({
      warning: {
        reviewStatus: 'SomeFutureStatus',
        eventType: 'Flood',
        severity: 'Moderate',
        description: 'Mưa kéo dài',
        validFromUtc: null,
        validToUtc: null,
        operatorInstructions: null,
      },
    });

    render(
      <UpcomingTripWeatherSection
        trips={[trip]}
        activeCoordKey="16.05,108.2"
        onSelectLocation={vi.fn()}
      />,
    );

    const banner = screen.getByRole('status');
    expect(banner.textContent).toContain('Tour Bà Nà (28/11): Mưa kéo dài.');
    expect(banner.textContent).not.toContain('Nhà điều hành');
    expect(banner.textContent).not.toContain('Đội hỗ trợ');
  });

  it('renders trip cards with forecast, inProgress label, null point/forecast fallbacks, and click-to-select', () => {
    const onSelectLocation = vi.fn();
    const trips: UpcomingTripWeatherDto[] = [
      makeTrip({
        bookingId: 101,
        tourTitle: 'Tour Bà Nà',
        inProgress: true,
        warning: {
          reviewStatus: 'PendingAcknowledgement',
          eventType: 'Thunderstorm',
          severity: 'Severe',
          description: 'Dông lớn',
          validFromUtc: null,
          validToUtc: null,
          operatorInstructions: null,
        },
      }),
      makeTrip({
        bookingId: 102,
        tourTitle: 'Tour chưa có điểm hẹn',
        point: null,
        forecast: null,
      }),
      makeTrip({
        bookingId: 103,
        tourTitle: 'Tour Huế chưa có thời tiết',
        point: { name: 'Đại Nội Huế', latitude: 16.4637, longitude: 107.5909 },
        forecast: null,
      }),
    ];

    render(
      <UpcomingTripWeatherSection
        trips={trips}
        activeCoordKey="16.05,108.2"
        onSelectLocation={onSelectLocation}
      />,
    );

    expect(screen.getByText('Chuyến đi sắp tới của bạn')).toBeDefined();
    expect(screen.getByText(/Đang diễn ra/i)).toBeDefined();
    expect(screen.getByText('21°–28°')).toBeDefined();
    expect(screen.getByText('Mưa 80%')).toBeDefined();
    expect(screen.getByText('Chưa có vị trí để xem thời tiết')).toBeDefined();
    expect(screen.getByText('Chưa tải được thời tiết')).toBeDefined();

    // Card with point=null is NOT rendered as a clickable button
    expect(screen.queryByRole('button', { name: /Tour chưa có điểm hẹn/i })).toBeNull();

    // Clicking a card with point selects that point
    const hueCard = screen.getByRole('button', { name: /Tour Huế chưa có thời tiết/i });
    fireEvent.click(hueCard);
    expect(onSelectLocation).toHaveBeenCalledWith({
      name: 'Đại Nội Huế',
      latitude: 16.4637,
      longitude: 107.5909,
      timeZoneId: 'Asia/Ho_Chi_Minh',
    });
  });
});
