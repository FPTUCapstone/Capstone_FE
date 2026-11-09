import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeatherSafetyReviewStatusBadge } from '../WeatherSafetyReviewStatusBadge';

describe('WeatherSafetyReviewStatusBadge', () => {
  it('renders PendingAcknowledgement with clear text and icon', () => {
    render(<WeatherSafetyReviewStatusBadge status="PendingAcknowledgement" />);
    expect(screen.getByText('Chờ xác nhận')).toBeDefined();
    expect(screen.getByLabelText('Trạng thái: Chờ xác nhận')).toBeDefined();
  });

  it('renders Escalated with urgent text and icon', () => {
    render(<WeatherSafetyReviewStatusBadge status="Escalated" />);
    expect(screen.getByText('Quá hạn xác nhận')).toBeDefined();
    expect(screen.getByLabelText('Trạng thái: Quá hạn xác nhận')).toBeDefined();
  });

  it('renders Acknowledged status', () => {
    render(<WeatherSafetyReviewStatusBadge status="Acknowledged" />);
    expect(screen.getByText('Đã xem')).toBeDefined();
  });

  it('renders Closed status', () => {
    render(<WeatherSafetyReviewStatusBadge status="Closed" />);
    expect(screen.getByText('Đã đóng')).toBeDefined();
  });
});
