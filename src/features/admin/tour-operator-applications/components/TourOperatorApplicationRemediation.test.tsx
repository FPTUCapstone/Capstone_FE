import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  OperatorDocumentDto,
  TourOperatorApplicationDetailDto,
} from '@/types/tour-operator-application';
import { tourOperatorApplicationEn as copy } from '../resources/en';
import { DocumentsGrid } from './DocumentsGrid';
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

const { ApiError } = await import('../api/tourOperatorApplicationApi');

const VIETNAMESE = /[ăâđêôơưĂÂĐÊÔƠƯàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/i;

const licence: OperatorDocumentDto = {
  documentId: 3,
  documentType: 'BusinessLicense',
  fileUrl: 'https://storage.example.test/licence.pdf',
  status: 'Submitted',
  uploadedAt: '2026-09-09T08:10:00Z',
};

const pendingApplication: TourOperatorApplicationDetailDto = {
  userId: 3,
  role: 'TourOperator',
  accountStatus: 'PendingApproval',
  applicationStatus: 'PendingApproval',
  companyName: 'Hoi An Travel',
  taxCode: '0401998877',
  businessLicenseNumber: 'GP-2024-9988',
  contactPhone: '0905123456',
  contactAddress: '12 Tran Phu, Hoi An',
  documents: [licence],
  reviewedBy: null,
  reviewedAt: null,
  rejectionReason: null,
};

const rejectedResult = {
  userId: 3,
  accountStatus: 'Rejected',
  applicationStatus: 'Rejected' as const,
  rejectionReason: 'Business licence could not be verified.',
  reviewedBy: 1,
  reviewedAt: '2026-10-09T03:00:00Z',
  message: 'Application rejected. Notification sent to operator.',
};

const approvedResult = {
  userId: 3,
  accountStatus: 'Active',
  applicationStatus: 'Approved' as const,
  reviewedBy: 1,
  reviewedAt: '2026-10-09T03:00:00Z',
  message: 'Tour Operator "Hoi An Travel" approved. Account activated.',
};

beforeEach(() => {
  api.fetchDetail.mockReset();
  api.approve.mockReset();
  api.reject.mockReset();
});

function renderRejectModal(onSuccess = vi.fn()) {
  render(
    <RejectModal isOpen userId={3} companyName="Hoi An Travel" onClose={() => undefined} onSuccess={onSuccess} />,
  );
  return {
    onSuccess,
    reason: screen.getByLabelText(copy.reject.reasonLabel) as HTMLTextAreaElement,
    confirm: screen.getByRole('button', { name: copy.reject.confirm }),
  };
}

describe('T1 — rejection reason validation (UC-51)', () => {
  it('caps the reason at the Backend limit and exposes an accessible character counter', () => {
    const { reason } = renderRejectModal();

    expect(reason.maxLength).toBe(500);
    const counter = screen.getByText(copy.reject.counter(0, 500));
    expect(reason.getAttribute('aria-describedby')).toContain(counter.id);

    fireEvent.change(reason, { target: { value: 'a'.repeat(120) } });
    expect(screen.getByText(copy.reject.counter(120, 500))).toBeTruthy();
  });

  it('rejects a whitespace-only reason without calling the Backend', () => {
    const { reason, confirm } = renderRejectModal();

    fireEvent.change(reason, { target: { value: '   \n  ' } });
    fireEvent.click(confirm);

    expect(api.reject).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toBe(copy.reject.reasonRequired);
    expect(reason.getAttribute('aria-invalid')).toBe('true');
  });

  it('rejects a reason longer than 500 characters without calling the Backend', () => {
    const { reason, confirm } = renderRejectModal();

    fireEvent.change(reason, { target: { value: 'a'.repeat(501) } });
    fireEvent.click(confirm);

    expect(api.reject).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toBe(copy.reject.reasonTooLong(500));
  });

  it('submits exactly 500 characters, trimmed, and passes the Backend result on', async () => {
    api.reject.mockResolvedValueOnce(rejectedResult);
    const { reason, confirm, onSuccess } = renderRejectModal();

    fireEvent.change(reason, { target: { value: `  ${'a'.repeat(500)}  ` } });
    fireEvent.click(confirm);

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(rejectedResult.message));
    expect(api.reject).toHaveBeenCalledWith(3, 'a'.repeat(500));
  });

  it('falls back to safe English copy when the Backend message is unusable', async () => {
    api.reject.mockResolvedValueOnce({ ...rejectedResult, message: 'MSG116' });
    const { reason, confirm, onSuccess } = renderRejectModal();

    fireEvent.change(reason, { target: { value: 'Licence expired.' } });
    fireEvent.click(confirm);

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(copy.reject.successFallback('Hoi An Travel')));
  });

  it('prevents a duplicate submission while the request is pending', async () => {
    let resolveReject: (value: typeof rejectedResult) => void = () => undefined;
    api.reject.mockReturnValueOnce(new Promise((resolve) => { resolveReject = resolve; }));
    const { reason, confirm, onSuccess } = renderRejectModal();

    fireEvent.change(reason, { target: { value: 'Licence expired.' } });
    fireEvent.click(confirm);
    fireEvent.submit(confirm.closest('form') as HTMLFormElement);
    fireEvent.click(confirm);

    expect(api.reject).toHaveBeenCalledTimes(1);
    expect((confirm as HTMLButtonElement).disabled).toBe(true);
    resolveReject(rejectedResult);
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1));
  });

  it.each([
    ['a server failure', new ApiError(503, 'X', 'The Tour Operator application service is unavailable.'), copy.errors.serviceUnavailable],
    ['a permission failure', new ApiError(403, 'X', 'Administrator access is not allowed.'), copy.errors.forbidden],
    ['an expired session', new ApiError(401, 'X', 'Administrator sign-in required.'), copy.errors.sessionExpired],
    ['an unconfirmed result', new ApiError(200, 'UNCONFIRMED_RESPONSE', 'x'), copy.errors.unconfirmed],
    ['a network failure', new TypeError('fetch failed'), copy.errors.network],
  ])('reports %s without claiming success', async (_label, failure, expected) => {
    api.reject.mockRejectedValueOnce(failure);
    const { reason, confirm, onSuccess } = renderRejectModal();

    fireEvent.change(reason, { target: { value: 'Licence expired.' } });
    fireEvent.click(confirm);

    expect((await screen.findByRole('alert')).textContent).toBe(expected);
    expect(onSuccess).not.toHaveBeenCalled();
  });

  it('shows a Backend validation message for a rejected request', async () => {
    api.reject.mockRejectedValueOnce(new ApiError(400, 'X', 'The application is not pending approval.'));
    const { reason, confirm } = renderRejectModal();

    fireEvent.change(reason, { target: { value: 'Licence expired.' } });
    fireEvent.click(confirm);

    expect((await screen.findByRole('alert')).textContent).toBe('The application is not pending approval.');
  });
});

describe('T2 — authoritative refresh after approval (UC-50)', () => {
  async function approve() {
    fireEvent.click(await screen.findByRole('button', { name: copy.header.approve }));
    const dialog = screen.getByRole('dialog', { name: copy.approve.title });
    fireEvent.click(within(dialog).getByRole('button', { name: copy.approve.confirm }));
  }

  it('reloads the application and renders only the Backend-returned state', async () => {
    api.fetchDetail
      .mockResolvedValueOnce(pendingApplication)
      .mockResolvedValueOnce({
        ...pendingApplication,
        accountStatus: 'Active',
        applicationStatus: 'Approved',
        reviewedBy: 1,
        reviewedAt: '2026-10-09T03:00:00Z',
        // The Backend still reports the document as Submitted; the UI must not invent Approved.
        documents: [licence],
      });
    api.approve.mockResolvedValueOnce(approvedResult);

    render(<TourOperatorApplicationDetailView userId={3} />);
    await approve();

    await waitFor(() => expect(api.fetchDetail).toHaveBeenCalledTimes(2));
    const heading = await screen.findByRole('heading', { name: 'Hoi An Travel' });
    expect(within(heading.parentElement as HTMLElement).getByText(copy.status.approved)).toBeTruthy();
    const documents = screen.getByRole('heading', { name: copy.documents.title }).closest('div.rounded-2xl') as HTMLElement;
    expect(within(documents).getByText(copy.documents.status.submitted)).toBeTruthy();
    expect(within(documents).queryByText(copy.documents.status.approved)).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('button', { name: copy.header.approve })).toBeNull();
    expect(screen.getByRole('status').textContent).toContain(approvedResult.message);
  });

  it('warns that the screen is not synchronized when the refresh fails, and retries', async () => {
    api.fetchDetail
      .mockResolvedValueOnce(pendingApplication)
      .mockRejectedValueOnce(new ApiError(503, 'X', 'unavailable'))
      .mockResolvedValueOnce({ ...pendingApplication, applicationStatus: 'Approved', accountStatus: 'Active' });
    api.approve.mockResolvedValueOnce(approvedResult);

    render(<TourOperatorApplicationDetailView userId={3} />);
    await approve();

    const warning = await screen.findByRole('heading', { name: copy.reconcile.title });
    const panel = warning.closest('section') as HTMLElement;
    expect(panel.textContent).toContain(approvedResult.message);
    expect(panel.textContent).toContain(copy.reconcile.body);
    expect(screen.queryByRole('button', { name: copy.header.approve })).toBeNull();
    expect(screen.queryByRole('button', { name: copy.header.reject })).toBeNull();

    fireEvent.click(within(panel).getByRole('button', { name: copy.reconcile.retry }));
    await waitFor(() => expect(api.fetchDetail).toHaveBeenCalledTimes(3));
    expect(await screen.findByText(copy.status.approved)).toBeTruthy();
    expect(screen.queryByRole('heading', { name: copy.reconcile.title })).toBeNull();
  });

  it('keeps the application pending and the dialog open when approval fails', async () => {
    api.fetchDetail.mockResolvedValueOnce(pendingApplication);
    api.approve.mockRejectedValueOnce(new ApiError(503, 'X', 'unavailable'));

    render(<TourOperatorApplicationDetailView userId={3} />);
    await approve();

    expect((await screen.findByRole('alert')).textContent).toBe(copy.errors.serviceUnavailable);
    expect(api.fetchDetail).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog', { name: copy.approve.title })).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
  });
});

describe('T4 — distinct 401 and 403 handling', () => {
  it('asks for re-authentication on 401 without exposing data or decisions', async () => {
    api.fetchDetail.mockRejectedValueOnce(new ApiError(401, 'X', 'Administrator sign-in required.'));
    render(<TourOperatorApplicationDetailView userId={3} />);

    expect(await screen.findByText(copy.errors.sessionExpired)).toBeTruthy();
    const signIn = screen.getByRole('link', { name: copy.errors.signIn });
    expect(signIn.getAttribute('href')).toBe(
      `/admin/login?returnUrl=${encodeURIComponent('/admin/tour-operator-applications/3')}`,
    );
    expect(screen.queryByText(copy.errors.forbidden)).toBeNull();
    expect(screen.queryByRole('button', { name: copy.header.approve })).toBeNull();
  });

  it('shows the permission message on 403 and never offers a decision', async () => {
    api.fetchDetail.mockRejectedValueOnce(new ApiError(403, 'X', 'Administrator access is not allowed.'));
    render(<TourOperatorApplicationDetailView userId={3} />);

    expect(await screen.findByText(copy.errors.forbidden)).toBeTruthy();
    expect(screen.queryByText(copy.errors.sessionExpired)).toBeNull();
    expect(screen.queryByRole('link', { name: copy.errors.signIn })).toBeNull();
    expect(screen.queryByRole('button', { name: copy.header.approve })).toBeNull();
    expect(screen.queryByRole('button', { name: copy.header.reject })).toBeNull();
  });

  it.each([
    ['404', new ApiError(404, 'X', 'Not found'), copy.errors.notFound(3)],
    ['503', new ApiError(503, 'X', 'unavailable'), copy.errors.serviceUnavailable],
  ])('keeps a meaningful %s message with a retry', async (_label, failure, expected) => {
    api.fetchDetail.mockRejectedValueOnce(failure).mockResolvedValueOnce(pendingApplication);
    render(<TourOperatorApplicationDetailView userId={3} />);

    expect(await screen.findByText(expected)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: copy.errors.retry }));
    expect(await screen.findByRole('heading', { name: 'Hoi An Travel' })).toBeTruthy();
  });
});

describe('T3 — CR-07 and CR-09', () => {
  it('formats review and upload timestamps as dd/MM/yyyy HH:mm in Asia/Ho_Chi_Minh', async () => {
    api.fetchDetail.mockResolvedValueOnce({
      ...pendingApplication,
      applicationStatus: 'Rejected',
      reviewedBy: 7,
      reviewedAt: '2026-10-01T17:05:00Z',
      rejectionReason: 'Licence expired.',
    });
    render(<TourOperatorApplicationDetailView userId={3} />);

    expect(await screen.findByText('02/10/2026 00:05')).toBeTruthy();
    expect(screen.getByText(copy.documents.uploadedAt('09/09/2026 15:10'))).toBeTruthy();
  });

  it('shows an unavailable label instead of a fabricated date for an invalid timestamp', async () => {
    api.fetchDetail.mockResolvedValueOnce({
      ...pendingApplication,
      applicationStatus: 'Rejected',
      reviewedBy: 7,
      reviewedAt: 'not-a-date',
      documents: [{ ...licence, uploadedAt: '' }],
    });
    render(<TourOperatorApplicationDetailView userId={3} />);

    await screen.findByRole('heading', { name: 'Hoi An Travel' });
    expect(screen.getAllByText(copy.common.notAvailable).length).toBeGreaterThan(0);
    expect(screen.getByText(copy.documents.uploadedAt(copy.common.notAvailable))).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/Invalid Date|1970/);
  });

  it('renders no Vietnamese text and hides decorative icons from assistive technology', async () => {
    api.fetchDetail.mockResolvedValueOnce(pendingApplication);
    const { container } = render(<TourOperatorApplicationDetailView userId={3} />);
    await screen.findByRole('heading', { name: 'Hoi An Travel' });

    expect(container.textContent).not.toMatch(VIETNAMESE);
    const pictographs = Array.from(container.querySelectorAll('*')).filter(
      (element) => element.children.length === 0 && /^\p{Extended_Pictographic}/u.test(element.textContent?.trim() ?? ''),
    );
    for (const element of pictographs) {
      expect(element.getAttribute('aria-hidden'), element.outerHTML).toBe('true');
    }
  });

  it('keeps user-facing component text in the feature resource file', () => {
    const root = path.join(process.cwd(), 'src', 'features', 'admin', 'tour-operator-applications', 'components');
    const files = readdirSync(root)
      .map((entry) => path.join(root, entry))
      .filter((file) => statSync(file).isFile() && /\.tsx$/.test(file) && !file.includes('.test.'));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      const jsxText = source.match(/>\s*[A-Za-z][^<>{}]*</g) ?? [];
      const literalAttributes =
        source.match(/\b(aria-label|placeholder|title|alt)="[^"]*[A-Za-z][^"]*"/g) ?? [];
      expect(jsxText, `${file} has hard-coded JSX text`).toEqual([]);
      expect(literalAttributes, `${file} has hard-coded attributes`).toEqual([]);
      expect(source, `${file} contains Vietnamese text`).not.toMatch(VIETNAMESE);
    }
    const resources = readFileSync(path.join(root, '..', 'resources', 'en.ts'), 'utf8');
    expect(resources).not.toMatch(VIETNAMESE);
    expect(resources).not.toMatch(/\bMSG-?\d+/);
  });
});

describe('T5 — safe document links', () => {
  it('renders an allowed HTTPS link that opens safely in a new tab', () => {
    render(<DocumentsGrid documents={[licence]} />);

    const link = screen.getByRole('link', { name: copy.documents.viewFile });
    expect(link.getAttribute('href')).toBe('https://storage.example.test/licence.pdf');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it.each([
    'javascript:alert(1)',
    'data:text/html;base64,PHNjcmlwdD4=',
    '//evil.example.test/licence.pdf',
    '/files/licence.pdf',
    'not a url',
  ])('renders non-interactive copy for %s', (fileUrl) => {
    const { container } = render(<DocumentsGrid documents={[{ ...licence, fileUrl }]} />);

    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getAllByText(copy.documents.linkUnavailable).length).toBeGreaterThan(0);
    expect(container.innerHTML).not.toContain(fileUrl.replace(/&/g, '&amp;'));
  });
});
