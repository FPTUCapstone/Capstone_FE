import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { TourOperatorApplicationDetailDto } from '@/types/tour-operator-application';
import { ApplicationHeader } from './ApplicationHeader';
import { ApproveModal } from './ApproveModal';
import { RejectModal } from './RejectModal';
import { TourOperatorApplicationDetailView } from './TourOperatorApplicationDetailView';

const api = vi.hoisted(() => ({
  fetchDetail: vi.fn(),
  approve: vi.fn(),
  reject: vi.fn(),
}));

vi.mock('../api/tourOperatorApplicationApi', async () => {
  class ApiError extends Error {
    constructor(public statusCode: number, public errorCode: string, message: string) {
      super(message);
    }
  }
  return {
    ApiError,
    fetchOperatorApplicationDetail: api.fetchDetail,
    approveOperatorApplication: api.approve,
    rejectOperatorApplication: api.reject,
  };
});

const pendingApplication: TourOperatorApplicationDetailDto = {
  userId: 3,
  role: 'TourOperator',
  accountStatus: 'PendingApproval',
  applicationStatus: 'PendingApproval',
  companyName: 'Hoi An Travel',
  taxCode: '0401998877',
  businessLicenseNumber: 'GP-2024-9988',
  documents: [{
    documentId: 3,
    documentType: 'BusinessLicense',
    fileUrl: 'https://example.test/licence.pdf',
    status: 'Submitted',
    uploadedAt: '2026-09-09T08:10:00Z',
  }],
  reviewedBy: null,
  reviewedAt: null,
  rejectionReason: null,
};

beforeEach(() => {
  api.fetchDetail.mockReset();
  api.approve.mockReset();
  api.reject.mockReset();
});

describe('UC-50 application review routing and feedback', () => {
  it('allows approval with a Business License even when no Tax Code document was uploaded', async () => {
    api.fetchDetail.mockResolvedValueOnce(pendingApplication);

    render(<TourOperatorApplicationDetailView userId={3} />);

    const approveButton = await screen.findByRole('button', { name: /approve application/i });
    expect((approveButton as HTMLButtonElement).disabled).toBe(false);
    expect(screen.queryByText(/missing tax code document/i)).toBeNull();
  });

  it('links back to the existing Admin dashboard and exposes the disabled approval reason', () => {
    render(
      <ApplicationHeader
        userId={3}
        companyName="Hoi An Travel"
        applicationStatus="PendingApproval"
        isMissingMandatory
        onOpenApprove={() => undefined}
        onOpenReject={() => undefined}
      />,
    );

    expect(screen.getByRole('link', { name: /back to admin console/i }).getAttribute('href')).toBe('/admin');
    expect((screen.getByRole('button', { name: /approve application/i }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/business license document is required before approval/i)).not.toBeNull();
  });

  it('shows product-safe connection feedback without exposing internal topology', async () => {
    api.fetchDetail.mockRejectedValueOnce(new TypeError('network failure'));
    render(<TourOperatorApplicationDetailView userId={3} />);

    const message = await screen.findByText('Could not reach the application service. Please try again.');
    expect(message).not.toBeNull();
    expect(document.body.textContent).not.toContain('localhost:5021');
  });

  it('refetches after a successful rejection and removes stale decision actions', async () => {
    api.fetchDetail
      .mockResolvedValueOnce(pendingApplication)
      .mockResolvedValueOnce({
        ...pendingApplication,
        accountStatus: 'Rejected',
        applicationStatus: 'Rejected',
        rejectionReason: 'Business licence could not be verified.',
        documents: pendingApplication.documents.map(document => ({ ...document, status: 'Rejected' as const })),
      });
    api.reject.mockResolvedValueOnce({
      userId: 3,
      accountStatus: 'Rejected',
      applicationStatus: 'Rejected',
      rejectionReason: 'Business licence could not be verified.',
      reviewedBy: 1,
      reviewedAt: '2026-10-09T03:00:00Z',
      message: 'Application rejected. Notification sent to operator.',
    });

    render(<TourOperatorApplicationDetailView userId={3} />);
    fireEvent.click(await screen.findByRole('button', { name: /reject application/i }));
    fireEvent.change(screen.getByLabelText('Reason for Rejection'), {
      target: { value: 'Business licence could not be verified.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /confirm rejection/i }));

    await waitFor(() => expect(api.fetchDetail).toHaveBeenCalledTimes(2));
    expect((await screen.findAllByText('Rejected')).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /approve application/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /reject application/i })).toBeNull();
    expect(screen.getByRole('status').textContent).toMatch(/application rejected/i);
    expect(screen.getByRole('status').textContent).not.toMatch(/MSG116/i);
  });
});

describe('UC-50 decision dialog accessibility', () => {
  function ApproveHarness() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>Open approve</button>
        <ApproveModal
          isOpen={open}
          userId={3}
          companyName="Hoi An Travel"
          onClose={() => setOpen(false)}
          onSuccess={() => setOpen(false)}
        />
      </>
    );
  }

  it('gives Approve a labelled modal, traps focus, closes on Escape, and restores focus', () => {
    render(<ApproveHarness />);
    const trigger = screen.getByRole('button', { name: 'Open approve' });
    trigger.focus();
    fireEvent.click(trigger);

    const dialog = screen.getByRole('dialog', { name: 'Approve Application' });
    const [cancel, confirm] = within(dialog).getAllByRole('button');
    expect(document.activeElement).toBe(cancel);
    confirm.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(cancel);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  function RejectHarness() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>Open reject</button>
        <RejectModal
          isOpen={open}
          userId={3}
          companyName="Hoi An Travel"
          onClose={() => setOpen(false)}
          onSuccess={() => setOpen(false)}
        />
      </>
    );
  }

  it('associates the rejection label and returns focus when Escape closes the dialog', () => {
    render(<RejectHarness />);
    const trigger = screen.getByRole('button', { name: 'Open reject' });
    trigger.focus();
    fireEvent.click(trigger);

    expect(screen.getByRole('dialog', { name: 'Reject Application' })).not.toBeNull();
    expect(document.activeElement).toBe(screen.getByLabelText('Reason for Rejection'));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});
