import { parsePayoutDetail, type PayoutDetail } from './payoutDetails';

export class PayoutDetailsError extends Error {
  constructor(
    public readonly status: number,
    public readonly errorCode?: string,
    public readonly errorMessage?: string,
  ) {
    super('Unable to load the payout details.');
    this.name = 'PayoutDetailsError';
  }
}

export async function fetchPayoutDetails(
  payoutId: string,
  signal?: AbortSignal,
): Promise<PayoutDetail> {
  let response: Response;
  try {
    response = await fetch(`/api/admin/payouts/${encodeURIComponent(payoutId)}`, {
      signal,
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new PayoutDetailsError(0);
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const code = body && typeof body === 'object' && typeof (body as { errorCode?: unknown }).errorCode === 'string'
      ? (body as { errorCode: string }).errorCode
      : undefined;
    const message = body && typeof body === 'object' && typeof (body as { title?: unknown }).title === 'string'
      ? (body as { title: string }).title
      : undefined;
    throw new PayoutDetailsError(response.status, code, message);
  }
  try {
    return parsePayoutDetail(body);
  } catch {
    throw new PayoutDetailsError(0);
  }
}
