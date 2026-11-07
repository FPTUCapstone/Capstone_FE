import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeatherEventSummary } from '../WeatherEventSummary';
import type { WeatherSafetyReview } from '../../types';

const baseReview: WeatherSafetyReview = {
  id: 10,
  tourScheduleId: 50,
  tourId: 200,
  tourTitle: 'Tour Cù Lao Chàm',
  scheduleStartAtUtc: '2026-11-04T01:00:00Z',
  scheduleEndAtUtc: '2026-11-04T09:00:00Z',
  scheduleStatus: 'Scheduled',
  provider: 'Tomorrow.io',
  providerEventId: 'tomorrow-storm-99',
  eventType: 'TropicalStorm',
  severity: 'Severe',
  description: 'Bão cấp 10 giật cấp 12 đổ bộ vùng biển Quảng Nam - Đà Nẵng',
  validFromUtc: '2026-11-04T00:00:00Z',
  validToUtc: '2026-11-04T12:00:00Z',
  originalAuthority: 'Trung tâm Dự báo Khí tượng Thủy văn Quốc gia (NCHMF)',
  officialVietnamRiskLevel: 4,
  verifiedDirective: 'Cấm biển toàn bộ tàu thuyền du lịch xuất bến',
  affectedAreaSummary: 'Vùng biển Cù Lao Chàm và vịnh Đà Nẵng',
  isWithdrawn: false,
  status: 'PendingAcknowledgement',
  urgentNoticeSentAtUtc: '2026-11-03T10:00:00Z',
  acknowledgementDeadlineUtc: '2026-11-03T12:00:00Z',
  acknowledgedAtUtc: null,
  acknowledgedByOperatorId: null,
  escalatedAtUtc: null,
  escalationContact: null,
  immediateInstructions: null,
  createdAtUtc: '2026-11-03T10:00:00Z',
};

describe('WeatherEventSummary', () => {
  it('renders all official Vietnam weather risk fields and authority directives', () => {
    render(<WeatherEventSummary review={baseReview} />);

    expect(screen.getByRole('heading', { name: 'Tour Cù Lao Chàm' })).toBeDefined();
    expect(screen.getByText(/Cấp 4/i)).toBeDefined();
    expect(screen.getByText(/Trung tâm Dự báo Khí tượng Thủy văn Quốc gia/i)).toBeDefined();
    expect(screen.getByText(/Cấm biển toàn bộ tàu thuyền du lịch xuất bến/i)).toBeDefined();
    expect(screen.getByText(/Vùng biển Cù Lao Chàm và vịnh Đà Nẵng/i)).toBeDefined();
  });

  it('renders warning banner when weather alert has been withdrawn by provider', () => {
    const withdrawnReview: WeatherSafetyReview = {
      ...baseReview,
      isWithdrawn: true,
    };

    render(<WeatherEventSummary review={withdrawnReview} />);
    expect(screen.getByText(/Cảnh báo đã được nhà cung cấp rút lại/i)).toBeDefined();
  });

  it('does not render raw GeoJSON or JSON dumps', () => {
    const { container } = render(<WeatherEventSummary review={baseReview} />);
    expect(container.textContent).not.toContain('{"type":"Feature"');
    expect(container.textContent).not.toContain('coordinates');
  });

  it('names the departure status and severity in Vietnamese', () => {
    const { container } = render(
      <WeatherEventSummary review={{ ...baseReview, scheduleStatus: 'Scheduled', severity: 'Severe' }} />
    );

    expect(container.textContent).toContain('Đã lên lịch');
    expect(container.textContent).toContain('Nghiêm trọng');
    expect(container.textContent).not.toMatch(/Scheduled|Severe/);
  });
});
