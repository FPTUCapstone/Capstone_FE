import type { BookingDto } from '../types/bookingLifecycle';

export interface DemoBookingRefundPreview {
  refundableAmount: number;
  deductionAmount: number;
  policyApplied: string;
  eligible: boolean;
}

/**
 * DEMO-ONLY FIXTURE POLICY (UC-41 / UC-42 UI review only).
 * The "100% refund before 24h cutoff" rule is a deterministic Demo fixture calculation
 * used exclusively for non-production UI preview.
 * In production, the browser NEVER calculates authoritative monetary refund amounts locally;
 * production flows must display Backend-calculated refund policy and amounts (BR-107).
 */
export function calculateDemoBookingRefundPreview(booking: BookingDto): DemoBookingRefundPreview {
  if (booking.paidAmount <= 0) {
    return {
      refundableAmount: 0,
      deductionAmount: 0,
      policyApplied: 'Chưa thanh toán — Không phát sinh hoàn tiền (Demo fixture)',
      eligible: false,
    };
  }

  if (booking.cancellationWindowExpired) {
    return {
      refundableAmount: 0,
      deductionAmount: booking.paidAmount,
      policyApplied: 'Đã quá hạn hủy theo chính sách (< 24 giờ trước giờ khởi hành — Demo fixture)',
      eligible: false,
    };
  }

  // Demo fixture policy: 100% refund for cancellations prior to the 24h cutoff window
  return {
    refundableAmount: booking.paidAmount,
    deductionAmount: 0,
    policyApplied: 'Hoàn 100% khi hủy trước ngày khởi hành ít nhất 24 giờ (Chính sách mẫu Demo)',
    eligible: true,
  };
}
