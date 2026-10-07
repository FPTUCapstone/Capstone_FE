import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BookingDetailPanel } from './BookingDetailPanel';
import { INITIAL_DEMO_BOOKINGS } from '../data/operatorBookingDemoFixtures';
import type { BookingDto } from '../types/bookingLifecycle';

const cancellableBooking = INITIAL_DEMO_BOOKINGS[0]; // BK-20260919-0141 (Confirmed, paid)
const checkedInBooking = INITIAL_DEMO_BOOKINGS[1]; // BK-20260912-0148 (CheckedIn)
const refundedBooking = INITIAL_DEMO_BOOKINGS[4]; // BK-20260820-0110 (Cancelled, already refunded)

function TestDrawerHarness({
  booking = cancellableBooking,
  isDemo = true,
  onOpenCancel = vi.fn(),
  onOpenRefund = vi.fn(),
}: {
  booking?: BookingDto;
  isDemo?: boolean;
  onOpenCancel?: (b: BookingDto) => void;
  onOpenRefund?: (b: BookingDto) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <BookingDetailPanel
        open={open}
        booking={booking}
        isDemo={isDemo}
        onClose={() => setOpen(false)}
        onOpenCancelDialog={onOpenCancel}
        onOpenRefundDialog={onOpenRefund}
      />
    </div>
  );
}

afterEach(() => {
  cleanup();
});

describe('BookingDetailPanel (UC-40 Drawer & Action Eligibility)', () => {
  it('renders drawer with aria-modal="true" and complete booking details in English', () => {
    render(<TestDrawerHarness booking={cancellableBooking} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByText(/BK-20260919-0141/i)).toBeDefined();
    expect(screen.getByText('Ba Na Hills full-day tour')).toBeDefined();
    expect(screen.getAllByText('Nguyễn Văn An').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/5\.600\.000/).length).toBeGreaterThan(0);
    // Payment is read-only
    expect(screen.getByText(/Payment Information/i)).toBeDefined();
  });

  it('enables Cancel button for cancellable demo booking and triggers callback', () => {
    const handleCancel = vi.fn();
    render(<TestDrawerHarness booking={cancellableBooking} isDemo={true} onOpenCancel={handleCancel} />);

    const cancelBtn = screen.getByRole('button', {
      name: /Cancel Booking/i,
    });
    expect(cancelBtn.getAttribute('disabled')).toBeNull();

    fireEvent.click(cancelBtn);
    expect(handleCancel).toHaveBeenCalledWith(cancellableBooking);
  });

  it('disables Cancel button when booking is checked in (MSG95)', () => {
    render(<TestDrawerHarness booking={checkedInBooking} isDemo={true} />);

    const cancelBtn = screen.getByRole('button', {
      name: /Cancel Booking/i,
    });
    expect(cancelBtn.getAttribute('disabled')).toBeDefined();
  });

  it('disables Refund button when refund already exists (BR-74 idempotency)', () => {
    render(<TestDrawerHarness booking={refundedBooking} isDemo={true} />);

    const refundBtn = screen.getByRole('button', {
      name: /Initiate Refund/i,
    });
    expect(refundBtn.getAttribute('disabled')).toBeDefined();
  });

  it('disables all destructive mutation actions in production mode (NO_BACKEND)', () => {
    render(<TestDrawerHarness booking={cancellableBooking} isDemo={false} />);

    const cancelBtn = screen.getByRole('button', {
      name: /Cancel Booking/i,
    });
    const refundBtn = screen.getByRole('button', {
      name: /Initiate Refund/i,
    });

    expect(cancelBtn.getAttribute('disabled')).toBeDefined();
    expect(refundBtn.getAttribute('disabled')).toBeDefined();
  });

  it('closes drawer on Escape key', () => {
    render(<TestDrawerHarness booking={cancellableBooking} />);

    expect(screen.getByRole('dialog')).toBeDefined();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('displays refund clarification notice for cancelled booking with paid amount awaiting refund', () => {
    const unrefundedCancelled: BookingDto = {
      ...cancellableBooking,
      status: 'Cancelled',
      cancellationReason: 'Customer requested cancellation',
      cancelledAt: '2026-09-10T08:00:00Z',
      refund: undefined,
    };
    render(<TestDrawerHarness booking={unrefundedCancelled} />);

    expect(screen.getByText(/Refund follow-up: Report 3 V2 contains conflicting requirements/i)).toBeDefined();
  });
});
