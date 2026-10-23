import type { BookingDto } from '../types/bookingLifecycle';

export interface DemoBookingRefundPreview {
  refundableAmount: number;
  deductionAmount: number;
  policyApplied: string;
  eligible: boolean;
}

/**
 * DEMO-ONLY FIXTURE POLICY (UC-41 / UC-42 UI review only).
 * Report 3 SRS V2 detailed UC-41 specifies "cancellation window defined by the policy"
 * without dictating a universal 24-hour cutoff. The policy evaluation below is exclusively
 * a deterministic Demo fixture rule for UI preview purposes.
 * In production, the browser NEVER calculates authoritative monetary refund amounts locally;
 * production flows must display Backend-calculated refund policy and amounts (BR-107).
 */
export function calculateDemoBookingRefundPreview(booking: BookingDto): DemoBookingRefundPreview {
  if (booking.paidAmount <= 0) {
    return {
      refundableAmount: 0,
      deductionAmount: 0,
      policyApplied: 'Unpaid — No refund applicable (Demo fixture)',
      eligible: false,
    };
  }

  if (booking.cancellationWindowExpired) {
    return {
      refundableAmount: 0,
      deductionAmount: booking.paidAmount,
      policyApplied: 'Cancellation deadline passed (Demo fixture policy cutoff)',
      eligible: false,
    };
  }

  // Demo fixture policy: 100% refund for cancellations prior to the policy cutoff window
  return {
    refundableAmount: booking.paidAmount,
    deductionAmount: 0,
    policyApplied: '100% refund when cancelled before policy cutoff (Demo fixture policy)',
    eligible: true,
  };
}
