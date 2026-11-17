import { hotelProviderVi } from '../resources/vi';
import { hotelProviderEn } from '../resources/en';

const ERROR_CODES: Record<string, keyof typeof hotelProviderVi.messages> = {
  'ServiceProviderRequest.Forbidden': 'MSG126',
  'ServiceProviderRequest.NotFound': 'MSG126',
  'ServiceProviderRequest.InvalidInput': 'MSG143',
  'ServiceProviderRequest.InvalidState': 'MSG133',
  'ServiceProviderRequest.VersionConflict': 'MSG133',
  'ServiceProviderRequest.IdempotencyMismatch': 'MSG133',
  'CommissionStatement.Forbidden': 'MSG126',
  'CommissionStatement.NotFound': 'MSG126',
  'CommissionStatement.InvalidInput': 'MSG143',
  'CommissionStatement.InvalidState': 'MSG133',
  'CommissionStatement.MissingBankReference': 'MSG172',
  'CommissionStatement.AlreadyPaid': 'MSG133',
  'CommissionStatement.SystemError': 'MSG127',
};

export class WorkflowError extends Error {
  constructor(public readonly code = 'MSG127', public readonly status = 0) {
    const key = ERROR_CODES[code] ?? code;
    const message = hotelProviderVi.messages[key as keyof typeof hotelProviderVi.messages] ??
                    hotelProviderEn.messages[key as keyof typeof hotelProviderEn.messages];
    super(typeof message === 'string' ? message : hotelProviderVi.messages.MSG127);
  }
}

export async function workflowRequest(path: string, init: RequestInit = {}): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(path, { ...init, credentials: 'same-origin', cache: 'no-store' });
  } catch { throw new WorkflowError(); }
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new WorkflowError(body?.errorCode ?? 'MSG127', response.status);
  if (!body || typeof body !== 'object' || body.success !== true || !('data' in body)) throw new WorkflowError();
  return body.data;
}

export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new WorkflowError();
  return value as Record<string, unknown>;
}
