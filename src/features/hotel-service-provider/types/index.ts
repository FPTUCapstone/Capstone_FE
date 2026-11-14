/**
 * TypeScript Type Definitions for TripMate Hotel & Commercial Service Provider Workflow
 * Grounded in Canonical SRS Report 3 (§3.6.3 - §3.6.7, §3.9.1.5).
 */

export type BookingRequestStatus =
  | 'PendingConfirmation'
  | 'Confirmed'
  | 'Rejected'
  | 'Cancelled'
  | 'Expired'
  | 'Completed'
  | 'NoShow';

export type StatementStatus =
  | 'Issued'
  | 'PaymentReported'
  | 'Paid'
  | 'Overdue';

export type ServiceCategory =
  | 'Hotel'
  | 'VehicleRental'
  | 'Restaurant';

export interface BookingRequestItem {
  id: string;
  requestCode: string;
  serviceId: number;
  serviceName: string;
  serviceOption: string;
  requestedDate: string; // YYYY-MM-DD
  requestedTime: string; // HH:mm
  quantity: number;
  travelerName: string;
  travelerPhone: string;
  travelerEmail: string;
  specialRequests?: string;
  status: BookingRequestStatus;
  estimatedAmount: number;
  actualAmount?: number;
  commissionAmount?: number;
  rejectionReason?: string;
  submittedAt: string; // ISO 8601
  decidedAt?: string;
  outcomeRecordedAt?: string;
  outcomeRecordedBy?: string;
}

export interface BookingFilterParams {
  status?: BookingRequestStatus | 'All';
  startDate?: string;
  endDate?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface CompletedBookingBreakdown {
  id: string;
  bookingCode: string;
  roomOption: string;
  guestName: string;
  checkoutDate: string;
  actualAmount: number;
  commissionAmount: number;
}

export interface StatementItem {
  id: string;
  statementCode: string;
  providerId: number;
  providerName: string;
  period: string; // e.g. "11/2026"
  periodStartDate: string;
  periodEndDate: string;
  completedCount: number;
  totalRevenue: number;
  commissionAmount: number;
  dueDate: string;
  status: StatementStatus;
  bankReference?: string;
  reportedAt?: string;
  confirmedAt?: string;
  confirmedByStaffId?: number;
  breakdown?: CompletedBookingBreakdown[];
}

export interface StatementFilterParams {
  providerId?: string | 'All';
  period?: string | 'All';
  status?: StatementStatus | 'All';
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface CommercialPoiItem {
  id: number;
  code: string;
  name: string;
  category: string;
  address: string;
  status: 'Active' | 'Inactive';
  isLinkedToOtherProvider?: boolean;
}

export interface CreateServiceProviderPayload {
  businessName: string;
  serviceCategory: ServiceCategory;
  representativeFullName: string;
  email: string;
  phone: string;
  linkedPoiIds: number[];
}

export interface CreateServiceProviderResult {
  success: boolean;
  providerId?: number;
  emailDispatched?: boolean;
  errorCode?: string;
  errorMessage?: string;
}

export interface DecisionPayload {
  action: 'Confirm' | 'Reject';
  rejectionReason?: string;
}

export interface OutcomePayload {
  outcome: 'Completed' | 'NoShow';
  actualAmount?: number;
}

export interface ReportPaymentPayload {
  statementId: string;
  bankReference: string;
}

export interface ConfirmReceiptPayload {
  statementId: string;
  staffId: number;
  verifiedAt: string;
}
