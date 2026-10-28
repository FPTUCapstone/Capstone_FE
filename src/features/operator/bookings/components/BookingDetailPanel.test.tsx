import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BookingDetailPanel } from './BookingDetailPanel';
import { INITIAL_DEMO_BOOKINGS } from '../data/operatorBookingDemoFixtures';
import type {
  BookingDto,
  BookingRefundStatusDto,
  GetBookingRefundStatusResult,
  RefundStatusValue,
} from '../types/bookingLifecycle';
import { getBookingRefundStatus } from '../services/operatorBookingService';

vi.mock('../services/operatorBookingService', () => ({
  getBookingRefundStatus: vi.fn(),
}));

const mockedGetBookingRefundStatus = vi.mocked(getBookingRefundStatus);

const cancellableBooking = INITIAL_DEMO_BOOKINGS[0]; // BK-20260919-0141 (Confirmed, paid)
const checkedInBooking = INITIAL_DEMO_BOOKINGS[1]; // BK-20260912-0148 (CheckedIn)
const refundedDemoBooking = INITIAL_DEMO_BOOKINGS[4]; // BK-20260820-0110 (Cancelled, demo refund rf-0110)

function TestDrawerHarness({
  booking = cancellableBooking,
  isDemo = true,
  onOpenCancel = vi.fn(),
}: {
  booking?: BookingDto;
  isDemo?: boolean;
  onOpenCancel?: (b: BookingDto) => void;
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
      />
    </div>
  );
}

function cancelledBookingFixture(overrides: Partial<BookingDto> = {}): BookingDto {
  return {
    ...cancellableBooking,
    status: 'Cancelled',
    cancellationReason: 'Customer requested cancellation',
    cancelledAt: '2026-09-10T08:00:00Z',
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  mockedGetBookingRefundStatus.mockReset();
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

  it('disables Cancel action in production mode (NO_BACKEND) but there is no Initiate Refund action anywhere', () => {
    render(<TestDrawerHarness booking={cancellableBooking} isDemo={false} />);

    const cancelBtn = screen.getByRole('button', {
      name: /Cancel Booking/i,
    });
    expect(cancelBtn.getAttribute('disabled')).toBeDefined();
    expect(screen.queryByRole('button', { name: /Initiate Refund/i })).toBeNull();
  });

  it('closes drawer on Escape key', () => {
    render(<TestDrawerHarness booking={cancellableBooking} />);

    expect(screen.getByRole('dialog')).toBeDefined();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('4. Existing cancelled fixture without reason type: BookingDetailPanel renders safely without crashing', () => {
    mockedGetBookingRefundStatus.mockResolvedValue({ outcome: 'not_applicable' });
    const legacyCancelled: BookingDto = cancelledBookingFixture({
      cancellationReason: 'Legacy free-text reason without enum type',
      cancellationReasonType: undefined,
    });
    render(<TestDrawerHarness booking={legacyCancelled} />);

    expect(screen.getByText('Legacy free-text reason without enum type')).toBeDefined();
    expect(screen.queryByText(/CUSTOMER_REQUEST/i)).toBeNull();
  });

  it('5. Detail panel: stored type code maps to English resource label (raw code not shown)', () => {
    mockedGetBookingRefundStatus.mockResolvedValue({ outcome: 'not_applicable' });
    const typedCancelled: BookingDto = cancelledBookingFixture({
      cancellationReasonType: 'TOUR_ITINERARY_CHANGE',
      cancellationReason: 'Road landslide forced itinerary adjustment',
    });
    render(<TestDrawerHarness booking={typedCancelled} />);

    expect(screen.getByText('Tour itinerary change')).toBeDefined();
    expect(screen.getByText('Road landslide forced itinerary adjustment')).toBeDefined();
    expect(screen.queryByText('TOUR_ITINERARY_CHANGE')).toBeNull();
  });
});

function foundResult(
  status: RefundStatusValue,
  overrides: Partial<BookingRefundStatusDto> = {}
): GetBookingRefundStatusResult {
  return {
    outcome: 'found',
    data: {
      bookingId: cancellableBooking.id,
      bookingCode: cancellableBooking.bookingCode,
      refundAmount: 10000,
      status,
      gatewayReference: null,
      attemptCount: 1,
      requestedAtUtc: '2026-10-26T01:14:16Z',
      processedAtUtc: null,
      nextAttemptAtUtc: null,
      lastErrorCode: null,
      ...overrides,
    },
  };
}

describe('BookingDetailPanel — live refund status (UC-42/UC-71, real Backend, isDemo=false)', () => {
  it('does not fetch refund status for a non-Cancelled booking', () => {
    render(<TestDrawerHarness booking={cancellableBooking} isDemo={false} />);
    expect(mockedGetBookingRefundStatus).not.toHaveBeenCalled();
  });

  it('shows a loading indicator while the refund status fetch is pending', async () => {
    let resolveFetch: (value: GetBookingRefundStatusResult) => void = () => {};
    mockedGetBookingRefundStatus.mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
    );

    render(<TestDrawerHarness booking={cancelledBookingFixture()} isDemo={false} />);

    expect(await screen.findByText(/Loading refund status/i)).toBeDefined();
    resolveFetch({ outcome: 'not_applicable' });
  });

  it('renders the Pending status', async () => {
    mockedGetBookingRefundStatus.mockResolvedValue(foundResult('Pending'));

    render(<TestDrawerHarness booking={cancelledBookingFixture()} isDemo={false} />);

    expect(await screen.findByText(/Queued for processing/i)).toBeDefined();
  });

  it('renders the Processing status', async () => {
    mockedGetBookingRefundStatus.mockResolvedValue(foundResult('Processing'));

    render(<TestDrawerHarness booking={cancelledBookingFixture()} isDemo={false} />);

    expect(await screen.findByText(/^Processing$/i)).toBeDefined();
  });

  it('renders the Processed status with amount, gateway reference and processed-at time', async () => {
    mockedGetBookingRefundStatus.mockResolvedValue(
      foundResult('Processed', {
        gatewayReference: 'MOCK-REFUND-9-1792977260581',
        processedAtUtc: '2026-10-26T01:14:20Z',
      })
    );

    render(<TestDrawerHarness booking={cancelledBookingFixture()} isDemo={false} />);

    expect(mockedGetBookingRefundStatus).toHaveBeenCalledWith(cancellableBooking.id);
    expect(await screen.findByText(/Refunded/i)).toBeDefined();
    expect(screen.getByText(/MOCK-REFUND-9-1792977260581/i)).toBeDefined();
    expect(screen.getAllByText(/10.000/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Processed At/i)).toBeDefined();
  });

  it('renders the RetryPending status with the next attempt time', async () => {
    mockedGetBookingRefundStatus.mockResolvedValue(
      foundResult('RetryPending', {
        nextAttemptAtUtc: '2026-10-26T01:20:00Z',
        lastErrorCode: 'payment.refund.gateway_unavailable',
      })
    );

    render(<TestDrawerHarness booking={cancelledBookingFixture()} isDemo={false} />);

    expect(await screen.findByText(/Queued for processing/i)).toBeDefined();
    expect(screen.getByText(/Next Attempt/i)).toBeDefined();
  });

  it('renders the Failed status with the last error code', async () => {
    mockedGetBookingRefundStatus.mockResolvedValue(
      foundResult('Failed', { attemptCount: 3, lastErrorCode: 'payment.refund.gateway_rejected' })
    );

    render(<TestDrawerHarness booking={cancelledBookingFixture()} isDemo={false} />);

    expect(await screen.findByText(/Refund failed/i)).toBeDefined();
    expect(screen.getByText(/payment.refund.gateway_rejected/i)).toBeDefined();
  });

  it('renders the ManualReview status', async () => {
    mockedGetBookingRefundStatus.mockResolvedValue(
      foundResult('ManualReview', { lastErrorCode: 'payment.refund.manual_review_required' })
    );

    render(<TestDrawerHarness booking={cancelledBookingFixture()} isDemo={false} />);

    expect(await screen.findByText(/Awaiting manual settlement/i)).toBeDefined();
  });

  it('renders the Rejected status', async () => {
    mockedGetBookingRefundStatus.mockResolvedValue(
      foundResult('Rejected', { lastErrorCode: 'payment.refund.original_payment_invalid' })
    );

    render(<TestDrawerHarness booking={cancelledBookingFixture()} isDemo={false} />);

    expect(await screen.findByText(/Refund rejected/i)).toBeDefined();
  });

  it('renders a neutral note (not an error) when there is no refund record', async () => {
    mockedGetBookingRefundStatus.mockResolvedValue({ outcome: 'not_applicable' });

    render(<TestDrawerHarness booking={cancelledBookingFixture()} isDemo={false} />);

    expect(await screen.findByText(/No refund record was found/i)).toBeDefined();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it.each(['MSG127', 'FORBIDDEN', 'UNAUTHENTICATED'])(
    'renders a generic error note on a %s fetch outcome',
    async (messageCode) => {
      mockedGetBookingRefundStatus.mockResolvedValue({ outcome: 'error', messageCode });

      render(<TestDrawerHarness booking={cancelledBookingFixture()} isDemo={false} />);

      await waitFor(() => {
        expect(screen.getByText(/refund status cannot be retrieved/i)).toBeDefined();
      });
    }
  );
});

describe('BookingDetailPanel — demo refund display (isDemo=true, no live fetch)', () => {
  it('never calls the real refund-status endpoint in demo mode', () => {
    render(<TestDrawerHarness booking={cancelledBookingFixture()} isDemo={true} />);
    expect(mockedGetBookingRefundStatus).not.toHaveBeenCalled();
  });

  it('shows the demo fixture refund data for a Cancelled booking that has one', () => {
    render(<TestDrawerHarness booking={refundedDemoBooking} isDemo={true} />);

    expect(screen.getByText(/REFUND-VNPAY-20260815-1100/i)).toBeDefined();
    expect(screen.queryByText(/No refund record was found/i)).toBeNull();
  });

  it('shows the neutral note for a Cancelled demo booking with no refund', () => {
    render(<TestDrawerHarness booking={cancelledBookingFixture({ refund: undefined })} isDemo={true} />);

    expect(screen.getByText(/No refund record was found/i)).toBeDefined();
  });
});

describe('BookingDetailPanel — spec 2026-10-29 additions', () => {
  it('labels demo refund data as demo, not as a live backend status', () => {
    render(<TestDrawerHarness booking={refundedDemoBooking} isDemo={true} />);
    expect(screen.getByText(/Demo data/i)).toBeDefined();
  });

  it('refresh button re-fetches status for a Pending refund', async () => {
    mockedGetBookingRefundStatus.mockResolvedValue(foundResult('Pending'));
    render(<TestDrawerHarness booking={cancelledBookingFixture()} isDemo={false} />);
    const refresh = await screen.findByRole('button', { name: /Refresh status/i });
    mockedGetBookingRefundStatus.mockResolvedValue(foundResult('Processed'));
    fireEvent.click(refresh);
    await waitFor(() => {
      expect(mockedGetBookingRefundStatus).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByText(/Refunded/i)).toBeDefined();
  });

  it('does not show refresh for a terminal status', async () => {
    mockedGetBookingRefundStatus.mockResolvedValue(foundResult('Processed'));
    render(<TestDrawerHarness booking={cancelledBookingFixture()} isDemo={false} />);
    await screen.findByText(/Refunded/i);
    expect(screen.queryByRole('button', { name: /Refresh status/i })).toBeNull();
  });
});
