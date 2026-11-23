export type ApprovalOutcome = 'approved' | 'alreadyDecided';

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
