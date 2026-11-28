// Direct Operator Payment flow — DirectRefundCase lifecycle types.
// Maps to BE spec §3 (`direct-operator-payment-refund-spec.md`) and
// `GetDirectRefundCaseQuery` / related commands.

export const DIRECT_REFUND_STATUSES = [
  'AwaitingRecipient',
  'AwaitingTransfer',
  'AwaitingTravelerConfirmation',
  'Disputed',
  'Completed',
] as const;

export type DirectRefundStatus = (typeof DIRECT_REFUND_STATUSES)[number];

export const DIRECT_REFUND_SOURCE_TYPES = [
  'PolicyCancellation',
  'ToCancellation',
  'EmergencyEvent',
  'PostTripComplaint',
] as const;

export type DirectRefundSourceType = (typeof DIRECT_REFUND_SOURCE_TYPES)[number];

export const DIRECT_REFUND_COMPLETION_METHODS = [
  'TravelerConfirmed',
  'AutoExpired',
  'AdminResolved',
] as const;

export type DirectRefundCompletionMethod = (typeof DIRECT_REFUND_COMPLETION_METHODS)[number];

export const DIRECT_REFUND_ACTIONS = [
  'ConfirmRecipient',
  'ReportTransfer',
  'UploadEvidence',
  'RespondToTransfer',
  'ResolveDispute',
] as const;

export type DirectRefundAction = (typeof DIRECT_REFUND_ACTIONS)[number];

export type DirectRefundEvidenceSummary = {
  evidenceId: number;
  fileName: string;
  contentType: string;
  uploadedAtUtc: string;
};

export type DirectRefundTransferSummary = {
  transferId: number;
  reportedAmountVnd: number;
  bankReference: string;
  actualTransferredAtUtc: string;
  reportedAtUtc: string;
  confirmationDeadlineAtUtc: string;
  evidence: DirectRefundEvidenceSummary[];
};

/** Full case detail — shape of `GET /api/v1/traveler/direct-refunds/{caseId}` and
 * `GET /api/v1/operator/direct-refunds/{caseId}`. */
export type DirectRefundCase = {
  caseId: number;
  bookingId: number;
  bookingCode: string;
  sourceType: DirectRefundSourceType;
  refundAmountVnd: number;
  status: DirectRefundStatus;
  createdAtUtc: string;
  transferDeadlineAtUtc: string | null;
  completedAtUtc: string | null;
  completionMethod: DirectRefundCompletionMethod | null;
  // Recipient (shown when status ≥ AwaitingTransfer; account number masked to last 4)
  recipientBankCode: string | null;
  recipientAccountNumberMasked: string | null;
  recipientAccountHolder: string | null;
  // Active transfer (when status = AwaitingTravelerConfirmation or Disputed)
  pendingTransfer: DirectRefundTransferSummary | null;
  // Actions the authenticated caller may perform right now
  allowedActions: DirectRefundAction[];
  // Optimistic concurrency token (base64 rowVersion from BE)
  rowVersion: string;
  // Admin dispute resolution (set after admin acts on a Disputed case)
  disputeResolution: string | null;
  disputeResolutionReason: string | null;
  disputeResolvedAtUtc: string | null;
};

/** Response body from BFF: wraps the case with server-computed `serverNowUtc` for client
 * clock alignment (deadline countdown). */
export type DirectRefundCaseEnvelope = {
  serverNowUtc: string;
  case: DirectRefundCase;
};

// ── Parse helpers ───────────────────────────────────────────────────────────

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function isSafeInt(v: unknown): v is number { return typeof v === 'number' && Number.isSafeInteger(v); }
function isMoney(v: unknown): v is number { return typeof v === 'number' && Number.isFinite(v) && v >= 0; }
function isStr(v: unknown): v is string { return typeof v === 'string'; }
function isNullStr(v: unknown): v is string | null { return v === null || isStr(v); }

function parseEvidence(v: unknown): DirectRefundEvidenceSummary {
  if (!isRecord(v) || !isSafeInt(v.evidenceId) || !isStr(v.fileName) || !isStr(v.contentType) || !isStr(v.uploadedAtUtc))
    throw new Error('Invalid evidence summary.');
  return { evidenceId: v.evidenceId, fileName: v.fileName, contentType: v.contentType, uploadedAtUtc: v.uploadedAtUtc };
}

function parseTransfer(v: unknown): DirectRefundTransferSummary {
  if (
    !isRecord(v) ||
    !isSafeInt(v.transferId) ||
    !isMoney(v.reportedAmountVnd) ||
    !isStr(v.bankReference) ||
    !isStr(v.actualTransferredAtUtc) ||
    !isStr(v.reportedAtUtc) ||
    !isStr(v.confirmationDeadlineAtUtc) ||
    !Array.isArray(v.evidence)
  ) throw new Error('Invalid transfer summary.');
  return {
    transferId: v.transferId,
    reportedAmountVnd: v.reportedAmountVnd,
    bankReference: v.bankReference,
    actualTransferredAtUtc: v.actualTransferredAtUtc,
    reportedAtUtc: v.reportedAtUtc,
    confirmationDeadlineAtUtc: v.confirmationDeadlineAtUtc,
    evidence: v.evidence.map(parseEvidence),
  };
}

export function parseDirectRefundCase(v: unknown): DirectRefundCase {
  if (
    !isRecord(v) ||
    !isSafeInt(v.caseId) ||
    !isSafeInt(v.bookingId) ||
    !isStr(v.bookingCode) ||
    !isStr(v.sourceType) ||
    !isMoney(v.refundAmountVnd) ||
    !isStr(v.status) ||
    !isStr(v.createdAtUtc) ||
    !isNullStr(v.transferDeadlineAtUtc) ||
    !isNullStr(v.completedAtUtc) ||
    !isNullStr(v.completionMethod) ||
    !isNullStr(v.recipientBankCode) ||
    !isNullStr(v.recipientAccountNumberMasked) ||
    !isNullStr(v.recipientAccountHolder) ||
    !(v.pendingTransfer === null || isRecord(v.pendingTransfer)) ||
    !Array.isArray(v.allowedActions) ||
    !isStr(v.rowVersion)
  ) throw new Error('Invalid direct refund case.');

  return {
    caseId: v.caseId,
    bookingId: v.bookingId,
    bookingCode: v.bookingCode,
    sourceType: v.sourceType as DirectRefundSourceType,
    refundAmountVnd: v.refundAmountVnd,
    status: v.status as DirectRefundStatus,
    createdAtUtc: v.createdAtUtc,
    transferDeadlineAtUtc: v.transferDeadlineAtUtc,
    completedAtUtc: v.completedAtUtc,
    completionMethod: v.completionMethod as DirectRefundCompletionMethod | null,
    recipientBankCode: v.recipientBankCode,
    recipientAccountNumberMasked: v.recipientAccountNumberMasked,
    recipientAccountHolder: v.recipientAccountHolder,
    pendingTransfer: v.pendingTransfer ? parseTransfer(v.pendingTransfer) : null,
    allowedActions: v.allowedActions.filter((a): a is DirectRefundAction => isStr(a)),
    rowVersion: v.rowVersion,
    disputeResolution: isNullStr(v.disputeResolution) ? v.disputeResolution : null,
    disputeResolutionReason: isNullStr(v.disputeResolutionReason) ? v.disputeResolutionReason : null,
    disputeResolvedAtUtc: isNullStr(v.disputeResolvedAtUtc) ? v.disputeResolvedAtUtc : null,
  };
}

export function parseDirectRefundCaseEnvelope(v: unknown): DirectRefundCaseEnvelope {
  if (!isRecord(v) || !isStr(v.serverNowUtc) || !isRecord(v.case))
    throw new Error('Invalid direct refund case envelope.');
  return { serverNowUtc: v.serverNowUtc, case: parseDirectRefundCase(v.case) };
}

// ── Formatting helpers ──────────────────────────────────────────────────────

export const formatVnd = (n: number): string =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

export const formatDt = (iso: string | null): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' :
    new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(d);
};

export function sourceLabel(source: DirectRefundSourceType): string {
  switch (source) {
    case 'PolicyCancellation': return 'Policy cancellation';
    case 'ToCancellation': return 'Tour operator cancellation';
    case 'EmergencyEvent': return 'Emergency event';
    case 'PostTripComplaint': return 'Post-trip complaint';
  }
}

export function completionLabel(method: DirectRefundCompletionMethod | null): string {
  switch (method) {
    case 'TravelerConfirmed': return 'Confirmed by you';
    case 'AutoExpired': return 'Auto-completed after 72 hours';
    case 'AdminResolved': return 'Resolved by TripMate';
    default: return '—';
  }
}
