import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ItinerarySummaryCards } from '../components/ItinerarySummaryCards';
import { ItineraryDetailDto, ItineraryDetailItemDto } from '../types/schedulingTypes';

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

const itinerary: ItineraryDetailDto = {
  itineraryId: 1,
  schedulingRequestId: 1,
  title: 'T',
  version: 1,
  status: 'Draft',
  validFrom: null,
  validTo: null,
  canManage: true,
  totalEstimatedCost: 180000,
  totalDurationMinutes: 480,
  items: [
    item({ itemId: 1, poiId: 1, estimatedCost: 60000, costKind: 'AdmissionTicket' }),
    item({ itemId: 2, poiId: 2, estimatedCost: 120000, costKind: 'AverageSpend' }),
    item({ itemId: 3, poiId: 3, estimatedCost: null, costKind: 'AdmissionTicket' }),
  ],
};

describe('ItinerarySummaryCards cost split (D11-7)', () => {
  it('splits the expected cost into tickets, food and total', () => {
    render(<ItinerarySummaryCards itinerary={itinerary} />);

    const card = screen.getByTestId('cost-split');
    expect(card.textContent).toContain('Vé');
    expect(card.textContent).toContain('60.000 VNĐ');
    expect(card.textContent).toContain('Ăn uống');
    expect(card.textContent).toContain('120.000 VNĐ');
    expect(card.textContent).toContain('Tổng');
    expect(card.textContent).toContain('180.000 VNĐ');
    expect(card.textContent).toContain('1 điểm chưa có thông tin giá');
  });
});

describe('ItinerarySummaryCards budget (D11-7, §3.1 budgetVnd)', () => {
  it('shows the total against the trip budget', () => {
    render(<ItinerarySummaryCards itinerary={{ ...itinerary, budgetVnd: 800000 }} />);

    expect(screen.getByTestId('cost-split').textContent).toContain('180.000 VNĐ / 800.000 VNĐ');
    expect(screen.getByText('Tổng / ngân sách')).toBeDefined();
  });

  it('omits the budget when the trip has none', () => {
    render(<ItinerarySummaryCards itinerary={{ ...itinerary, budgetVnd: null }} />);

    expect(screen.getByTestId('cost-split').textContent).not.toContain('VNĐ / ');
    expect(screen.getByText('Tổng')).toBeDefined();
  });
});
