import { describe, expect, it } from 'vitest';

import { ItineraryDetailDto, ItineraryDetailItemDto } from '../types/schedulingTypes';
import { buildItineraryMapModel, circlePolygon, MARKER_COLORS } from '../utils/mapGeometry';

function item(overrides: Partial<ItineraryDetailItemDto>): ItineraryDetailItemDto {
  return {
    itemId: 1,
    sequenceNo: 1,
    poiId: 1,
    poiName: 'A',
    category: null,
    kind: 'Visit',
    plannedArrival: '2026-10-20T08:00:00+07:00',
    plannedDeparture: '2026-10-20T09:00:00+07:00',
    travelDurationFromPreviousMinutes: null,
    stayDurationMinutes: 60,
    estimatedCost: null,
    isMandatory: false,
    recommendationReason: null,
    isUnavailable: false,
    ...overrides,
  };
}

describe('circlePolygon (D9 radius circle)', () => {
  it('draws a closed ring whose points are the radius away from the centre', () => {
    const ring = circlePolygon({ latitude: 16.06, longitude: 108.22 }, 10, 32).coordinates[0];

    expect(ring).toHaveLength(33);
    expect(ring[0]).toEqual(ring[32]);
    // North point: 10 km ≈ 0.0899° of latitude.
    const north = ring[0];
    expect(north[0]).toBeCloseTo(108.22, 5);
    expect(north[1]).toBeCloseTo(16.06 + 10 / 111.32, 2);
  });
});

describe('buildItineraryMapModel (D9 itinerary map)', () => {
  const itinerary: Pick<ItineraryDetailDto, 'items' | 'startLocation' | 'endLocation'> = {
    startLocation: { latitude: 16.05, longitude: 108.2, address: 'Khách sạn' },
    endLocation: { latitude: 16.07, longitude: 108.25, address: 'Sân bay' },
    items: [
      item({ itemId: 11, sequenceNo: 1, poiId: 12, poiName: 'Bảo tàng Chăm', latitude: 16.06, longitude: 108.22 }),
      item({ itemId: 12, sequenceNo: 2, poiId: 501, poiName: 'Bếp Hến', costKind: 'AverageSpend', latitude: 16.065, longitude: 108.23 }),
      item({ itemId: 13, sequenceNo: 3, poiId: null, poiName: null, kind: 'Rest' }),
    ],
  };

  it('numbers the stops, colours them by type and adds start and end', () => {
    const model = buildItineraryMapModel(itinerary);

    expect(model.markers.map((marker) => [marker.kind, marker.label, marker.itemId])).toEqual([
      ['start', 'B', null],
      ['attraction', '1', 11],
      ['food', '2', 12],
      ['end', 'K', null],
    ]);
    expect(model.markers[2].color).toBe(MARKER_COLORS.food);
    expect(model.route.coordinates).toEqual([
      [108.2, 16.05],
      [108.22, 16.06],
      [108.23, 16.065],
      [108.25, 16.07],
    ]);
  });

  it('shows one marker when the trip returns to the start', () => {
    const model = buildItineraryMapModel({
      ...itinerary,
      endLocation: { latitude: 16.05, longitude: 108.2, address: 'Khách sạn' },
    });

    expect(model.markers.filter((marker) => marker.kind === 'end')).toHaveLength(0);
    expect(model.route.coordinates[model.route.coordinates.length - 1]).toEqual([108.2, 16.05]);
  });

  it('has nothing to draw when no stop has coordinates', () => {
    const model = buildItineraryMapModel({ items: [item({ latitude: null, longitude: null })] });

    expect(model.markers).toEqual([]);
  });
});
