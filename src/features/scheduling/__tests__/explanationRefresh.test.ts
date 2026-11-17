import { describe, expect, it } from 'vitest';

import {
  EXPLANATION_REFRESH_DELAYS_SECONDS,
  hasNewExplanation,
  mergeExplanations,
  registerExplanationPending,
  takeExplanationPending,
} from '../utils/explanationRefresh';
import type {
  ItineraryDetailDto,
  ItineraryDetailItemDto,
  SchedulingResponseDto,
} from '../types/schedulingTypes';

function createResponse(overrides: Partial<SchedulingResponseDto> = {}): SchedulingResponseDto {
  return {
    schedulingRequestId: 1,
    itineraryId: 500,
    title: 'Đà Nẵng',
    status: 'Draft',
    totalEstimatedCost: 0,
    totalDurationMinutes: 240,
    explanationPending: true,
    items: [
      {
        sequenceNo: 1,
        poiId: 10,
        poiName: 'A',
        itemKind: 'Visit',
        plannedArrival: '2026-10-20T08:00:00+07:00',
        plannedDeparture: '2026-10-20T09:00:00+07:00',
        stayDurationMinutes: 60,
        travelDurationToNextMinutes: null,
        estimatedCost: null,
        isMandatory: false,
        recommendationReason: null,
        friendlyExplanation: '  Câu mẫu A  ',
      },
      {
        sequenceNo: 2,
        poiId: 11,
        poiName: 'B',
        itemKind: 'Visit',
        plannedArrival: '2026-10-20T09:30:00+07:00',
        plannedDeparture: '2026-10-20T10:30:00+07:00',
        stayDurationMinutes: 60,
        travelDurationToNextMinutes: null,
        estimatedCost: null,
        isMandatory: false,
        recommendationReason: null,
        friendlyExplanation: null,
      },
    ],
    ...overrides,
  };
}

function detailItem(sequenceNo: number, friendlyExplanation: string | null): ItineraryDetailItemDto {
  return {
    itemId: sequenceNo * 100,
    sequenceNo,
    poiId: sequenceNo,
    poiName: `Điểm ${sequenceNo}`,
    category: null,
    kind: 'Visit',
    plannedArrival: '2026-10-20T08:00:00+07:00',
    plannedDeparture: '2026-10-20T09:00:00+07:00',
    travelDurationFromPreviousMinutes: null,
    stayDurationMinutes: 60,
    estimatedCost: null,
    isMandatory: false,
    recommendationReason: 'Lý do',
    friendlyExplanation,
    isUnavailable: false,
  };
}

function detail(items: ItineraryDetailItemDto[], overrides: Partial<ItineraryDetailDto> = {}): ItineraryDetailDto {
  return {
    itineraryId: 500,
    schedulingRequestId: 1,
    title: 'Đà Nẵng',
    version: 1,
    status: 'Draft',
    validFrom: null,
    validTo: null,
    canManage: true,
    totalEstimatedCost: 0,
    totalDurationMinutes: 240,
    items,
    ...overrides,
  };
}

describe('EXPLANATION_REFRESH_DELAYS_SECONDS', () => {
  it('is 20, 45, 75 and 110 seconds (BE spec section 6)', () => {
    expect([...EXPLANATION_REFRESH_DELAYS_SECONDS]).toEqual([20, 45, 75, 110]);
  });
});

describe('pending-explanation handoff', () => {
  it('stores nothing when the response is not pending', () => {
    registerExplanationPending(createResponse({ itineraryId: 601, explanationPending: false }));
    registerExplanationPending(createResponse({ itineraryId: 602, explanationPending: undefined }));

    expect(takeExplanationPending(601)).toBeNull();
    expect(takeExplanationPending(602)).toBeNull();
  });

  it('stores createdAt and the trimmed template sentences keyed by sequenceNo', () => {
    registerExplanationPending(createResponse({ itineraryId: 603 }), 1_000);

    const handoff = takeExplanationPending(603);

    expect(handoff).not.toBeNull();
    expect(handoff!.itineraryId).toBe(603);
    expect(handoff!.createdAt).toBe(1_000);
    expect(handoff!.template.get(1)).toBe('Câu mẫu A');
    expect(handoff!.template.get(2)).toBe('');
  });

  it('is read once', () => {
    registerExplanationPending(createResponse({ itineraryId: 604 }));

    expect(takeExplanationPending(604)).not.toBeNull();
    expect(takeExplanationPending(604)).toBeNull();
  });

  it('is not consumed by a different itinerary id', () => {
    registerExplanationPending(createResponse({ itineraryId: 605 }));

    expect(takeExplanationPending(999)).toBeNull();
    expect(takeExplanationPending(605)).not.toBeNull();
  });
});

describe('hasNewExplanation', () => {
  const template = new Map([
    [1, 'Câu mẫu A'],
    [2, ''],
  ]);

  it('is false while the sentences equal the template', () => {
    expect(hasNewExplanation(template, [detailItem(1, 'Câu mẫu A'), detailItem(2, null)])).toBe(false);
  });

  it('ignores whitespace around an unchanged sentence', () => {
    expect(hasNewExplanation(template, [detailItem(1, '  Câu mẫu A ')])).toBe(false);
  });

  it('is false for empty, whitespace-only and null sentences', () => {
    expect(hasNewExplanation(template, [detailItem(1, ''), detailItem(2, '   ')])).toBe(false);
    expect(hasNewExplanation(template, [detailItem(1, null)])).toBe(false);
  });

  it('is true when one stop has a different non-empty sentence', () => {
    expect(hasNewExplanation(template, [detailItem(1, 'Câu mẫu A'), detailItem(2, 'Câu của AI')])).toBe(true);
    expect(hasNewExplanation(template, [detailItem(1, 'Câu của AI')])).toBe(true);
  });

  it('treats a sentence for a sequenceNo missing from the template as new', () => {
    expect(hasNewExplanation(template, [detailItem(7, 'Câu của AI')])).toBe(true);
  });
});

describe('mergeExplanations', () => {
  it('copies only friendlyExplanation and keeps every other field of the current itinerary', () => {
    const current = detail([detailItem(1, 'Câu mẫu A'), detailItem(2, null)], { isNavigationInProgress: true });
    const fresh = detail([detailItem(1, 'Câu của AI'), detailItem(2, null)], { version: 9, title: 'Khác' });

    const merged = mergeExplanations(current, fresh);

    expect(merged.items[0].friendlyExplanation).toBe('Câu của AI');
    expect(merged.items[1].friendlyExplanation).toBeNull();
    expect(merged.isNavigationInProgress).toBe(true);
    expect(merged.version).toBe(1);
    expect(merged.title).toBe('Đà Nẵng');
    expect(merged.items[0].itemId).toBe(100);
  });

  it('ignores fresh items whose sequenceNo is not on screen and blank fresh sentences', () => {
    const current = detail([detailItem(1, 'Câu mẫu A')]);
    const fresh = detail([detailItem(1, '   '), detailItem(5, 'Câu của AI')]);

    expect(mergeExplanations(current, fresh)).toBe(current);
  });

  it('returns the same reference when nothing changes', () => {
    const current = detail([detailItem(1, 'Câu mẫu A')]);

    expect(mergeExplanations(current, detail([detailItem(1, 'Câu mẫu A')]))).toBe(current);
  });
});
