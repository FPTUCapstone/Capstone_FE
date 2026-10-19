import { describe, expect, it } from 'vitest';

import { ItineraryDetailItemDto } from '../types/schedulingTypes';
import {
  currentStops,
  insertAfterItem,
  removeStop,
  reorderStops,
  replaceStop,
  withLegMode,
} from '../utils/itineraryStops';

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

const items = [
  item({ itemId: 11, sequenceNo: 1, poiId: 12 }),
  item({ itemId: 12, sequenceNo: 2, poiId: 88, transportModeFromPrevious: 'Motorbike' }),
  item({ itemId: 13, sequenceNo: 3, poiId: null, kind: 'Rest', transportModeFromPrevious: 'Walking' }),
  item({ itemId: 14, sequenceNo: 4, poiId: 35, transportModeFromPrevious: 'Car' }),
];

describe('itinerary stops (§3.4 body)', () => {
  it('builds the visit stops with the mode of the leg that leaves each stop', () => {
    expect(currentStops(items)).toEqual([
      { poiId: 12, transportModeToNext: 'Motorbike' },
      { poiId: 88, transportModeToNext: 'Walking' },
      { poiId: 35 },
    ]);
  });

  it('omits unknown or unsupported leg modes so the trip default applies', () => {
    const legacy = [
      item({ itemId: 1, poiId: 1 }),
      item({ itemId: 2, poiId: 2, transportModeFromPrevious: null }),
      item({ itemId: 3, poiId: 3, transportModeFromPrevious: 'PublicTransit' }),
    ];
    expect(currentStops(legacy)).toEqual([{ poiId: 1 }, { poiId: 2 }, { poiId: 3 }]);
  });

  it('changes the mode of one leg', () => {
    expect(withLegMode(currentStops(items), 88, 'Car')).toEqual([
      { poiId: 12, transportModeToNext: 'Motorbike' },
      { poiId: 88, transportModeToNext: 'Car' },
      { poiId: 35 },
    ]);
  });

  it('inserts after the last visit at or before the anchor: the anchor keeps its mode, the new stop gets none (§3.4)', () => {
    expect(insertAfterItem(items, items[2], 500)).toEqual([
      { poiId: 12, transportModeToNext: 'Motorbike' },
      { poiId: 88, transportModeToNext: 'Walking' },
      { poiId: 500 },
      { poiId: 35 },
    ]);
    expect(insertAfterItem(items, items[3], 500)).toEqual([
      { poiId: 12, transportModeToNext: 'Motorbike' },
      { poiId: 88, transportModeToNext: 'Walking' },
      { poiId: 35 },
      { poiId: 500 },
    ]);
  });

  it('replaces in place: the new stop takes the replaced stop mode, like the API dry-run (§3.4)', () => {
    expect(replaceStop(currentStops(items), 88, 600)).toEqual([
      { poiId: 12, transportModeToNext: 'Motorbike' },
      { poiId: 600, transportModeToNext: 'Walking' },
      { poiId: 35 },
    ]);
  });

  it('reorders: a stop keeps its mode only while the stop after it is unchanged (§3.4)', () => {
    // A walk between two neighbours must not become a walk to a different, possibly far, stop.
    expect(reorderStops(currentStops(items), [12, 35, 88])).toEqual([
      { poiId: 12 },
      { poiId: 35 },
      { poiId: 88 },
    ]);

    const four = [
      { poiId: 1, transportModeToNext: 'Motorbike' as const },
      { poiId: 2, transportModeToNext: 'Walking' as const },
      { poiId: 3, transportModeToNext: 'Car' as const },
      { poiId: 4 },
    ];
    expect(reorderStops(four, [2, 3, 4, 1])).toEqual([
      { poiId: 2, transportModeToNext: 'Walking' },
      { poiId: 3, transportModeToNext: 'Car' },
      { poiId: 4 },
      { poiId: 1 },
    ]);
  });

  it('takes the leg mode of a visit from its own outgoing leg when a rest item follows it', () => {
    // 88 → rest is walked, rest → 35 is driven: the BE stores Walking on the visit 88.
    expect(currentStops(items).find((entry) => entry.poiId === 88)).toEqual({
      poiId: 88,
      transportModeToNext: 'Walking',
    });
  });

  it('removes a stop and drops the mode of a new last stop', () => {
    expect(removeStop(currentStops(items), 35)).toEqual([
      { poiId: 12, transportModeToNext: 'Motorbike' },
      { poiId: 88 },
    ]);
  });
});
