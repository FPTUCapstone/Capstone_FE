export type BookingRequestStatus = 'PendingConfirmation' | 'Confirmed' | 'Rejected' | 'Cancelled' | 'Expired' | 'Completed' | 'NoShow';
export type ServiceCategory = 'Hotel' | 'VehicleRental' | 'Restaurant';

export interface BookingRequestItem {
  id: string;
  requestCode: string;
  serviceId: number;
  serviceName: string;
  serviceOption: string;
  requestedDate: string;
  requestedTime: string;
  quantity: number;
  travelerName: string;
  travelerPhone?: string;
  travelerEmail?: string;
  specialRequests?: string;
  status: BookingRequestStatus;
  estimatedAmount: number;
  actualAmount?: number;
  commissionAmount?: number;
  rejectionReason?: string;
  submittedAt?: string;
  decidedAt?: string;
  outcomeRecordedAt?: string;
  outcomeRecordedBy?: string;
  responseDeadlineUtc?: string;
  outcomeAvailableAtUtc?: string;
  autoCompleteAtUtc?: string;
  rowVersion: string;
}

export interface BookingFilterParams {
  status?: BookingRequestStatus | 'All';
  startDate?: string;
  endDate?: string;
  keyword?: string;
  page?: number;
  pageSize?: number;
}
export interface CommercialPoiItem {
  code?: string;
  address?: string;
  status?: 'Active' | 'Inactive';
  isLinkedToOtherProvider?: boolean;
  id: number;
  name: string;
  category: string;
}
export interface CreateStaffPayload {
  fullName: string;
  email: string;
  phoneNumber: string;
}
export interface CreateServiceProviderPayload extends CreateStaffPayload {
  businessName: string;
  category: ServiceCategory;
  linkedPoiIds: number[];
}
export interface ProvisionedAccount {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: 'Staff' | 'ServiceProvider';
  status: 'Active';
  mustChangePassword: boolean;
  serviceProviderId?: number;
  linkedPoiIds: number[];
  emailDeliveryStatus: string;
}
export interface CreateServiceProviderResult {
  success: boolean;
  account?: ProvisionedAccount;
  errorCode?: string;
  errorMessage?: string;
}
export interface DecisionPayload {
  decision: 'Confirmed' | 'Rejected';
  reason?: string;
  rowVersion: string;
}
export interface OutcomePayload {
  outcome: 'Completed' | 'NoShow';
  actualAmount?: number;
  rowVersion: string;
}

export type StatementStatus =
  | 'Issued'
  | 'PaymentReported'
  | 'Paid'
  | 'Overdue';

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

export interface ReportPaymentPayload {
  statementId: string;
  bankReference: string;
}

export interface ConfirmReceiptPayload {
  statementId: string;
  staffId: number;
  verifiedAt: string;
}
