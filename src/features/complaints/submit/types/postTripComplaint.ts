export const COMPLAINT_CATEGORIES = [
  'ItineraryNotAsAdvertised',
  'ServiceQuality',
  'GuideOrStaffConduct',
  'SafetyIssue',
  'ScheduleChangeOrDelay',
  'Other',
] as const;

export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];

export type ComplaintEvidence = Readonly<{
  fileName: string;
  contentType: string;
  sizeBytes: number;
}>;

export type ExistingPostTripComplaint = Readonly<{
  complaintId: string;
  status: string;
  reasonCategory: ComplaintCategory;
  reasonDetail: string;
  submittedAtUtc: string;
  responseDeadlineUtc: string;
  evidence: readonly ComplaintEvidence[];
}>;

export type PostTripComplaintContext = Readonly<{
  bookingId: string;
  bookingCode: string | null;
  tourTitle: string | null;
  endAtUtc: string;
  submissionDeadlineUtc: string;
  canSubmit: boolean;
  ineligibilityReason: string | null;
  complaint: ExistingPostTripComplaint | null;
}>;

export type SubmitPostTripComplaintInput = Readonly<{
  reasonCategory: ComplaintCategory;
  reasonDetail: string;
  evidence: readonly File[];
}>;

export type SubmitPostTripComplaintResponse = Readonly<{
  complaintId: string;
  bookingId: string;
  status: 'AwaitingOperatorResponse';
  submittedAtUtc: string;
  responseDeadlineUtc: string;
  isReplay: boolean;
}>;

export class PostTripComplaintApiError extends Error {
  constructor(readonly status: number, readonly errorCode: string) {
    super(errorCode);
    this.name = 'PostTripComplaintApiError';
  }
}
