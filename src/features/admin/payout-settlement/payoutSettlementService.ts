import {
  parseAuthorizeResult,
  parseSettlementDetail,
  parseSettlementQueue,
  serializeSettlementSearch,
  type AuthorizeResult,
  type SettlementDetail,
  type SettlementQueue,
  type SettlementSearch,
} from './payoutSettlement';

const BASE = '/api/admin/payout-settlements';

export class PayoutSettlementError extends Error {
  constructor(
    public readonly status: number,
    public readonly errorCode?: string,
    public readonly errorMessage?: string,
    public readonly currentStatus?: string,
  ) {
    super('Unable to process the payout settlement request.');
    this.name = 'PayoutSettlementError';
  }
}

const stringField = (body: unknown, name: string): string | undefined => {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return undefined;
  const value = (body as Record<string, unknown>)[name];
  return typeof value === 'string' ? value : undefined;
};

function failureFrom(response: Response, body: unknown): PayoutSettlementError {
  return new PayoutSettlementError(
    response.status,
    stringField(body, 'errorCode'),
    stringField(body, 'title'),
    stringField(body, 'currentStatus'),
  );
}

async function request<T>(
  url: string,
  init: RequestInit,
  parse: (body: unknown) => T,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new PayoutSettlementError(0);
  }

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) throw failureFrom(response, body);
  try {
    return parse(body);
  } catch {
    throw new PayoutSettlementError(0);
  }
}

export function fetchSettlementQueue(search: SettlementSearch, signal?: AbortSignal): Promise<SettlementQueue> {
  const query = serializeSettlementSearch(search).toString();
  return request(`${BASE}${query ? `?${query}` : ''}`, { signal }, parseSettlementQueue);
}

export function fetchSettlementDetail(payoutId: string, signal?: AbortSignal): Promise<SettlementDetail> {
  return request(`${BASE}/${encodeURIComponent(payoutId)}`, { signal }, parseSettlementDetail);
}

export function authorizeSettlement(payoutId: string, signal?: AbortSignal): Promise<AuthorizeResult> {
  return request(
    `${BASE}/${encodeURIComponent(payoutId)}/authorize`,
    { method: 'POST', signal },
    parseAuthorizeResult,
  );
}
