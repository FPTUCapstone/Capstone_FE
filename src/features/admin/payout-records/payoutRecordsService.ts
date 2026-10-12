import {
  parsePayoutsResponse,
  serializePayoutsSearch,
  type PayoutsResponse,
  type PayoutsSearch,
} from './payoutRecords';

export class PayoutRecordsError extends Error {
  constructor(
    public readonly status: number,
    public readonly errorCode?: string,
    public readonly errorMessage?: string,
  ) {
    super('Unable to load payout records.');
    this.name = 'PayoutRecordsError';
  }
}

export async function fetchPayoutRecords(
  search: PayoutsSearch,
  signal?: AbortSignal,
): Promise<PayoutsResponse> {
  const query = serializePayoutsSearch(search);
  let response: Response;
  try {
    response = await fetch(`/api/admin/payouts${query.toString() ? `?${query.toString()}` : ''}`, {
      signal,
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new PayoutRecordsError(0);
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const code = body && typeof body === 'object' && 'errorCode' in body && typeof (body as { errorCode?: unknown }).errorCode === 'string'
      ? (body as { errorCode: string }).errorCode
      : undefined;
    const message = body && typeof body === 'object' && typeof (body as { title?: unknown }).title === 'string'
      ? (body as { title: string }).title
      : undefined;
    throw new PayoutRecordsError(response.status, code, message);
  }
  try {
    return parsePayoutsResponse(body);
  } catch {
    throw new PayoutRecordsError(0);
  }
}
