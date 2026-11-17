export type OperatorComplaintAction = 'AcceptFullRefund' | 'ProposePartialRefund' | 'Reject';

export interface OperatorComplaintListItem {
  complaintId: number;
  bookingId: number;
  bookingCode: string;
  tourTitle: string;
  status: string;
  reasonCategory: string;
  submittedAtUtc: string;
  responseDeadlineUtc: string;
  refundableAmount: number;
  evidenceCount: number;
}

export interface OperatorComplaintPage {
  items: OperatorComplaintListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface OperatorComplaintEvidence {
  evidenceId: number;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  temporaryDownloadUrl: string | null;
}

export interface OperatorComplaintDetail extends OperatorComplaintListItem {
  reasonDetail: string;
  travelerResponseDeadlineUtc: string | null;
  responseAction: OperatorComplaintAction | null;
  proposedRefundAmount: number | null;
  partialRefundProposalReason: string | null;
  partialRefundProposalRound: number;
  operatorReconsiderationDeadlineUtc: string | null;
  counterOfferAmount: number | null;
  counterOfferReason: string | null;
  rejectionReason: string | null;
  refundId: number | null;
  availableActions: OperatorComplaintAction[];
  evidence: OperatorComplaintEvidence[];
}

export interface ComplaintResponseResult {
  complaintId: number;
  status: string;
  responseAction: OperatorComplaintAction | null;
  refundableAmount: number;
  proposedRefundAmount: number | null;
  partialRefundProposalReason?: string | null;
  travelerResponseDeadlineUtc: string | null;
  refundId: number | null;
  isReplay: boolean;
}

export function formatVnd(value: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(value)} ₫`;
}

export function formatDateTime(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh',
  }).format(date);
}
