import { mapTourDetailResponse, parseTourDetailResponse } from '../services/tourDetailResponse';
import type { TourDetailDto } from '../types/tour';

/** A complete payload shaped exactly like Backend `GET /api/v1/tours/{id}` (UC-26). Test support only. */
export function validTourDetailWire(): Record<string, unknown> {
  return {
    tourId: '9007199254740993',
    title: 'Hội An food tour',
    description: 'Hai ngày khám phá ẩm thực.',
    destination: 'Hội An, Đà Nẵng',
    destinations: ['Hội An', 'Đà Nẵng'],
    durationDays: 2,
    basePrice: 1500000,
    currency: 'VND',
    operator: { name: 'Hoi An Tours', contactPhone: '0900000000' },
    images: [
      { url: 'https://cdn.example.test/a.jpg', altText: 'A', caption: 'Phố cổ', isPrimary: true },
      { url: 'https://cdn.example.test/b.jpg', altText: 'B', caption: null, isPrimary: false },
    ],
    inclusions: 'Bữa sáng\n- Hướng dẫn viên\r\n\n  • Vé tham quan  ',
    exclusions: null,
    cancellationPolicy: {
      rules: [
        { daysBeforeDeparture: 30, cancellationFeePercent: 0 },
        { daysBeforeDeparture: 15, cancellationFeePercent: 25 },
        { daysBeforeDeparture: 7, cancellationFeePercent: 50 },
        { daysBeforeDeparture: 0, cancellationFeePercent: 100 },
      ],
    },
    itinerary: [
      {
        dayNo: 1,
        items: [
          {
            sequenceNo: 1,
            poi: { poiId: '100', name: 'Phố cổ Hội An', address: 'Trần Phú', latitude: 15.88, longitude: 108.33 },
            plannedTime: '08:30',
            stayDurationMinutes: 90,
            notes: 'Có hướng dẫn viên',
          },
          {
            sequenceNo: 2,
            poi: { poiId: '101', name: 'Chùa Cầu', address: null, latitude: 15.87, longitude: 108.32 },
            plannedTime: null,
            stayDurationMinutes: 30,
            notes: null,
          },
        ],
      },
    ],
    schedules: [
      {
        scheduleId: '11',
        startAtUtc: '2026-11-01T01:00:00Z',
        endAtUtc: '2026-11-03T10:00:00Z',
        meetingPoint: 'Sảnh khách sạn',
        registrationDeadlineAtUtc: '2026-10-30T10:00:00Z',
        adultPrice: 1500000,
        childPrice: 900000,
        infantPrice: 0,
        remainingSlots: 7,
        availabilityStatus: 'available',
        bookable: true,
      },
      {
        scheduleId: '12',
        startAtUtc: '2026-11-10T01:00:00Z',
        endAtUtc: '2026-11-12T10:00:00Z',
        meetingPoint: null,
        registrationDeadlineAtUtc: null,
        adultPrice: 1600000,
        childPrice: null,
        infantPrice: null,
        remainingSlots: 0,
        availabilityStatus: 'soldOut',
        bookable: false,
      },
    ],
    hasBookableSchedule: true,
    rating: { average: 4.5, count: 2 },
    asOfUtc: '2026-10-17T03:00:00Z',
  };
}

/** The page view model produced from `validTourDetailWire()` through the real parser and mapper. */
export function realTourDetailViewModel(
  mutate?: (wire: Record<string, unknown>) => void,
): TourDetailDto {
  const wire = validTourDetailWire();
  mutate?.(wire);
  return mapTourDetailResponse(parseTourDetailResponse(wire));
}
