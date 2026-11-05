import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeatherSafetyReviewList } from '../WeatherSafetyReviewList';
import type { WeatherSafetyReview } from '../../types';

const sampleReviews: WeatherSafetyReview[] = [
  {
    id: 1,
    tourScheduleId: 101,
    tourId: 201,
    tourTitle: 'Bà Nà Hills Tour',
    scheduleStartAtUtc: '2026-11-03T01:00:00Z',
    scheduleEndAtUtc: '2026-11-03T09:00:00Z',
    scheduleStatus: 'Scheduled',
    provider: 'Tomorrow.io',
    providerEventId: 'evt-01',
    eventType: 'SevereTropicalStorm',
    severity: 'Severe',
    description: 'Bão mạnh đổ bộ',
    validFromUtc: '2026-11-03T00:00:00Z',
    validToUtc: '2026-11-03T12:00:00Z',
    originalAuthority: 'NCHMF',
    officialVietnamRiskLevel: 3,
    verifiedDirective: 'TravelProhibition',
    affectedAreaSummary: 'Đà Nẵng',
    isWithdrawn: false,
    status: 'PendingAcknowledgement',
    urgentNoticeSentAtUtc: '2026-11-02T12:00:00Z',
    acknowledgementDeadlineUtc: '2026-11-02T14:00:00Z',
    acknowledgedAtUtc: null,
    acknowledgedByOperatorId: null,
    escalatedAtUtc: null,
    escalationContact: null,
    immediateInstructions: null,
    createdAtUtc: '2026-11-02T12:00:00Z',
  },
  {
    id: 2,
    tourScheduleId: 102,
    tourId: 202,
    tourTitle: 'Ngũ Hành Sơn Tour',
    scheduleStartAtUtc: '2026-11-04T02:00:00Z',
    scheduleEndAtUtc: '2026-11-04T08:00:00Z',
    scheduleStatus: 'Scheduled',
    provider: 'Tomorrow.io',
    providerEventId: 'evt-02',
    eventType: 'Flood',
    severity: 'Moderate',
    description: 'Ngập lụt cục bộ',
    validFromUtc: null,
    validToUtc: null,
    originalAuthority: 'NCHMF',
    officialVietnamRiskLevel: 2,
    verifiedDirective: null,
    affectedAreaSummary: null,
    isWithdrawn: true,
    status: 'Acknowledged',
    urgentNoticeSentAtUtc: '2026-11-02T10:00:00Z',
    acknowledgementDeadlineUtc: '2026-11-02T12:00:00Z',
    acknowledgedAtUtc: '2026-11-02T11:00:00Z',
    acknowledgedByOperatorId: 42,
    escalatedAtUtc: null,
    escalationContact: null,
    immediateInstructions: null,
    createdAtUtc: '2026-11-02T10:00:00Z',
  },
];

describe('WeatherSafetyReviewList', () => {
  it('renders list items with tour title, risk level, status, and withdrawn indicator', () => {
    render(
      <WeatherSafetyReviewList
        reviews={sampleReviews}
        selectedFilter="ALL"
        onFilterChange={vi.fn()}
        onSelectReview={vi.fn()}
      />
    );

    expect(screen.getByText('Bà Nà Hills Tour')).toBeDefined();
    expect(screen.getByText('Cấp 3')).toBeDefined();
    expect(screen.getByText('Ngũ Hành Sơn Tour')).toBeDefined();
    expect(screen.getByText(/Cảnh báo đã được nhà cung cấp rút lại/i)).toBeDefined();
  });

  it('lists a closed review under the closed tab only', () => {
    const closed = { ...sampleReviews[0], id: 999, tourTitle: 'Closed departure', status: 'Closed' as const };
    const { rerender } = render(
      <WeatherSafetyReviewList
        reviews={[closed]}
        selectedFilter="Closed"
        onFilterChange={vi.fn()}
        onSelectReview={vi.fn()}
      />
    );
    expect(screen.getByText('Closed departure')).toBeDefined();

    rerender(
      <WeatherSafetyReviewList
        reviews={[closed]}
        selectedFilter="PendingAcknowledgement"
        onFilterChange={vi.fn()}
        onSelectReview={vi.fn()}
      />
    );
    expect(screen.queryByText('Closed departure')).toBeNull();
  });

  it('filters reviews when filter is changed', () => {
    const onFilterChange = vi.fn();
    render(
      <WeatherSafetyReviewList
        reviews={sampleReviews}
        selectedFilter="ALL"
        onFilterChange={onFilterChange}
        onSelectReview={vi.fn()}
      />
    );

    const pendingFilterButton = screen.getByRole('button', { name: /Chờ xác nhận/i });
    fireEvent.click(pendingFilterButton);
    expect(onFilterChange).toHaveBeenCalledWith('PendingAcknowledgement');
  });

  it('calls onSelectReview when an item is clicked', () => {
    const onSelectReview = vi.fn();
    render(
      <WeatherSafetyReviewList
        reviews={sampleReviews}
        selectedFilter="ALL"
        onFilterChange={vi.fn()}
        onSelectReview={onSelectReview}
      />
    );

    fireEvent.click(screen.getByText('Bà Nà Hills Tour'));
    expect(onSelectReview).toHaveBeenCalledWith(1);
  });
});
