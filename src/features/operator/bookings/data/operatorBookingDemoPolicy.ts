import type {
  BookingDetailDto,
  BookingStatus,
  CancelBlockedReason,
  CheckInStatus,
} from '../types/bookingLifecycle';

export interface DemoBookingRefundPreview {
  refundableAmount: number;
  deductionAmount: number;
  policyApplied: string;
  eligible: boolean;
}

/**
 * DEMO-ONLY FIXTURE POLICY (UC-41 / UC-42 UI review only).
 * In production the browser NEVER calculates authoritative monetary refund amounts locally;
 * production flows must display Backend-calculated refund policy and amounts (BR-107).
 * UC-41 as built applies no time window to a Tour Operator, so the demo preview has none either.
 */
export function calculateDemoBookingRefundPreview(
  booking: Pick<BookingDetailDto, 'paidAmount'>
): DemoBookingRefundPreview {
  if (booking.paidAmount <= 0) {
    return {
      refundableAmount: 0,
      deductionAmount: 0,
      policyApplied: 'Unpaid — No refund applicable (Demo fixture)',
      eligible: false,
    };
  }

  // Demo fixture policy: operator-initiated cancellation refunds the full paid amount.
  return {
    refundableAmount: booking.paidAmount,
    deductionAmount: 0,
    policyApplied: '100% refund for operator cancellation (Demo fixture policy)',
    eligible: true,
  };
}

export interface DemoCancelEligibility {
  canCancel: boolean;
  cancelBlockedReason: CancelBlockedReason | null;
}

/**
 * DEMO-ONLY mirror of the BE UC-41 operator rule used to fill `canCancel` / `cancelBlockedReason`
 * for fixture bookings: only PendingPayment and Confirmed bookings without a check-in can be
 * cancelled, and the status is checked before the check-in. Live mode reads these from the BE.
 */
export function evaluateDemoCancelEligibility(
  status: BookingStatus,
  checkInStatus: CheckInStatus
): DemoCancelEligibility {
  if (status !== 'PendingPayment' && status !== 'Confirmed') {
    return { canCancel: false, cancelBlockedReason: 'InvalidStatus' };
  }
  if (checkInStatus === 'CheckedIn') {
    return { canCancel: false, cancelBlockedReason: 'CheckedIn' };
  }
  return { canCancel: true, cancelBlockedReason: null };
}
