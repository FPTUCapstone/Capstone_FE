/**
 * `draft*` variants are TM-82 §5.4 outcomes (a DraftVersion row's own decision) — kept distinct
 * from the first-time-submission `approved`/`alreadyDecided` so the queue banner never claims
 * "Tour approved" for a decision that only applied a draft version's changes.
 */
export type ApprovalOutcome = 'approved' | 'alreadyDecided' | 'draftApproved' | 'draftAlreadyDecided';

let pending: { token: string; outcome: ApprovalOutcome; expires: number } | undefined;

export function rememberApprovalOutcome(outcome: ApprovalOutcome): string {
  const token = crypto.randomUUID();
  pending = { token, outcome, expires: Date.now() + 30_000 };
  return token;
}

export function takeApprovalOutcome(token: string): ApprovalOutcome | null {
  if (!pending || pending.token !== token) return null;
  const { outcome, expires } = pending;
  pending = undefined;
  return expires > Date.now() ? outcome : null;
}
