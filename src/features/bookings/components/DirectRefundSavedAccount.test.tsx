import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ router: { replace: vi.fn() } }));
vi.mock('next/navigation', () => ({ useRouter: () => mocks.router }));
vi.mock('@/features/auth/session/useWebSession', () => ({ useWebSession: () => ({ status: 'authenticated' }) }));
vi.mock('@/components/navigation/PublicNavigation', () => ({ PublicNavigation: () => null }));
import { DirectRefundCasePage } from './DirectRefundCasePage';
const account = { bankCode: 'VCB', accountNumber: '1234567890', accountHolder: 'TEST HOLDER' };
const record = { caseId: 1, bookingId: 42, bookingCode: 'BK-TEST', sourceType: 'PolicyCancellation', refundAmountVnd: 10000, status: 'AwaitingRecipient', createdAtUtc: '2026-11-25T01:00:00Z', transferDeadlineAtUtc: null, completedAtUtc: null, completionMethod: null, recipientBankCode: null, recipientAccountNumberMasked: null, recipientAccountHolder: null, pendingTransfer: null, allowedActions: ['ConfirmRecipient'], rowVersion: 'AAAA' };
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('prefills a pending case from the saved account without confirming on behalf of the traveler', async () => {
  const fetchMock = vi.fn().mockResolvedValueOnce(Response.json({ serverNowUtc: '2026-11-25T01:00:00Z', case: record })).mockResolvedValueOnce(Response.json(account));
  vi.stubGlobal('fetch', fetchMock);
  render(<DirectRefundCasePage bookingId="42" caseId="1" embedded />);
  await screen.findByDisplayValue('1234567890');
  expect(screen.getByDisplayValue('TEST HOLDER')).toBeTruthy();
  expect(fetchMock.mock.calls.every(call => call[1]?.method !== 'PUT' && call[1]?.method !== 'POST')).toBe(true);
});

it('does not replace the recipient snapshot of an already confirmed case', async () => {
  const fetchMock = vi.fn().mockResolvedValueOnce(Response.json({ serverNowUtc: '2026-11-25T01:00:00Z', case: { ...record, status: 'AwaitingTransfer', allowedActions: [], recipientBankCode: 'ORIGINAL BANK', recipientAccountNumberMasked: '****4321', recipientAccountHolder: 'ORIGINAL HOLDER' } }));
  vi.stubGlobal('fetch', fetchMock);
  render(<DirectRefundCasePage bookingId="42" caseId="1" embedded />);
  await screen.findByText('ORIGINAL HOLDER');
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
