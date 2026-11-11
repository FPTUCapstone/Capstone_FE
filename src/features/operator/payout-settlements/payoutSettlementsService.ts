import {
  parsePayoutSettlementsResponse,
  type PayoutSettlementsResponse,
} from './payoutSettlements';

/** Thrown on a non-ok response or a network/abort failure — same shape as the admin side's
 * `PayoutSettlementsError`, kept as its own class because the operator and admin payout-
 * settlements features are separate slices that do not import each other's service layer
 * (only the shared, pure parsing module above is reused). */
export class OperatorPayoutSettlementsError extends Error {
  constructor(
    public readonly status: number,
    public readonly errorCode: string | undefined,
    title: string,
  ) {
    super(title);
    this.name = 'OperatorPayoutSettlementsError';
  }
}

function problemOf(body: unknown, fallback: string): { title: string; errorCode?: string } {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return { title: fallback };
  const record = body as Record<string, unknown>;
  const title = typeof record.title === 'string' ? record.title : fallback;
  const errorCode = typeof record.errorCode === 'string' ? record.errorCode : undefined;
  return errorCode ? { title, errorCode } : { title };
}

/** Scoped to the signed-in Tour Operator by the backend (`currentUserService.UserId`); no
 * operator id is passed from here. Malformed bodies are never treated as success: a 200 whose
 * body does not match the strict shape throws from the parser below, same as a non-ok status. */
export async function fetchOperatorPayoutSettlementHistory(
  pageNumber = 1,
  pageSize = 20,
  signal?: AbortSignal,
): Promise<PayoutSettlementsResponse> {
  // The backend's OperatorPayoutSettlementsController.GetHistory binds `page`, not `pageNumber`
  // (unlike the admin side's GetPayoutSettlementsQuery, which does use `pageNumber`) — matching
  // the BFF proxy's own allow-listed query fields (payoutSettlementsProxy.ts, Task 3).
  const query = new URLSearchParams();
  if (pageNumber > 1) query.set('page', String(pageNumber));
  if (pageSize !== 20) query.set('pageSize', String(pageSize));
  const suffix = query.toString() ? `?${query}` : '';

  let response: Response;
  try {
    response = await fetch(`/api/operator/payout-settlements${suffix}`, {
      method: 'GET',
      signal,
      cache: 'no-store',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new OperatorPayoutSettlementsError(0, undefined, 'The payout settlement history could not be reached.');
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const problem = problemOf(body, 'The payout settlement history could not be loaded.');
    throw new OperatorPayoutSettlementsError(response.status, problem.errorCode, problem.title);
  }
  return parsePayoutSettlementsResponse(body);
}
