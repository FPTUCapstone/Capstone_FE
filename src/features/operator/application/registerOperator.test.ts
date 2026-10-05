import { afterEach, describe, expect, it, vi } from 'vitest';

import { registerOperator, type OperatorRegistrationInput } from './registerOperator';

const input = (): OperatorRegistrationInput => ({
  firebaseIdToken: 'firebase-token',
  email: 'operator@example.com',
  password: 'Password123!',
  confirmPassword: 'Password123!',
  companyName: 'Operator Co',
  businessLicenseNo: 'LIC-1',
  taxCode: 'TAX-1',
  contactPerson: 'Operator Name',
  businessAddress: '',
  contactPhone: '',
  businessLicenseDocument: new File(['%PDF-test'], 'licence.pdf', { type: 'application/pdf' }),
  supportingDocuments: [new File(['%PDF-extra'], 'extra.pdf', { type: 'application/pdf' })],
  acceptTerms: true,
});

afterEach(() => vi.unstubAllGlobals());

describe('registerOperator', () => {
  it('posts the exact multipart contract without a bearer header or manual content type', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ success: true, data: { userId: 42, applicationStatus: 'PendingApproval', messageCode: 'MSG08' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(registerOperator(input())).resolves.toEqual({
      userId: 42, applicationStatus: 'PendingApproval', messageCode: 'MSG08',
    });
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toMatch(/\/api\/v1\/auth\/register\/operator$/);
    expect(options.method).toBe('POST');
    expect(options.headers).toBeUndefined();
    const body = options.body as FormData;
    expect([...body.keys()]).toEqual([
      'firebaseIdToken', 'email', 'password', 'confirmPassword', 'companyName',
      'businessLicenseNo', 'taxCode', 'contactPerson', 'businessLicenseDocument',
      'supportingDocuments', 'acceptTerms',
    ]);
    expect(body.get('firebaseIdToken')).toBe('firebase-token');
    expect(body.get('businessLicenseDocument')).toBeInstanceOf(File);
  });

  it('keeps field codes from RFC-7807 validation responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ errorCode: 'auth.request_invalid', errors: { businessLicenseDocument: ['MSG158'] } }),
    }));
    await expect(registerOperator(input())).rejects.toMatchObject({
      status: 400, code: 'auth.request_invalid', fields: { businessLicenseDocument: 'MSG158' },
    });
  });

  it('keeps the business conflict code while discarding unsafe server text', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ errorCode: 'MSG159', title: 'Internal DB hostname: sql-prod' }),
    }));
    await expect(registerOperator(input())).rejects.toMatchObject({ status: 409, code: 'MSG159' });
  });
});
