import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StaffComplaintDetailScreen } from './StaffComplaintDetailScreen';
const detail = { complaintId: 1, bookingId: 2, bookingCode: 'BK-TEST', tourTitle: 'Tour Đà Nẵng', status: 'AwaitingStaffReview', refundableAmount: 10000, submittedAtUtc: '2026-11-27T00:00:00Z', reasonCategory: 'Service', reasonDetail: 'Missing stop', rowVersion: 'AAAAAAABAAA=', evidence: [], negotiationHistory: [], reviewHistory: [], allowedActions: ['RefundPartial', 'RequestEvidence', 'Reject'] };
afterEach(() => { vi.unstubAllGlobals(); });
describe('Staff decision screen', () => {
  it('shows details after success and submits binding versioned decision', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json(detail)).mockResolvedValueOnce(Response.json({ ...detail, status: 'RefundProcessing', allowedActions: [] }));
    vi.stubGlobal('fetch', fetcher);
    render(<StaffComplaintDetailScreen id="1" />);
    await screen.findByText('Missing stop');
    fireEvent.change(screen.getByLabelText('Quyết định'), { target: { value: 'RefundPartial' } });
    fireEvent.change(screen.getByLabelText('Số tiền hoàn (VNĐ)'), { target: { value: '5000' } });
    fireEvent.change(screen.getByLabelText('Lý do'), { target: { value: 'Service verified' } });
    fireEvent.change(screen.getByLabelText('Căn cứ hợp đồng'), { target: { value: 'Clause 3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ghi nhận quyết định' }));
    await screen.findByText('Đã ghi nhận quyết định. Hồ sơ bên dưới đã được cập nhật.');
    expect(screen.getByText('Missing stop')).toBeTruthy();
    const sent = JSON.parse(fetcher.mock.calls[1][1].body);
    expect(sent).toMatchObject({ action: 'RefundPartial', amount: 5000, reason: 'Service verified', contractBasis: 'Clause 3', expectedVersion: detail.rowVersion });
    expect(sent.operationId).toMatch(/^[0-9a-f-]{36}$/i);
  });
  it('does not render decision controls when not allowed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ ...detail, allowedActions: [] })));
    render(<StaffComplaintDetailScreen id="1" />); await screen.findByText('Missing stop');
    expect(screen.queryByRole('button', { name: 'Ghi nhận quyết định' })).toBeNull();
  });
  it('prevents a partial refund exceeding the verified cap', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json(detail)); vi.stubGlobal('fetch', fetcher);
    render(<StaffComplaintDetailScreen id="1" />); await screen.findByText('Missing stop');
    fireEvent.change(screen.getByLabelText('Quyết định'), { target: { value: 'RefundPartial' } });
    fireEvent.change(screen.getByLabelText('Số tiền hoàn (VNĐ)'), { target: { value: '10001' } });
    expect(screen.getByRole('button', { name: 'Ghi nhận quyết định' }).hasAttribute('disabled')).toBe(true);
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
  });
});
