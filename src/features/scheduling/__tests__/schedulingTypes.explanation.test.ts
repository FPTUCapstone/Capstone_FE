import { describe, expect, it } from 'vitest';

import {
  isValidItineraryDetailDto,
  isValidSchedulingResponseDto,
} from '../types/schedulingTypes';

const createItem = {
  sequenceNo: 1,
  poiId: 12,
  poiName: 'Bảo tàng Chăm',
  itemKind: 'Visit',
  plannedArrival: '2026-10-20T08:00:00+07:00',
  plannedDeparture: '2026-10-20T09:00:00+07:00',
  stayDurationMinutes: 60,
  travelDurationToNextMinutes: 15,
  estimatedCost: 60000,
  isMandatory: true,
  recommendationReason: 'Phù hợp với sở thích Văn hóa',
};

const createResponse = {
  schedulingRequestId: 3,
  itineraryId: 7,
  title: 'Đà Nẵng',
  status: 'Draft',
  totalEstimatedCost: 60000,
  totalDurationMinutes: 480,
  items: [createItem],
};

const detailItem = {
  itemId: 1,
  sequenceNo: 1,
  poiId: 12,
  poiName: 'Bảo tàng Chăm',
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

const detail = {
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
  items: [detailItem],
};

describe('UC-10 explanation fields on the create response', () => {
  it('still accepts a response without the new fields', () => {
    expect(isValidSchedulingResponseDto(createResponse)).toBe(true);
  });

  it('accepts friendlyExplanation as a string or null, and explanationPending as a boolean', () => {
    expect(
      isValidSchedulingResponseDto({
        ...createResponse,
        explanationPending: true,
        items: [{ ...createItem, friendlyExplanation: 'Câu mẫu' }],
      }),
    ).toBe(true);
    expect(
      isValidSchedulingResponseDto({
        ...createResponse,
        explanationPending: false,
        items: [{ ...createItem, friendlyExplanation: null }],
      }),
    ).toBe(true);
  });

  it('rejects a non-string friendlyExplanation and a non-boolean explanationPending', () => {
    expect(
      isValidSchedulingResponseDto({
        ...createResponse,
        items: [{ ...createItem, friendlyExplanation: 5 }],
      }),
    ).toBe(false);
    expect(isValidSchedulingResponseDto({ ...createResponse, explanationPending: 'yes' })).toBe(false);
  });
});

describe('UC-10 friendlyExplanation on the itinerary detail', () => {
  it('still accepts a detail without the field', () => {
    expect(isValidItineraryDetailDto(detail)).toBe(true);
  });

  it('accepts a string or null', () => {
    expect(
      isValidItineraryDetailDto({ ...detail, items: [{ ...detailItem, friendlyExplanation: 'Câu của AI' }] }),
    ).toBe(true);
    expect(
      isValidItineraryDetailDto({ ...detail, items: [{ ...detailItem, friendlyExplanation: null }] }),
    ).toBe(true);
  });

  it('rejects a non-string value', () => {
    expect(
      isValidItineraryDetailDto({ ...detail, items: [{ ...detailItem, friendlyExplanation: 5 }] }),
    ).toBe(false);
  });
});
