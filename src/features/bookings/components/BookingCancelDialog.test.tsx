import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  fetchBookingCancellationPreview: vi.fn(),
  submitBookingCancellation: vi.fn(),
}));

vi.mock('../services/cancellationApi', () => api);

import { BookingCancelDialog } from './BookingCancelDialog';

const CONFIRMATION_CODE = 'booking.cancellation.confirmation_required';

function preview(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    ok: true as const,
    data: {
      bookingId: 42,
      canCancel: true,
      blockingReasonCode: null,
      blockingReason: null,
      estimatedRefundAmount: 800000,
      refundStatus: 'Pending',
      bookingStatus: 'Confirmed',
      paymentStatus: 'Paid',
      tourTitle: 'Hoi An',
      totalAmount: 800000,
      ...overrides,
    },
  };
}

function renderDialog() {
  const onCancelled = vi.fn();
  render(<BookingCancelDialog bookingId="42" onClose={vi.fn()} onCancelled={onCancelled} />);
  return { onCancelled };
}

describe('BookingCancelDialog', () => {
  beforeEach(() => {
    api.fetchBookingCancellationPreview.mockReset();
    api.submitBookingCancellation.mockReset();
  });

  it('shows the refund amount and confirms without a checkbox when the refund is above zero', async () => {
    api.fetchBookingCancellationPreview.mockResolvedValueOnce(preview());
    api.submitBookingCancellation.mockResolvedValueOnce({ ok: true, data: { bookingId: 42 } });
    const { onCancelled } = renderDialog();

    expect((await screen.findByTestId('cancel-refund-amount')).textContent).toContain('800.000');
    expect(screen.queryByRole('checkbox')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /xác nhận hủy/i }));

    await waitFor(() => expect(onCancelled).toHaveBeenCalled());
    expect(api.submitBookingCancellation).toHaveBeenCalledWith(
      '42',
      expect.objectContaining({ confirmed: false }),
      expect.stringMatching(/^[0-9a-f-]{36}$/i),
    );
  });

  it('requires ticking the confirmation before a 0% cancellation is sent', async () => {
    api.fetchBookingCancellationPreview.mockResolvedValueOnce(
      preview({ estimatedRefundAmount: 0, blockingReasonCode: CONFIRMATION_CODE, refundStatus: 'NotRequired' }),
    );
    api.submitBookingCancellation.mockResolvedValueOnce({ ok: true, data: { bookingId: 42 } });
    const { onCancelled } = renderDialog();

    const confirm = await screen.findByRole('button', { name: /xác nhận hủy/i });
    const checkbox = screen.getByRole('checkbox');
    expect((confirm as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(checkbox);
    expect((confirm as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(confirm);

    await waitFor(() => expect(onCancelled).toHaveBeenCalled());
    expect(api.submitBookingCancellation).toHaveBeenCalledWith(
      '42',
      expect.objectContaining({ confirmed: true }),
      expect.any(String),
    );
  });

  it('blocks confirmation and shows the reason when the booking cannot be cancelled', async () => {
    api.fetchBookingCancellationPreview.mockResolvedValueOnce(
      preview({ canCancel: false, blockingReasonCode: 'booking.cancellation.invalid_state', blockingReason: 'Đã hoàn tất' }),
    );
    renderDialog();

    expect(await screen.findByText('Đã hoàn tất')).toBeTruthy();
    expect((screen.getByRole('button', { name: /xác nhận hủy/i }) as HTMLButtonElement).disabled).toBe(true);
    expect(api.submitBookingCancellation).not.toHaveBeenCalled();
  });

  it('keeps the dialog open and shows a message when the cancellation fails', async () => {
    api.fetchBookingCancellationPreview.mockResolvedValueOnce(preview());
    api.submitBookingCancellation.mockResolvedValueOnce({ ok: false, errorCode: 'CANCELLATION_UNAVAILABLE' });
    const { onCancelled } = renderDialog();

    fireEvent.click(await screen.findByRole('button', { name: /xác nhận hủy/i }));

    expect((await screen.findByRole('alert')).textContent).toMatch(/không thể hủy/i);
    expect(onCancelled).not.toHaveBeenCalled();
  });
});
