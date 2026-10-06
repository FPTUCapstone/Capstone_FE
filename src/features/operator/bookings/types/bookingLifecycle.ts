/**
 * Types and message contracts for Tour Operator Customer Bookings (UC-40, UC-41, UC-42).
 * Follows Report 3 SRS §3.8.4.1, §3.8.4.2, §3.8.4.3.
 */

export const OPERATOR_BOOKING_MESSAGES = {
  MSG126: 'Bạn không có quyền xem hoặc thao tác trên đơn đặt chỗ này.',
  MSG29: 'Khoảng thời gian không hợp lệ. Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.',
  MSG128: 'Không tìm thấy đơn đặt chỗ nào phù hợp với bộ lọc hiện tại.',
  MSG127: 'Hệ thống gặp sự cố. Vui lòng thử lại sau.',
  MSG123: 'Lý do hủy đơn không được để trống.',
  MSG133: 'Đơn đặt chỗ đã ở trạng thái đã hủy/hoàn thành hoặc yêu cầu hoàn tiền đã tồn tại.',
  MSG95: 'Khách hàng đã check-in tham gia tour, không thể hủy đơn đặt chỗ này.',
  MSG82: 'Đã quá thời hạn cho phép hủy đơn theo chính sách tour.',
  MSG81: 'Đã hủy đơn đặt chỗ thành công.',
  MSG83: 'Yêu cầu hoàn tiền đã được khởi tạo thành công.',
  MSG84: 'Đơn đặt chỗ chưa có giao dịch thanh toán hợp lệ hoặc không đủ điều kiện hoàn tiền.',
  MSG89: 'Cổng thanh toán phản hồi quá thời gian quy định.',
  MSG153: 'Khởi tạo hoàn tiền không thành công, đã xếp vào hàng đợi thử lại.',
  PENDING_BE_INTEGRATION: 'Tính năng Quản lý đơn đặt chỗ đang chờ tích hợp API từ Backend. Hiện chưa có dữ liệu từ máy chủ.',
} as const;

export type OperatorBookingMessageKey = keyof typeof OPERATOR_BOOKING_MESSAGES;

export type BookingStatus = 'Confirmed' | 'PendingPayment' | 'Cancelled' | 'Completed';

export type CheckInStatus = 'NotCheckedIn' | 'CheckedIn';

export type PaxType = 'Adult' | 'Child';

export interface ParticipantDto {
  id: string;
  fullName: string;
  paxType: PaxType;
  age?: number;
  specialNotes?: string;
}

/**
 * BR-77: Verified transaction information is READ ONLY and immutable.
 */
export interface PaymentTransactionDto {
  id: string;
  amount: number;
  paymentChannel: 'VNPay' | 'MoMo' | 'BankTransfer' | 'CreditCard';
  transactionReference: string;
  status: 'Success' | 'Pending' | 'Failed';
  paidAt?: string;
}

/**
 * BR-77 & BR-107: Refund is a separate record from the original transaction.
 * BR-74: Idempotent - repeated notifications/clicks must not duplicate records.
 * BR-134: Retry tracking.
 */
export interface BookingRefundDto {
  id: string;
  bookingId: string;
  refundableAmount: number;
  deductionAmount: number;
  policyApplied: string;
  paymentChannel: string;
  status: 'Pending' | 'Success' | 'Failed';
  gatewayReference?: string;
  attemptCount: number;
  notes?: string;
  createdAt: string;
}

export const CANCELLATION_REASONS = [
  { value: 'CUSTOMER_REQUEST', label: 'Khách hàng yêu cầu hủy' },
  { value: 'TOUR_ITINERARY_CHANGE', label: 'Lịch trình tour thay đổi' },
  { value: 'FORCE_MAJEURE', label: 'Điều kiện thời tiết / bất khả kháng' },
  { value: 'OTHER', label: 'Lý do khác' },
] as const;

export type CancellationReasonValue = (typeof CANCELLATION_REASONS)[number]['value'];

export interface BookingDto {
  id: string;
  bookingCode: string;
  tourId: string;
  tourName: string;
  operatorUserId: number; // For BR-105 ownership check
  departureDate: string; // ISO format
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  participantsCount: number;
  participants: ParticipantDto[];
  totalAmount: number;
  paidAmount: number;
  status: BookingStatus;
  checkInStatus: CheckInStatus;
  qrTicketValid: boolean; // BR-86
  cancellationWindowExpired?: boolean; // For MSG82 test cases
  coupon?: {
    code: string;
    discountAmount: number;
  };
  paymentTransaction?: PaymentTransactionDto;
  refund?: BookingRefundDto;
  cancellationReason?: string;
  cancelledAt?: string;
  createdAt: string;
}

export interface BookingFilterParams {
  tourId?: string;
  startDate?: string;
  endDate?: string;
  status?: BookingStatus | 'ALL';
  searchKeyword?: string;
  page?: number;
  pageSize?: number;
}

export interface BookingSummaryMetrics {
  totalBookings: number;
  totalParticipants: number;
  totalConfirmedAmount: number;
}

export interface BookingListResult {
  items: BookingDto[];
  summary: BookingSummaryMetrics;
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  pendingBackendNotice?: string;
  errorMessage?: string;
}

export interface CancelBookingPayload {
  reasonType: CancellationReasonValue;
  reasonDetail: string; // Required BR-106, MSG123 if empty
}

export interface CancelBookingResult {
  success: boolean;
  messageCode: string;
  message: string;
  booking?: BookingDto;
  refundTriggered?: boolean;
}

export interface InitiateRefundPayload {
  notes?: string;
  simulateFailureMode?: 'timeout' | 'retry' | 'system';
}

export interface InitiateRefundResult {
  success: boolean;
  messageCode: string;
  message: string;
  refund?: BookingRefundDto;
}
