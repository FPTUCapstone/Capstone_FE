const MAX_MESSAGE_LENGTH = 300;
const RAW_MESSAGE_CODE = /^msg-?\d+$/i;
const MARKUP = /[<>]/;

/**
 * Returns the Backend-provided decision message when it is plain, readable text. A missing,
 * empty, overlong, markup-like or raw message-code value returns null so the caller uses its
 * own English fallback copy.
 */
export function usableDecisionMessage(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_MESSAGE_LENGTH) return null;
  if (RAW_MESSAGE_CODE.test(trimmed) || MARKUP.test(trimmed)) return null;
  return trimmed;
}

export function approvalDecisionMessage(result: { accountStatus: string; message: unknown }, companyName: string): string {
  if (result.accountStatus === 'PendingContractSignature') return 'Application approved. Waiting for the operator to sign the contract before account activation.';
  return usableDecisionMessage(result.message) ?? `Tour Operator "${companyName}" approved.`;
}
