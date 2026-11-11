import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BookingDetailPanel } from './BookingDetailPanel';
import { INITIAL_DEMO_BOOKINGS, toDemoDetailView, toDemoListItem } from '../data/operatorBookingDemoFixtures';
import { bookingEn } from '../resources/en';
import type { BookingDetailView } from '../types/bookingLifecycle';

const cancellableBooking = toDemoDetailView(INITIAL_DEMO_BOOKINGS[0]); // BK-20260919-0141 (Confirmed, paid)
const checkedInBooking = toDemoDetailView(INITIAL_DEMO_BOOKINGS[1]); // BK-20260912-0148 (CheckedIn)
const refundedBooking = toDemoDetailView(INITIAL_DEMO_BOOKINGS[4]); // BK-20260820-0110 (Cancelled, already refunded)
const expiredBooking = toDemoDetailView(INITIAL_DEMO_BOOKINGS[3]); // BK-20260914-0144 (Expired, never paid)

function TestDrawerHarness({
  booking = cancellableBooking,
  isDemo = true,
  onOpenCancel = vi.fn(),
  onOpenRefund = vi.fn(),
}: {
  booking?: BookingDetailView;
  isDemo?: boolean;
  onOpenCancel?: (b: BookingDetailView) => void;
  onOpenRefund?: (b: BookingDetailView) => void;
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

  it('disables Cancel button with the CheckedIn tooltip when canCancel is false because the customer checked in (MSG95)', () => {
    render(<TestDrawerHarness booking={checkedInBooking} isDemo={true} />);

    const cancelBtn = screen.getByRole('button', { name: /Cancel Booking/i }) as HTMLButtonElement;
    expect(cancelBtn.disabled).toBe(true);
    expect(cancelBtn.getAttribute('title')).toBe(bookingEn.detail.cancelBlockedCheckedInTooltip);
  });

  it('disables Cancel button with the InvalidStatus tooltip for an Expired booking and shows the Expired badge', () => {
    render(<TestDrawerHarness booking={expiredBooking} isDemo={true} />);

    const cancelBtn = screen.getByRole('button', { name: /Cancel Booking/i }) as HTMLButtonElement;
    expect(cancelBtn.disabled).toBe(true);
    expect(cancelBtn.getAttribute('title')).toBe(bookingEn.detail.cancelBlockedInvalidStatusTooltip);
    expect(screen.getAllByText(bookingEn.statuses.Expired).length).toBeGreaterThan(0);
  });

  it('follows canCancel from the BE contract rather than recomputing the booking state', () => {
    const forcedBlocked: BookingDetailView = {
      ...cancellableBooking,
      canCancel: false,
      cancelBlockedReason: 'InvalidStatus',
    };
    render(<TestDrawerHarness booking={forcedBlocked} isDemo={true} />);

    expect((screen.getByRole('button', { name: /Cancel Booking/i }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('renders participants with name and type only (no age, no special notes) and the payment gateway', () => {
    render(<TestDrawerHarness booking={cancellableBooking} />);

    expect(screen.getByText('Trần Thị Mai')).toBeDefined();
    expect(screen.getAllByText('Adult').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Child').length).toBeGreaterThan(0);
    expect(screen.queryByText(/years old/i)).toBeNull();
    expect(screen.queryByText('Dị ứng hải sản')).toBeNull();
    expect(screen.getByText('VNPAY')).toBeDefined();
    expect(screen.getByText('VNPAY-20260910-884920')).toBeDefined();
  });

  it('hides the payment, coupon and ticket blocks when the BE returns null for them', () => {
    const unpaid: BookingDetailView = {
      ...cancellableBooking,
      payment: null,
      paidAmount: 0,
      coupon: null,
      ticket: null,
    };
    render(<TestDrawerHarness booking={unpaid} />);

    expect(screen.queryByText(bookingEn.detail.transactionRef + ':')).toBeNull();
    expect(screen.queryByText(new RegExp(bookingEn.detail.couponUsed))).toBeNull();
    expect(screen.queryByText(bookingEn.detail.ticketCode + ':')).toBeNull();
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
    const unrefundedCancelled: BookingDetailView = {
      ...cancellableBooking,
      status: 'Cancelled',
      cancelReason: 'Customer requested cancellation',
      cancelledAtUtc: '2026-09-10T08:00:00Z',
      refund: undefined,
    };
    render(<TestDrawerHarness booking={unrefundedCancelled} />);

    expect(screen.getByText(/Refund follow-up: Report 3 V2 contains conflicting requirements/i)).toBeDefined();
  });

  it('4. Existing cancelled fixture without reason type: BookingDetailPanel renders safely without crashing', () => {
    const legacyCancelled: BookingDetailView = {
      ...cancellableBooking,
      status: 'Cancelled',
      cancelReason: 'Legacy free-text reason without enum type',
      cancellationReasonType: undefined,
      cancelledAtUtc: '2026-09-10T08:00:00Z',
    };
    render(<TestDrawerHarness booking={legacyCancelled} />);

    expect(screen.getByText('Legacy free-text reason without enum type')).toBeDefined();
    expect(screen.queryByText(/CUSTOMER_REQUEST/i)).toBeNull();
  });

  it('5. Detail panel: stored type code maps to English resource label (raw code not shown)', () => {
    const typedCancelled: BookingDetailView = {
      ...cancellableBooking,
      status: 'Cancelled',
      cancellationReasonType: 'TOUR_ITINERARY_CHANGE',
      cancelReason: 'Road landslide forced itinerary adjustment',
      cancelledAtUtc: '2026-09-10T08:00:00Z',
    };
    render(<TestDrawerHarness booking={typedCancelled} />);

    expect(screen.getByText('Tour itinerary change')).toBeDefined();
    expect(screen.getByText('Road landslide forced itinerary adjustment')).toBeDefined();
    expect(screen.queryByText('TOUR_ITINERARY_CHANGE')).toBeNull();
  });
});

describe('BookingDetailPanel loading and error states (UC-40 detail endpoint)', () => {
  const summary = toDemoListItem(INITIAL_DEMO_BOOKINGS[0]);

  function renderPanel(props: Partial<React.ComponentProps<typeof BookingDetailPanel>> = {}) {
    return render(
      <BookingDetailPanel
        open={true}
        booking={null}
        summary={summary}
        loadState="loading"
        isDemo={false}
        onClose={vi.fn()}
        onOpenCancelDialog={vi.fn()}
        onOpenRefundDialog={vi.fn()}
        {...props}
      />
    );
  }

  it('shows the list-row basics immediately with a skeleton instead of the detail sections while loading', () => {
    renderPanel();

    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-busy')).toBe('true');
    expect(screen.getByText(/BK-20260919-0141/)).toBeDefined();
    expect(screen.getByText('Ba Na Hills full-day tour')).toBeDefined();
    expect(screen.getByRole('status', { name: bookingEn.detail.loading })).toBeDefined();
    // detail-only sections are not shown yet
    expect(screen.queryByText(/Participant List/i)).toBeNull();
    expect(screen.queryByText(/Payment Information/i)).toBeNull();
    expect(screen.queryByText('Trần Thị Mai')).toBeNull();
  });

  it('keeps both actions disabled while loading', () => {
    renderPanel({ isDemo: true });

    expect((screen.getByRole('button', { name: /Cancel Booking/i }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: /Initiate Refund/i }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('shows the failure message with a Retry button that calls onRetry, still without detail sections', () => {
    const onRetry = vi.fn();
    renderPanel({ loadState: 'error', errorMessage: 'System encountered an error. Please try again later.', onRetry });

    expect(screen.getByRole('alert').textContent).toContain('System encountered an error');
    expect(screen.getByText(/BK-20260919-0141/)).toBeDefined();
    expect(screen.queryByText(/Participant List/i)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: bookingEn.list.retryBtn }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect((screen.getByRole('button', { name: /Cancel Booking/i }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('does not offer Retry when no handler is given and still closes on the close button', () => {
    const onClose = vi.fn();
    renderPanel({ loadState: 'error', errorMessage: 'Access denied.', onClose });

    expect(screen.queryByRole('button', { name: bookingEn.list.retryBtn })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: bookingEn.detail.closeBtn }));
    expect(onClose).toHaveBeenCalled();
  });

  it('renders nothing when ready without a booking', () => {
    renderPanel({ loadState: 'ready', booking: null });

    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
