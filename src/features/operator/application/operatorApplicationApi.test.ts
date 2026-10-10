import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  getOperatorApplication,
  resubmitOperatorApplication,
  type OperatorApplication,
  type ResubmitOperatorInput,
} from './operatorApplicationApi';

const mockApplication = (): OperatorApplication => ({
  userId: 12,
  userStatus: 'Rejected',
  approvalStatus: 'Rejected',
  companyName: 'Đà Nẵng Discovery',
  businessLicenseNo: '79-0123/2026/TCDL-GPLHQT',
  taxCode: '0101234567',
  businessAddress: '123 Trần Phú, Đà Nẵng',
  contactPerson: 'Nguyễn Văn A',
  contactPhone: '0987654321',
  rejectionReason: 'Scan bị mờ, không đọc được số giấy phép.',
  reviewedAtUtc: '2026-10-05T08:30:00Z',
  resubmissionCount: 0,
  documents: [
    {
      documentId: 101,
      documentType: 'BusinessLicense',
      status: 'Rejected',
      uploadedAtUtc: '2026-10-01T10:00:00Z',
      downloadUrl: 'https://cdn.example.com/doc/101',
      downloadUrlExpiresAtUtc: '2026-10-08T10:00:00Z',
    },
  ],
});

const mockInput = (licenseFile?: File): ResubmitOperatorInput => ({
  companyName: 'Đà Nẵng Discovery Mới',
  businessLicenseNo: '79-0123/2026/TCDL-GPLHQT',
  taxCode: '0101234567',
  contactPerson: 'Nguyễn Văn B',
  businessAddress: '456 Lê Duẩn, Đà Nẵng',
  contactPhone: '0912345678',
  businessLicenseDocument: licenseFile,
  supportingDocuments: [],
});

afterEach(() => vi.unstubAllGlobals());

describe('operatorApplicationApi', () => {
  describe('getOperatorApplication', () => {
    it('fetches and returns the operator application successfully', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockApplication(),
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await getOperatorApplication();
      expect(result.userId).toBe(12);
      expect(result.approvalStatus).toBe('Rejected');
      expect(result.documents).toHaveLength(1);

      const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('/api/operator/application');
      expect(options.credentials).toBe('same-origin');
    });

    it('throws OperatorApplicationError on 401 unauthenticated', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ errorCode: 'UNAUTHENTICATED' }),
      }));

      await expect(getOperatorApplication()).rejects.toMatchObject({
        status: 401,
        code: 'UNAUTHENTICATED',
      });
    });

    it('throws OperatorApplicationError on 403 forbidden', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ errorCode: 'FORBIDDEN' }),
      }));

      await expect(getOperatorApplication()).rejects.toMatchObject({
        status: 403,
        code: 'FORBIDDEN',
      });
    });

    it('throws OperatorApplicationError on 404 not found', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ errorCode: 'operator.application_not_found' }),
      }));

      await expect(getOperatorApplication()).rejects.toMatchObject({
        status: 404,
        code: 'operator.application_not_found',
      });
    });

    it('throws OperatorApplicationError 503 on network failure', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

      await expect(getOperatorApplication()).rejects.toMatchObject({
        status: 503,
        code: 'NETWORK',
      });
    });

    it('throws OperatorApplicationError 503 on invalid response schema', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ invalid: 'schema' }),
      }));

      await expect(getOperatorApplication()).rejects.toMatchObject({
        status: 503,
        code: 'INVALID_RESPONSE',
      });
    });
  });

  describe('resubmitOperatorApplication', () => {
    it('submits form without file when keeping old license and returns 200 result', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          userId: 12,
          userStatus: 'PendingApproval',
          approvalStatus: 'PendingApproval',
          updatedAtUtc: '2026-10-08T10:00:00Z',
          messageCode: 'MSG162',
          message: 'Application resubmitted successfully.',
          resubmissionCount: 1,
        }),
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await resubmitOperatorApplication(mockInput(undefined));
      expect(result.approvalStatus).toBe('PendingApproval');
      expect(result.messageCode).toBe('MSG162');

      const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('/api/operator/application/resubmit');
      expect(options.method).toBe('PUT');

      const form = options.body as FormData;
      expect(form.get('companyName')).toBe('Đà Nẵng Discovery Mới');
      expect(form.get('taxCode')).toBe('0101234567');
      expect(form.has('businessLicenseDocument')).toBe(false);
    });

    it('submits replacement license file when provided', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          userId: 12,
          userStatus: 'PendingApproval',
          approvalStatus: 'PendingApproval',
          updatedAtUtc: '2026-10-08T10:00:00Z',
          messageCode: 'MSG162',
          message: 'Application resubmitted successfully.',
          resubmissionCount: 1,
        }),
      });
      vi.stubGlobal('fetch', fetchMock);

      const file = new File(['%PDF-new'], 'new-license.pdf', { type: 'application/pdf' });
      await resubmitOperatorApplication(mockInput(file));

      const form = (fetchMock.mock.calls[0][1] as RequestInit).body as FormData;
      expect(form.get('businessLicenseDocument')).toBe(file);
    });

    it('handles 409 MSG159 identifier conflict', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          errorCode: 'MSG159',
          errors: { taxCode: ['MSG159'] },
        }),
      }));

      await expect(resubmitOperatorApplication(mockInput())).rejects.toMatchObject({
        status: 409,
        code: 'MSG159',
        fields: { taxCode: 'MSG159' },
      });
    });

    it('handles 409 MSG161 application not rejected conflict', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ errorCode: 'MSG161' }),
      }));

      await expect(resubmitOperatorApplication(mockInput())).rejects.toMatchObject({
        status: 409,
        code: 'MSG161',
      });
    });

    it('handles 400 validation error with field codes', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          errorCode: 'auth.request_invalid',
          errors: {
            businessLicenseNo: ['OPERATOR_TRAVEL_LICENSE_INVALID'],
            taxCode: ['OPERATOR_TAX_CODE_INVALID'],
          },
        }),
      }));

      await expect(resubmitOperatorApplication(mockInput())).rejects.toMatchObject({
        status: 400,
        code: 'auth.request_invalid',
        fields: {
          businessLicenseNo: 'OPERATOR_TRAVEL_LICENSE_INVALID',
          taxCode: 'OPERATOR_TAX_CODE_INVALID',
        },
      });
    });
  });
});
