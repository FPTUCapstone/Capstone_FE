export type ComplaintDecisionAction = 'RequestEvidence' | 'Reject' | 'RefundFull' | 'RefundPartial';
export interface StaffComplaintItem {
  complaintId: number; bookingId: number; bookingCode: string; tourTitle: string;
  status: string; refundableAmount: number; submittedAtUtc: string;
}
export interface StaffComplaintDetail extends StaffComplaintItem {
  reasonCategory: string; reasonDetail: string; rowVersion: string;
  evidence: { id: number; fileName: string; contentType: string; byteLength: number; uploadedAtUtc: string }[];
  negotiationHistory: { id: number; round: number; actor: string; eventType: string; amount: number | null; reason: string | null; occurredAtUtc: string }[];
  reviewHistory: { id: number; action: string; reason: string; contractBasis: string; amount: number | null; targetParty: string | null; createdAtUtc: string; actorUserId: number | null; dueAtUtc?: string | null; requestEventId?: number | null }[];
  allowedActions: string[];
}
export interface StaffComplaintList { items: StaffComplaintItem[]; totalCount: number; page: number; pageSize: number }
export const decisionLabels: Record<ComplaintDecisionAction, string> = {
  RequestEvidence: 'Yêu cầu bổ sung bằng chứng', Reject: 'Từ chối khiếu nại',
  RefundFull: 'Hoàn toàn bộ', RefundPartial: 'Hoàn một phần',
};
export function complaintStatusLabel(status: string): string {
  return ({ AwaitingStaffReview: 'Chờ Staff xem xét', AwaitingStaffEvidence: 'Chờ bổ sung bằng chứng', Approved: 'Đã quyết định hoàn', Rejected: 'Đã từ chối', AwaitingEvidence: 'Chờ bổ sung bằng chứng',
    AwaitingTravelerEvidence: 'Chờ bằng chứng từ khách', AwaitingOperatorEvidence: 'Chờ bằng chứng từ TO',
    StaffRejected: 'Đã từ chối', RefundProcessing: 'Đang hoàn tiền', Resolved: 'Đã giải quyết',
    ResolvedFullRefund: 'Đã quyết định hoàn toàn bộ', ResolvedPartialRefund: 'Đã quyết định hoàn một phần',
  } as Record<string, string>)[status] ?? status;
}
