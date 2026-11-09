import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ReviewDeadline } from '../ReviewDeadline';

describe('ReviewDeadline', () => {
  it('renders absolute date and time accessible text', () => {
    const deadline = '2026-11-03T14:30:00Z';
    render(<ReviewDeadline deadlineUtc={deadline} status="PendingAcknowledgement" />);
    const timeElement = screen.getByRole('time');
    expect(timeElement).toBeDefined();
    expect(timeElement.getAttribute('dateTime')).toBe(deadline);
  });

  it('renders urgent label when review is Escalated', () => {
    const deadline = '2026-11-01T10:00:00Z';
    render(<ReviewDeadline deadlineUtc={deadline} status="Escalated" />);
    expect(screen.getByText(/Quá hạn phản hồi/i)).toBeDefined();
  });
});
