import { describe, expect, it } from 'vitest';

import {
  isValidItineraryDetailDto,
  isValidItinerarySuggestionsDto,
  isValidSchedulingResponseDto,
} from '../types/schedulingTypes';

const baseItem = {
  itemId: 1,
  sequenceNo: 1,
  poiId: 12,
  poiName: 'Bảo tàng Điêu khắc Chăm',
  category: 'Bảo tàng',
  kind: 'Visit',
  plannedArrival: '2026-10-20T08:00:00+07:00',
  plannedDeparture: '2026-10-20T09:00:00+07:00',
  travelDurationFromPreviousMinutes: 22,
  stayDurationMinutes: 60,
  estimatedCost: 60000,
  isMandatory: true,
  recommendationReason: null,
  isUnavailable: false,
};

const baseDetail = {
  itineraryId: 7,
  schedulingRequestId: 3,
  title: 'Đà Nẵng',
  version: 1,
  status: 'Draft',
  validFrom: null,
  validTo: null,
  canManage: true,
  totalEstimatedCost: 60000,
  totalDurationMinutes: 480,
  items: [baseItem],
};

describe('Review 2 itinerary detail contract (§3.1)', () => {
  it('accepts the new leg, price and location fields', () => {
    expect(
      isValidItineraryDetailDto({
        ...baseDetail,
        transportMode: 'Motorbike',
        startLocation: { latitude: 16.06, longitude: 108.22, address: 'Hải Châu' },
        endLocation: { latitude: 16.06, longitude: 108.22, address: null },
        items: [
          {
            ...baseItem,
            latitude: 16.06,
            longitude: 108.22,
            costKind: 'AdmissionTicket',
            travelDistanceFromPreviousMeters: 9400,
            transportModeFromPrevious: 'Motorbike',
            address: '02 2 Tháng 9',
          },
        ],
      }),
    ).toBe(true);
  });

  it('still accepts responses planned before Review 2 (fields missing or null)', () => {
    expect(isValidItineraryDetailDto(baseDetail)).toBe(true);
    expect(
      isValidItineraryDetailDto({
        ...baseDetail,
        items: [{ ...baseItem, travelDistanceFromPreviousMeters: null, transportModeFromPrevious: null }],
      }),
    ).toBe(true);
  });

  it('rejects an unknown cost kind or transport mode', () => {
    expect(isValidItineraryDetailDto({ ...baseDetail, items: [{ ...baseItem, costKind: 'Ticket' }] })).toBe(false);
    expect(isValidItineraryDetailDto({ ...baseDetail, transportMode: 'Plane' })).toBe(false);
    expect(isValidItineraryDetailDto({ ...baseDetail, startLocation: { latitude: 'x' } })).toBe(false);
    // costKind may be missing, but not null or an arbitrary value.
    expect(isValidItineraryDetailDto({ ...baseDetail, items: [{ ...baseItem, costKind: null }] })).toBe(false);
  });

  it('accepts the trip budget and rejects a malformed one (§3.1 budgetVnd)', () => {
    expect(isValidItineraryDetailDto({ ...baseDetail, budgetVnd: 800000 })).toBe(true);
    expect(isValidItineraryDetailDto({ ...baseDetail, budgetVnd: null })).toBe(true);
    expect(isValidItineraryDetailDto({ ...baseDetail, budgetVnd: '800000' })).toBe(false);
  });
});

describe('Review 2 suggestions contract (§3.5)', () => {
  const suggestion = {
    poiId: 501,
    name: 'Bếp Hến',
    category: 'Food & Drink',
    thumbnailUrl: null,
    address: null,
    costKind: 'AverageSpend',
    estimatedCost: 120000,
    distanceFromPreviousMeters: 1800,
    detourMinutes: 12,
    distanceSource: 'Road',
    estimatedArrival: null,
    openAtArrival: true,
    closesAt: '21:00',
    fitsItinerary: false,
    unfitReason: 'ExceedsEndTime',
    unfitPoiId: 501,
    overflowMinutes: 10,
    overflowVnd: null,
    tripadvisor: null,
  };
  const body = (item: Record<string, unknown>) => ({ itineraryId: 1, kind: 'Food', searchRadiusKm: 15, items: [item] });

  it('accepts a well-formed suggestion', () => {
    expect(isValidItinerarySuggestionsDto(body(suggestion))).toBe(true);
  });

  it('rejects unknown enum values', () => {
    expect(isValidItinerarySuggestionsDto(body({ ...suggestion, costKind: 'Ticket' }))).toBe(false);
    expect(isValidItinerarySuggestionsDto(body({ ...suggestion, costKind: null }))).toBe(false);
    expect(isValidItinerarySuggestionsDto(body({ ...suggestion, distanceSource: 'Air' }))).toBe(false);
    expect(isValidItinerarySuggestionsDto(body({ ...suggestion, unfitReason: 'TooFar' }))).toBe(false);
  });

  it('accepts hasRecentReviews as boolean, null or absent, and rejects anything else', () => {
    const tripadvisor = {
      locationId: 1,
      rating: 4.5,
      reviewCount: 19,
      ratingImageUrl: null,
      url: null,
    };
    const withTa = (extra: Record<string, unknown>) =>
      body({ ...suggestion, tripadvisor: { ...tripadvisor, ...extra } });

    expect(isValidItinerarySuggestionsDto(withTa({}))).toBe(true);
    expect(isValidItinerarySuggestionsDto(withTa({ hasRecentReviews: true }))).toBe(true);
    expect(isValidItinerarySuggestionsDto(withTa({ hasRecentReviews: false }))).toBe(true);
    expect(isValidItinerarySuggestionsDto(withTa({ hasRecentReviews: null }))).toBe(true);
    expect(isValidItinerarySuggestionsDto(withTa({ hasRecentReviews: 'false' }))).toBe(false);
    expect(isValidItinerarySuggestionsDto(withTa({ hasRecentReviews: 0 }))).toBe(false);
  });
});

describe('Review 2 scheduling response contract (§3.2)', () => {
  it('accepts leg distance, leg mode and cost kind on generated items', () => {
    expect(
      isValidSchedulingResponseDto({
        schedulingRequestId: 3,
        itineraryId: 7,
        title: 'Đà Nẵng',
        status: 'Draft',
        totalEstimatedCost: 0,
        totalDurationMinutes: 60,
        items: [
          {
            sequenceNo: 1,
            poiId: 12,
            poiName: 'A',
            itemKind: 'Visit',
            plannedArrival: '2026-10-20T08:00:00+07:00',
            plannedDeparture: '2026-10-20T09:00:00+07:00',
            stayDurationMinutes: 60,
            travelDurationToNextMinutes: 10,
            estimatedCost: null,
            isMandatory: false,
            recommendationReason: null,
            travelDistanceToNextMeters: 2100,
            transportModeToNext: 'Car',
            costKind: 'AverageSpend',
          },
        ],
      }),
    ).toBe(true);
  });
});
