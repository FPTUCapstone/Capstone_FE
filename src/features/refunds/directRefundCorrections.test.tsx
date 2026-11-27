import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { DirectRefundDisputeDetailScreen } from './admin-disputes/DirectRefundDisputeDetailScreen';
import { OperatorDirectRefundCasePage } from './operator/OperatorDirectRefundCasePage';

const transfer = { transferId: 5, reportedAmountVnd: 10000, bankReference: 'ORIGINAL-REF', actualTransferredAtUtc: '2026-11-25T03:15:00Z', reportedAtUtc: '2026-11-25T04:00:00Z', confirmationDeadlineAtUtc: '2026-11-28T04:00:00Z', evidence: [{ evidenceId: 7, fileName: 'proof.png', contentType: 'image/png', uploadedAtUtc: '2026-11-25T04:00:00Z' }] };
const record = { caseId: 1, bookingId: 42, bookingCode: 'BK-TEST', sourceType: 'PolicyCancellation', refundAmountVnd: 10000, status: 'Disputed', createdAtUtc: '2026-11-25T01:00:00Z', transferDeadlineAtUtc: null, completedAtUtc: null, completionMethod: null, recipientBankCode: 'VCB', recipientAccountNumberMasked: '****4321', recipientAccountHolder: 'TEST', pendingTransfer: transfer, allowedActions: ['ResolveDispute'], rowVersion: 'AAAA', disputeResolution: null, disputeResolutionReason: null, disputeResolvedAtUtc: null };
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('prefills the original transfer details when the operator is asked to resubmit', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...record, status: 'AwaitingTransfer', allowedActions: ['UploadEvidence', 'ReportTransfer'] }))));
  render(<OperatorDirectRefundCasePage caseId="1" />);
  await screen.findByDisplayValue('ORIGINAL-REF');
  expect(screen.getByDisplayValue('10000')).toBeTruthy();
  expect(document.querySelector<HTMLInputElement>('input[type="datetime-local"]')?.value).not.toBe('');
});

it('retains the case and evidence links after an admin decision', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify(record)))
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ ...record, status: 'Completed', completedAtUtc: '2026-11-26T01:00:00Z', completionMethod: 'AdminResolved', allowedActions: [], disputeResolution: 'Completed' })));
  vi.stubGlobal('fetch', fetchMock);
  render(<DirectRefundDisputeDetailScreen caseId="1" />);
  await screen.findByText('BK-TEST');
  expect(screen.getByRole('link', { name: /Mở.*proof.png/ }).getAttribute('href')).toContain('/1/evidence/7');
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Checked bank proof' } });
  const submit = screen.getAllByRole('button').find(button => button.textContent?.includes('Ghi kết quả'));
  if (!submit) throw new Error('Decision button missing');
  fireEvent.click(submit);
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  await screen.findByText('Đã ghi nhận quyết định');
  expect(screen.getByText('BK-TEST')).toBeTruthy();
  expect(screen.getByRole('link', { name: /Quay lại danh sách/ })).toBeTruthy();
});
