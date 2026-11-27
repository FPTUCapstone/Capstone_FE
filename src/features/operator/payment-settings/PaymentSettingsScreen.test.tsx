import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('./paymentChannelService', () => ({ getChannel: vi.fn(), submitChannel: vi.fn(), verifyChannel: vi.fn() }));
import { getChannel, submitChannel, verifyChannel } from './paymentChannelService';
import { PaymentSettingsScreen } from './PaymentSettingsScreen';
const disconnected = { status: 'NotConnected', allowedActions: ['submit_credentials'] };
beforeEach(() => { vi.resetAllMocks(); vi.mocked(getChannel).mockResolvedValue(disconnected as never); });
describe('operator payOS onboarding', () => {
  it('submits six fields, clears secrets, then verifies separately without pretending Ready', async () => {
    vi.mocked(submitChannel).mockResolvedValue({ status: 'PendingVerification', allowedActions: ['submit_credentials', 'verify'] } as never);
    vi.mocked(verifyChannel).mockResolvedValue({ status: 'PendingVerification', allowedActions: ['submit_credentials', 'verify'] } as never);
    render(<PaymentSettingsScreen />);
    await screen.findByLabelText('Client ID');
    for (const [label, value] of [['Client ID', 'client'], ['API Key', 'api-secret'], ['Checksum Key', 'checksum-secret'], ['Số tài khoản nhận', '123456'], ['Tên chủ tài khoản', 'TO COMPANY'], ['Mã ngân hàng', '970422']]) fireEvent.change(screen.getByLabelText(label), { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thông tin kết nối' }));
    await waitFor(() => expect(submitChannel).toHaveBeenCalledTimes(1));
    expect((screen.getByLabelText('API Key') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('Checksum Key') as HTMLInputElement).value).toBe('');
    fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra kết nối' }));
    await waitFor(() => expect(verifyChannel).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('Sẵn sàng nhận thanh toán')).toBeNull();
  });
  it('honors allowedActions and offers retry instead of fake status on read failure', async () => {
    vi.mocked(getChannel).mockRejectedValueOnce(new Error('Chưa thể tải kênh.')).mockResolvedValueOnce({ status: 'Disabled', allowedActions: [] } as never);
    render(<PaymentSettingsScreen />); fireEvent.click(await screen.findByRole('button', { name: 'Thử lại' }));
    await screen.findByText('Đã vô hiệu hóa');
    expect(screen.queryByRole('button', { name: 'Lưu thông tin kết nối' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Kiểm tra kết nối' })).toBeNull();
  });
});
