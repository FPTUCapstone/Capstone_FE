import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../services/cancellationApi', () => ({
  fetchBookingCancellationPreview: vi.fn().mockResolvedValue({ ok: false, errorCode: 'CANCELLATION_UNAVAILABLE' }),
  submitBookingCancellation: vi.fn(),
}));

import { BookingCancelAction } from './BookingCancelAction';

describe('BookingCancelAction', () => {
  it('shows the cancel entry for a ticket that is still valid', () => {
    render(<BookingCancelAction bookingId="42" ticketStatus="Valid" />);

    expect(screen.getByRole('button', { name: /hủy booking/i })).toBeTruthy();
  });

  it('hides the cancel entry once the ticket was used or the booking is cancelled', () => {
    const { queryByRole, rerender } = render(<BookingCancelAction bookingId="42" ticketStatus="Used" />);
    expect(queryByRole('button', { name: /hủy booking/i })).toBeNull();

    rerender(<BookingCancelAction bookingId="42" ticketStatus="Cancelled" />);
    expect(queryByRole('button', { name: /hủy booking/i })).toBeNull();
  });

  it('opens the cancellation dialog when the entry is pressed', () => {
    render(<BookingCancelAction bookingId="42" ticketStatus="Valid" />);

    fireEvent.click(screen.getByRole('button', { name: /hủy booking/i }));

    expect(screen.getByRole('dialog')).toBeTruthy();
  });
});
