import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CommissionStatementDetailScreen } from './CommissionStatementDetailScreen';
vi.mock('@/features/operator/common/components/PartnerWorkspaceLayout', () => ({ PartnerWorkspaceLayout: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
const stmt = { id: 1, statementCode: 'DCO-7', period: '2026-10', eligibleBaseVnd: 100000, commissionRateSnapshot: .1, commissionAmountVnd: 10000, status: 'Issued', allowedActions: ['Pay', 'CompleteMock'], payment: { paymentId: 81, provider: 'Mock', status: 'Pending', checkoutUrl: null, expiresAtUtc: '2099-11-01T00:00:00Z', canCompleteMock: true } };
afterEach(() => vi.unstubAllGlobals());
describe('commission payment', () => {
  it('explains credits carried into and out of the statement and shows held rows', async () => {
    const calculation = { grossRevenueVnd: 100000, completedRefundsVnd: 200000, revenueCommissionVnd: 10000, refundCommissionCreditVnd: 20000, creditBroughtForwardVnd: 5000, creditAppliedVnd: 0, creditCarriedForwardVnd: 15000, heldBookingCount: 2, ambiguousLegacyBookingCount: 1 };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ ...stmt, commissionAmountVnd: 0, allowedActions: [], payment: null, calculation })));
    render(<CommissionStatementDetailScreen statementId="1" />);
    expect(await screen.findByText('Khoản giảm còn dư chuyển kỳ sau')).toBeDefined();
    expect(screen.getByText('15.000 ₫')).toBeDefined();
    expect(screen.getByText(/2 đơn còn chờ xử lý/)).toBeDefined();
    expect(screen.getByText(/1 đơn lịch sử cần kiểm tra/)).toBeDefined();
  });
  it('shows no payment required for a zero payable statement without presenting a debt', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ ...stmt, commissionAmountVnd: 0, allowedActions: [], payment: null })));
    render(<CommissionStatementDetailScreen statementId="1" />);
    expect(await screen.findByText('Không cần thanh toán kỳ này')).toBeDefined();
    expect(screen.queryByText(/Thanh toán cho TripMate trước/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Thanh toán hoa hồng' })).toBeNull();
  });
  it('confirms a server-authorized Mock payment using paymentId only and reloads the statement', async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json(stmt)).mockResolvedValueOnce(Response.json({ success: true })).mockResolvedValueOnce(Response.json({ ...stmt, status: 'Paid', allowedActions: [], payment: { ...stmt.payment, status: 'Success', canCompleteMock: false } }));
    vi.stubGlobal('fetch', fetcher);
    render(<CommissionStatementDetailScreen statementId="1" />);
    fireEvent.click(await screen.findByRole('button', { name: 'Thanh toán thử (Mock)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận thanh toán thử' }));
    await waitFor(() => expect(fetcher).toHaveBeenCalledWith('/api/v1/operator/commission-statements/1/mock-complete', expect.objectContaining({ body: JSON.stringify({ paymentId: 81 }) })));
    expect(await screen.findByText('Đã thanh toán')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Thanh toán thử (Mock)' })).toBeNull();
  });
  it('does not offer Mock completion or an unsafe checkout for a real payment', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ ...stmt, allowedActions: ['Pay'], payment: { ...stmt.payment, provider: 'PayOS', canCompleteMock: false, checkoutUrl: 'https://attacker.test/checkout' } })));
    render(<CommissionStatementDetailScreen statementId="1" />);
    expect(await screen.findByText('Hoa hồng tháng 10/2026')).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Thanh toán thử (Mock)' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Mở thanh toán payOS' })).toBeNull();
  });
});
