import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PartyStaffReviewPanel } from './PartyStaffReviewPanel';

const detail = { complaintId: 1, status: 'AwaitingStaffEvidence', allowedActions: ['SubmitEvidence'], reviewHistory: [{ id: 7, action: 'RequestEvidence', reason: 'Please provide the bank receipt.', contractBasis: 'Section 4', targetParty: 'Traveler', createdAtUtc: '2026-12-15T02:00:00Z', dueAtUtc: '2026-12-18T02:00:00Z' }] };
afterEach(() => vi.unstubAllGlobals());
describe('PartyStaffReviewPanel', () => {
  it('keeps history read-only after refund completion even if stale actions are present', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ ...detail, status: 'Approved', isClosed: true, allowedActions: ['SubmitEvidence', 'RequestReconsideration'] })));
    render(<PartyStaffReviewPanel complaintId={1} party="Traveler" />);
    expect(await screen.findByText('Đã hoàn tiền · Khiếu nại đã đóng')).toBeDefined();
    expect(screen.queryByLabelText('New evidence')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Request reconsideration' })).toBeNull();
    expect(screen.getByText('Please provide the bank receipt.')).toBeDefined();
    expect(screen.queryByText(/Hạn bổ sung:/)).toBeNull();
  });
  it('shows the current evidence request and submits files against its event without modifying money', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(Response.json(detail)).mockResolvedValueOnce(Response.json({ ...detail, status: 'AwaitingStaffReview', allowedActions: [] }));
    vi.stubGlobal('fetch', fetchMock);
    render(<PartyStaffReviewPanel complaintId={1} party="Traveler" />);
    expect(await screen.findByText('Please provide the bank receipt.')).toBeDefined();
    fireEvent.change(screen.getByLabelText('Explanation'), { target: { value: 'Additional receipt' } });
    fireEvent.change(screen.getByLabelText('New evidence'), { target: { files: [new File(['receipt'], 'receipt.png', { type: 'image/png' })] } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit evidence' }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toBe('/api/v1/traveler/complaints/1/staff-evidence');
    expect(init.body.get('requestEventId')).toBe('7');
    expect(init.body.get('amount')).toBeNull();
    expect(await screen.findByText('Your evidence has been recorded.')).toBeDefined();
  });
  it('keeps a final decision visible when requesting reconsideration and explains its financial effect', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ ...detail, status: 'Approved', allowedActions: ['RequestReconsideration'], reviewHistory: [{ ...detail.reviewHistory[0], action: 'RefundPartial', amount: 30000 }] })));
    render(<PartyStaffReviewPanel complaintId={1} party="Operator" />);
    expect(await screen.findByText('Quyết định hoàn một phần')).toBeDefined();
    expect(screen.getByText(/does not change the current decision or refund obligation/)).toBeDefined();
    expect(screen.getByRole('button', { name: 'Request reconsideration' })).toBeDefined();
  });
  it('does not offer a submission to the party that was not asked', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ ...detail, allowedActions: [] })));
    render(<PartyStaffReviewPanel complaintId={1} party="Operator" />);
    expect(await screen.findByText('Please provide the bank receipt.')).toBeDefined();
    expect(screen.queryByLabelText('New evidence')).toBeNull();
  });
});
