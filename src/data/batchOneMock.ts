export type OperatorApplicationStatus = 'pending' | 'rejected' | 'approved';

export const MOCK_REQUEST_DELAY_MS = 450;

export const mockOperatorApplication = {
  id: 'APP-2026-09102',
  submittedAt: '24 August 2026',
  reviewedAt: '26 August 2026, 14:30',
  resubmissionCount: 0,
  companyName: 'Han River Travel Co., Ltd',
  businessLicenceNumber: 'BL-0401998877',
  taxCode: '0401998877',
  businessAddress: '02 Nguyen Van Linh, Da Nang',
  contactPerson: 'Nguyen Thanh Ha',
  contactPhone: '0236 388 1234',
  rejectionReason: 'The Business Licence document is no longer valid. Replace it and review the company address.',
  documents: [
    { id: 'business-licence', name: 'Business Licence document', status: 'Correction requested' },
    { id: 'representative-id', name: 'Representative identity document', status: 'Current' },
  ],
} as const;

export async function simulateMockRequest() {
  await new Promise((resolve) => setTimeout(resolve, MOCK_REQUEST_DELAY_MS));
}
