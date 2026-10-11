import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ResubmitApplicationForm } from './ResubmitApplicationForm';
import {
  getOperatorApplication,
  OperatorApplicationError,
  resubmitOperatorApplication,
  type OperatorApplication,
} from './operatorApplicationApi';
import { webRefresh } from '@/lib/authApi';

const router = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => router,
}));

vi.mock('@/lib/authApi', () => ({
  webRefresh: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./operatorApplicationApi', async (original) => {
  const actual = await original<typeof import('./operatorApplicationApi')>();
  return {
    ...actual,
    getOperatorApplication: vi.fn(),
    resubmitOperatorApplication: vi.fn(),
  };
});

const mockRejectedApp = (): OperatorApplication => ({
  userId: 12,
  userStatus: 'Rejected',
  approvalStatus: 'Rejected',
  companyName: 'Công Ty Du Lịch Miền Trung',
  businessLicenseNo: '79-0123/2026/TCDL-GPLHQT',
  taxCode: '0101234567',
  businessAddress: '123 Nguyễn Văn Linh, Đà Nẵng',
  contactPerson: 'Trần Văn C',
  contactPhone: '0901234567',
  rejectionReason: 'Scan giấy phép bị mờ, không đọc được.',
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

describe('ResubmitApplicationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getOperatorApplication).mockResolvedValue(mockRejectedApp());
    vi.mocked(resubmitOperatorApplication).mockResolvedValue({
      userId: 12,
      userStatus: 'PendingApproval',
      approvalStatus: 'PendingApproval',
      updatedAtUtc: '2026-10-08T10:00:00Z',
      messageCode: 'MSG162',
      message: 'Application resubmitted successfully.',
      resubmissionCount: 1,
    });
  });

  it('renders prefilled form data from existing rejected application', async () => {
    render(<ResubmitApplicationForm />);

    expect(await screen.findByDisplayValue('Công Ty Du Lịch Miền Trung')).toBeDefined();
    expect(screen.getByDisplayValue('79-0123/2026/TCDL-GPLHQT')).toBeDefined();
    expect(screen.getByDisplayValue('0101234567')).toBeDefined();
    expect(screen.getByDisplayValue('Trần Văn C')).toBeDefined();
    expect(screen.getByText('Scan giấy phép bị mờ, không đọc được.')).toBeDefined();
    expect(screen.getByText(/Leave empty to submit the latest existing licence for review again/)).toBeDefined();
  });

  it('redirects to partner application page if application is not in Rejected state', async () => {
    vi.mocked(getOperatorApplication).mockResolvedValue({
      ...mockRejectedApp(),
      approvalStatus: 'PendingApproval',
    });

    render(<ResubmitApplicationForm />);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/partner/application');
    });
    expect(screen.queryByDisplayValue('Công Ty Du Lịch Miền Trung')).toBeNull();
  });

  it('submits successfully keeping existing rejected license without uploading new file', async () => {
    render(<ResubmitApplicationForm />);
    await screen.findByDisplayValue('Công Ty Du Lịch Miền Trung');

    fireEvent.click(screen.getByRole('button', { name: 'Resubmit Application' }));

    await waitFor(() => {
      expect(resubmitOperatorApplication).toHaveBeenCalledWith(expect.objectContaining({
        companyName: 'Công Ty Du Lịch Miền Trung',
        businessLicenseNo: '79-0123/2026/TCDL-GPLHQT',
        taxCode: '0101234567',
        contactPerson: 'Trần Văn C',
        businessLicenseDocument: undefined,
        supportingDocuments: [],
      }));
    });

    expect(webRefresh).toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/partner/application?resubmitted=1');
    expect(router.refresh).toHaveBeenCalled();
  });

  it('submits replacement license file when picked', async () => {
    render(<ResubmitApplicationForm />);
    await screen.findByDisplayValue('Công Ty Du Lịch Miền Trung');

    const file = new File(['%PDF-new'], 'new-license.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/Replacement Business Licence \(optional\)/);
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(screen.getByRole('button', { name: 'Resubmit Application' }));

    await waitFor(() => {
      expect(resubmitOperatorApplication).toHaveBeenCalledWith(expect.objectContaining({
        businessLicenseDocument: file,
      }));
    });
  });

  it('validates required fields when emptied', async () => {
    render(<ResubmitApplicationForm />);
    await screen.findByDisplayValue('Công Ty Du Lịch Miền Trung');

    fireEvent.change(screen.getByRole('textbox', { name: 'Company Name' }), { target: { value: '   ' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Contact Person' }), { target: { value: '' } });

    fireEvent.click(screen.getByRole('button', { name: 'Resubmit Application' }));

    expect(await screen.findAllByText('This field is required.')).toHaveLength(2);
    expect(resubmitOperatorApplication).not.toHaveBeenCalled();
  });

  it('validates format of tax code and travel licence', async () => {
    render(<ResubmitApplicationForm />);
    await screen.findByDisplayValue('Công Ty Du Lịch Miền Trung');

    fireEvent.change(screen.getByRole('textbox', { name: 'Tax Code' }), { target: { value: '123' } });
    fireEvent.change(screen.getByRole('textbox', { name: 'Business Licence Number' }), { target: { value: 'BAD-FORMAT' } });

    fireEvent.click(screen.getByRole('button', { name: 'Resubmit Application' }));

    expect(await screen.findByText(/Tax Code must be 10 digits/)).toBeDefined();
    expect(screen.getByText(/Travel Licence Number must follow/)).toBeDefined();
    expect(resubmitOperatorApplication).not.toHaveBeenCalled();
  });

  it('handles 409 MSG159 duplicate identifier error', async () => {
    vi.mocked(resubmitOperatorApplication).mockRejectedValue(
      new OperatorApplicationError(409, 'MSG159', { taxCode: 'MSG159' }),
    );

    render(<ResubmitApplicationForm />);
    await screen.findByDisplayValue('Công Ty Du Lịch Miền Trung');

    fireEvent.click(screen.getByRole('button', { name: 'Resubmit Application' }));

    expect(await screen.findByText('This tax code is already registered.')).toBeDefined();
    expect(screen.getByText('This business licence number or tax code is already registered.')).toBeDefined();
  });

  it('handles 409 MSG161 application state conflict by refreshing and redirecting', async () => {
    vi.mocked(resubmitOperatorApplication).mockRejectedValue(
      new OperatorApplicationError(409, 'MSG161'),
    );

    render(<ResubmitApplicationForm />);
    await screen.findByDisplayValue('Công Ty Du Lịch Miền Trung');

    fireEvent.click(screen.getByRole('button', { name: 'Resubmit Application' }));

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith('/partner/application');
    });
  });

  it('handles 503 safe infrastructure error', async () => {
    vi.mocked(resubmitOperatorApplication).mockRejectedValue(
      new OperatorApplicationError(503, 'MSG127'),
    );

    render(<ResubmitApplicationForm />);
    await screen.findByDisplayValue('Công Ty Du Lịch Miền Trung');

    fireEvent.click(screen.getByRole('button', { name: 'Resubmit Application' }));

    expect(await screen.findByText(/TripMate is temporarily unable to process your request/)).toBeDefined();
  });
});
