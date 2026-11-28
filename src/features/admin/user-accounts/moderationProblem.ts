export function readOutstandingAmountVnd(problem: unknown): number | null {
  if (
    !problem || typeof problem !== 'object'
    || !('messageCode' in problem) || problem.messageCode !== 'MSG199'
    || !('outstandingAmountVnd' in problem) || typeof problem.outstandingAmountVnd !== 'number'
    || !Number.isFinite(problem.outstandingAmountVnd) || problem.outstandingAmountVnd < 0
  ) {
    return null;
  }

  return problem.outstandingAmountVnd;
}
