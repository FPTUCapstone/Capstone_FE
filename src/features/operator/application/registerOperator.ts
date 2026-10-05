import { getApiBase } from '@/lib/authApi';

export interface OperatorRegistrationInput {
  firebaseIdToken: string;
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  businessLicenseNo: string;
  taxCode: string;
  contactPerson: string;
  businessAddress?: string;
  contactPhone?: string;
  businessLicenseDocument: File;
  supportingDocuments: File[];
  acceptTerms: boolean;
}

export interface OperatorRegistrationResult {
  userId: number;
  applicationStatus: 'PendingApproval';
  messageCode: 'MSG08';
}

export class OperatorRegistrationError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string | undefined,
    public readonly fields: Record<string, string>,
  ) {
    super('Tour Operator registration failed.');
  }
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function fields(value: unknown): Record<string, string> {
  const source = record(value);
  if (!source) return {};
  const result: Record<string, string> = {};
  for (const [field, error] of Object.entries(source)) {
    const code = Array.isArray(error) ? error[0] : error;
    if (typeof code === 'string') result[field] = code;
  }
  return result;
}

export async function registerOperator(input: OperatorRegistrationInput): Promise<OperatorRegistrationResult> {
  const form = new FormData();
  form.append('firebaseIdToken', input.firebaseIdToken);
  form.append('email', input.email);
  form.append('password', input.password);
  form.append('confirmPassword', input.confirmPassword);
  form.append('companyName', input.companyName);
  form.append('businessLicenseNo', input.businessLicenseNo);
  form.append('taxCode', input.taxCode);
  form.append('contactPerson', input.contactPerson);
  if (input.businessAddress?.trim()) form.append('businessAddress', input.businessAddress.trim());
  if (input.contactPhone?.trim()) form.append('contactPhone', input.contactPhone.trim());
  form.append('businessLicenseDocument', input.businessLicenseDocument);
  for (const document of input.supportingDocuments) form.append('supportingDocuments', document);
  form.append('acceptTerms', String(input.acceptTerms));

  const response = await fetch(`${getApiBase()}/auth/register/operator`, { method: 'POST', body: form });
  let body: unknown;
  try { body = await response.json(); } catch { body = undefined; }
  const envelope = record(body);

  if (!response.ok) {
    throw new OperatorRegistrationError(
      response.status,
      typeof envelope?.errorCode === 'string' ? envelope.errorCode : undefined,
      fields(envelope?.errors),
    );
  }

  const data = record(envelope?.data);
  if (response.status !== 201 || envelope?.success !== true ||
      !data || !Number.isSafeInteger(data.userId) || data.applicationStatus !== 'PendingApproval' ||
      data.messageCode !== 'MSG08') {
    // The server may already have committed. The caller must retain Firebase identity.
    throw new Error('Ambiguous registration response.');
  }
  return data as unknown as OperatorRegistrationResult;
}
