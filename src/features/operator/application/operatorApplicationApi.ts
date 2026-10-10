export type OperatorApplicationStatus = 'Rejected' | 'PendingApproval' | 'Approved';

export interface OperatorApplicationDocument {
  documentId: number;
  documentType: 'BusinessLicense' | 'Other';
  status: 'Submitted' | 'Approved' | 'Rejected';
  uploadedAtUtc: string;
  downloadUrl: string | null;
  downloadUrlExpiresAtUtc: string | null;
}

export interface OperatorApplication {
  userId: number;
  userStatus: string;
  approvalStatus: OperatorApplicationStatus;
  companyName: string;
  businessLicenseNo: string;
  taxCode: string;
  businessAddress: string | null;
  contactPerson: string;
  contactPhone: string | null;
  rejectionReason: string | null;
  reviewedAtUtc: string | null;
  resubmissionCount: number;
  documents: OperatorApplicationDocument[];
}

export interface ResubmitOperatorInput {
  companyName: string;
  businessLicenseNo: string;
  taxCode: string;
  contactPerson: string;
  businessAddress?: string;
  contactPhone?: string;
  businessLicenseDocument?: File;
  supportingDocuments: File[];
}

export interface ResubmitOperatorResult {
  userId: number;
  userStatus: 'PendingApproval';
  approvalStatus: 'PendingApproval';
  updatedAtUtc: string;
  messageCode: 'MSG162';
  message: string;
  resubmissionCount: number;
}

export class OperatorApplicationError extends Error {
  constructor(
    public readonly status: number,
    public readonly code?: string,
    public readonly fields: Record<string, string> = {},
  ) {
    super('Operator application request failed.');
  }
}

function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown> : null;
}

function parseErrors(value: unknown): Record<string, string> {
  const source = object(value);
  if (!source) return {};
  return Object.fromEntries(Object.entries(source).flatMap(([key, item]) => {
    const code = Array.isArray(item) ? item[0] : item;
    return typeof code === 'string' ? [[key, code]] : [];
  }));
}

async function responseBody(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

function assertApplication(value: unknown): OperatorApplication {
  const data = object(value);
  if (!data || !Number.isSafeInteger(data.userId) ||
      !['Rejected', 'PendingApproval', 'Approved'].includes(String(data.approvalStatus)) ||
      typeof data.companyName !== 'string' || typeof data.businessLicenseNo !== 'string' ||
      typeof data.taxCode !== 'string' || typeof data.contactPerson !== 'string' ||
      !Number.isSafeInteger(data.resubmissionCount) || !Array.isArray(data.documents)) {
    throw new OperatorApplicationError(503, 'INVALID_RESPONSE');
  }
  return data as unknown as OperatorApplication;
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      credentials: 'same-origin',
      cache: 'no-store',
      signal: init?.signal ?? AbortSignal.timeout(30_000),
    });
  } catch {
    throw new OperatorApplicationError(503, 'NETWORK');
  }
  const body = await responseBody(response);
  if (!response.ok) {
    const error = object(body);
    throw new OperatorApplicationError(
      response.status,
      typeof error?.errorCode === 'string' ? error.errorCode : undefined,
      parseErrors(error?.errors),
    );
  }
  return body;
}

export async function getOperatorApplication(signal?: AbortSignal): Promise<OperatorApplication> {
  return assertApplication(await request('/api/operator/application', { signal }));
}

export async function resubmitOperatorApplication(
  input: ResubmitOperatorInput,
  signal?: AbortSignal,
): Promise<ResubmitOperatorResult> {
  const form = new FormData();
  form.append('companyName', input.companyName.trim());
  form.append('businessLicenseNo', input.businessLicenseNo.trim());
  form.append('taxCode', input.taxCode.trim());
  form.append('contactPerson', input.contactPerson.trim());
  if (input.businessAddress?.trim()) form.append('businessAddress', input.businessAddress.trim());
  if (input.contactPhone?.trim()) form.append('contactPhone', input.contactPhone.trim());
  if (input.businessLicenseDocument) form.append('businessLicenseDocument', input.businessLicenseDocument);
  for (const document of input.supportingDocuments) form.append('supportingDocuments', document);

  const body = object(await request('/api/operator/application/resubmit', {
    method: 'PUT', body: form, signal,
  }));
  if (!body || body.userStatus !== 'PendingApproval' ||
      body.approvalStatus !== 'PendingApproval' || body.messageCode !== 'MSG162') {
    throw new OperatorApplicationError(503, 'INVALID_RESPONSE');
  }
  return body as unknown as ResubmitOperatorResult;
}
