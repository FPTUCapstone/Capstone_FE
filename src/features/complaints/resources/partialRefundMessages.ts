/**
 * UC-75 Respond to Partial Refund Proposal (SRS §3.8.6.3, screen #97).
 *
 * MSG entries are copied verbatim from SRS §5.3 Application Messages; never edit their wording.
 * MSG164 is borrowed from §3.8.6.2 for the success toast (team decision G2).
 */
export const partialRefundMessages = {
  MSG126: "You do not have permission to access this function.",
  MSG127:
    "TripMate is temporarily unable to process your request. Please check your connection and try again.",
  MSG164: "Your response has been recorded.",
  MSG165: "The response period has closed. This request can no longer be answered.",
  notFound: "No partial refund proposal was found for this complaint.",
} as const;

export const PARTIAL_REFUND_ERROR_CODES = {
  notFound: "complaint.not_found",
  forbidden: "complaint.partial_refund.forbidden",
  responseClosed: "complaint.partial_refund.response_closed",
  invalidDecision: "INVALID_DECISION",
  unauthenticated: "UNAUTHENTICATED",
  unavailable: "PARTIAL_REFUND_UNAVAILABLE",
} as const;
