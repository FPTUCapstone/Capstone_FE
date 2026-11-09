import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PartnerWorkspaceNav } from './PartnerWorkspaceNav';

vi.mock('@/components/LogoutButton', () => ({ default: () => null }));
vi.mock('@/features/operator/weather-safety/weatherSafetyApi', () => ({
  getWeatherSafetyReviewBadgeCount: () => Promise.resolve(0),
}));

describe('PartnerWorkspaceNav', () => {
  it('adds the safety alerts next to every existing workspace destination', () => {
    render(<PartnerWorkspaceNav activeTab="weatherSafety" weatherAlertBadgeCount={0} />);

    for (const [name, href] of [
      [/Cảnh báo an toàn/, '/partner/weather-safety-reviews'],
      [/Gói tour/, '/partner/tours'],
      [/Doanh thu/, '/partner/revenue'],
      [/Thanh toán/, '/partner/payouts'],
    ] as const) {
      expect(screen.getAllByRole('link', { name })[0].getAttribute('href')).toBe(href);
    }
  });
});
