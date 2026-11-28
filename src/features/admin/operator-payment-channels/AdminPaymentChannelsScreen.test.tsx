import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/features/operator/payment-settings/paymentChannelService', () => ({ listChannels: vi.fn(), decideChannel: vi.fn() }));
import { listChannels, decideChannel } from '@/features/operator/payment-settings/paymentChannelService';
import { AdminPaymentChannelsScreen } from './AdminPaymentChannelsScreen';
const channel = { channelId: 7, channelVersion: 2, tourOperatorUserId: 23, operatorName: null, status: 'PendingVerification', beneficiaryAccountNumberMasked: '••••1234', beneficiaryAccountName: 'TO COMPANY', beneficiaryBankCode: '970422' };
const page = { items: [channel], totalCount: 21, page: 1, pageSize: 20 };
beforeEach(() => { vi.resetAllMocks(); vi.mocked(listChannels).mockResolvedValue(page as never); });
describe('Administrator channel review', () => {
  it('retains a way back when a later filtered page becomes empty', async () => {
    vi.mocked(listChannels).mockResolvedValueOnce(page as never).mockResolvedValueOnce({ items: [], totalCount: 20, page: 2, pageSize: 20 } as never).mockResolvedValueOnce(page as never);
    render(<AdminPaymentChannelsScreen />); await screen.findByText('TO COMPANY');
    fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }));
    await screen.findByText('Không có kênh phù hợp.');
    fireEvent.click(screen.getByRole('button', { name: 'Trang trước' }));
    await waitFor(() => expect(listChannels).toHaveBeenLastCalledWith('', 1, expect.any(AbortSignal)));
  });
  it('requires explicit reason/confirmation and submits the displayed version then reloads', async () => {
    vi.mocked(decideChannel).mockResolvedValue({ status: 'Ready', allowedActions: [] } as never);
    render(<AdminPaymentChannelsScreen />);
    fireEvent.click(await screen.findByRole('button', { name: 'Duyệt kênh' }));
    expect(screen.queryByRole('button', { name: /I understand/i })).toBeNull();
    expect((screen.getByRole('button', { name: 'Xác nhận duyệt' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText('Lý do quyết định'), { target: { value: 'Đã đối chiếu chủ kênh và thông tin ngân hàng.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận duyệt' }));
    await waitFor(() => expect(decideChannel).toHaveBeenCalledWith(7, 'approve', expect.objectContaining({ expectedVersion: 2, reason: 'Đã đối chiếu chủ kênh và thông tin ngân hàng.', operationId: expect.any(String) })));
    await waitFor(() => expect(listChannels).toHaveBeenCalledTimes(2));
  });
  it('keeps conflict visible and refreshes current data without silently approving again', async () => {
    vi.mocked(decideChannel).mockRejectedValue(new Error('Kênh đã thay đổi.'));
    render(<AdminPaymentChannelsScreen />);
    fireEvent.click(await screen.findByRole('button', { name: 'Duyệt kênh' }));
    fireEvent.change(screen.getByLabelText('Lý do quyết định'), { target: { value: 'Kiểm tra' } });
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận duyệt' }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    await waitFor(() => expect(listChannels).toHaveBeenCalledTimes(2));
    expect(decideChannel).toHaveBeenCalledTimes(1);
  });
  it('filters and paginates server-side, and distinguishes empty data from a failed request', async () => {
    render(<AdminPaymentChannelsScreen />); await screen.findByText('TO COMPANY');
    fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }));
    await waitFor(() => expect(listChannels).toHaveBeenLastCalledWith('', 2, expect.any(AbortSignal)));
    vi.mocked(listChannels).mockResolvedValue({ items: [], page: 1, pageSize: 20, totalCount: 0 } as never);
    fireEvent.change(screen.getByLabelText('Lọc trạng thái'), { target: { value: 'Disabled' } });
    expect(await screen.findByText('Không có kênh phù hợp.')).toBeTruthy();
  });
});
