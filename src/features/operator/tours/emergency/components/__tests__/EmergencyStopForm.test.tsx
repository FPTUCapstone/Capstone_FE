import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmergencyStopForm } from '../EmergencyStopForm';
import * as api from '../../operatorEmergencyApi';
import type { EmergencyTourImpactResponse } from '../../types';

const mockStopImpact: EmergencyTourImpactResponse = {
  tourId: 100,
  scheduleId: 50,
  scheduleStatus: 'InProgress',
  action: 'EmergencyStopActive',
  impactVersion: 'imp-v2',
  paidBookingCount: 8,
  unpaidBookingCount: 0,
  totalPassengerCount: 16,
  activeSessionCount: 2,
  unusedTicketCount: 0,
  hasUnverifiedSessions: false,
};

describe('EmergencyStopForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('requires password and critical safety fields', () => {
    render(<EmergencyStopForm impact={mockStopImpact} onSuccess={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByLabelText(/Mật khẩu tài khoản hiện tại/i)).toBeDefined();
    expect(screen.getByLabelText(/Chỉ dẫn ứng phó khẩn cấp tức thời/i)).toBeDefined();
    expect(screen.getByLabelText(/Đầu mối liên hệ khẩn cấp/i)).toBeDefined();
  });

  it('submits emergency stop and clears password from memory', async () => {
    vi.spyOn(api, 'getEmergencyImpact').mockResolvedValueOnce(mockStopImpact);
    const stopSpy = vi.spyOn(api, 'emergencyStopActive').mockResolvedValueOnce({
      operationId: 456,
      tourScheduleId: 50,
      action: 'EmergencyStopActive',
      scheduleStatus: 'Interrupted',
      affectedBookingCount: 8,
      committedAtUtc: '2026-11-03T10:10:00Z',
    });
    const onSuccess = vi.fn();

    render(<EmergencyStopForm impact={mockStopImpact} onSuccess={onSuccess} onCancel={vi.fn()} />);

    // Fill form
    const pwdInput = screen.getByLabelText(/Mật khẩu tài khoản hiện tại/i) as HTMLInputElement;
    fireEvent.change(pwdInput, { target: { value: 'SecretPassword123!' } });

    const instructionsInput = screen.getByLabelText(/Chỉ dẫn ứng phó khẩn cấp tức thời/i);
    fireEvent.change(instructionsInput, { target: { value: 'Tập trung tại sảnh khách sạn Mường Thanh trú bão' } });

    const contactInput = screen.getByLabelText(/Đầu mối liên hệ khẩn cấp/i);
    fireEvent.change(contactInput, { target: { value: '0901234567 - Trưởng đoàn Minh' } });

    const detailsInput = screen.getByLabelText(/Chi tiết lý do/i);
    fireEvent.change(detailsInput, { target: { value: 'Sạt lở tuyến đèo Hải Vân' } });
    const submitBtn = screen.getByRole('button', { name: /Xác nhận dừng khẩn cấp tour/i });
    fireEvent.click(submitBtn);

    // Confirmation dialog
    await waitFor(() => {
      expect(screen.getByText(/Bạn có chắc chắn muốn dừng khẩn cấp tour đang chạy\?/i)).toBeDefined();
    });

    const confirmModalBtn = screen.getByRole('button', { name: /Đồng ý dừng tour/i });
    fireEvent.click(confirmModalBtn);

    await waitFor(() => {
      expect(stopSpy).toHaveBeenCalledWith(
        100,
        50,
        expect.objectContaining({
          impactVersion: 'imp-v2',
          currentPassword: 'SecretPassword123!',
          reason: 'WeatherEmergency',
          immediateInstructions: 'Tập trung tại sảnh khách sạn Mường Thanh trú bão',
          emergencyContact: '0901234567 - Trưởng đoàn Minh',
        }),
        expect.any(String)
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('defers authority evidence so an AuthorityDirective stop is not refused', async () => {
    vi.spyOn(api, 'getEmergencyImpact').mockResolvedValueOnce(mockStopImpact);
    const stopSpy = vi.spyOn(api, 'emergencyStopActive').mockResolvedValueOnce({
      operationId: 456,
      tourScheduleId: 50,
      action: 'EmergencyStopActive',
      scheduleStatus: 'EmergencyStopped',
      affectedBookingCount: 8,
      committedAtUtc: '2026-11-03T10:10:00Z',
    });

    render(<EmergencyStopForm impact={mockStopImpact} onSuccess={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/Mật khẩu tài khoản hiện tại/i), { target: { value: 'SecretPassword123!' } });
    fireEvent.change(screen.getByLabelText(/Chỉ dẫn ứng phó khẩn cấp tức thời/i), { target: { value: 'Về điểm tập trung' } });
    fireEvent.change(screen.getByLabelText(/Đầu mối liên hệ khẩn cấp/i), { target: { value: '0901234567' } });
    fireEvent.change(document.getElementById('stop-reason') as HTMLSelectElement, { target: { value: 'AuthorityDirective' } });
    fireEvent.change(screen.getByLabelText(/Chi tiết lý do/i), { target: { value: 'Lệnh cấm đường' } });
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận dừng khẩn cấp tour/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Đồng ý dừng tour/i }));

    await waitFor(() => {
      expect(stopSpy).toHaveBeenCalledWith(
        100,
        50,
        expect.objectContaining({ reason: 'AuthorityDirective', addEvidenceLater: true }),
        expect.any(String)
      );
    });
  });

  it('blocks confirmation dialog if impactVersion changed on server before confirm', async () => {
    vi.spyOn(api, 'getEmergencyImpact').mockResolvedValueOnce({
      ...mockStopImpact,
      impactVersion: 'imp-v3-changed',
    });

    render(<EmergencyStopForm impact={mockStopImpact} onSuccess={vi.fn()} onCancel={vi.fn()} />);

    const pwdInput = screen.getByLabelText(/Mật khẩu tài khoản hiện tại/i);
    fireEvent.change(pwdInput, { target: { value: 'SecretPassword123!' } });

    const instructionsInput = screen.getByLabelText(/Chỉ dẫn ứng phó khẩn cấp tức thời/i);
    fireEvent.change(instructionsInput, { target: { value: 'Trú bão' } });

    const contactInput = screen.getByLabelText(/Đầu mối liên hệ khẩn cấp/i);
    fireEvent.change(contactInput, { target: { value: '0901234567' } });

    const detailsInput = screen.getByLabelText(/Chi tiết lý do/i);
    fireEvent.change(detailsInput, { target: { value: 'Sạt lở' } });
    const submitBtn = screen.getByRole('button', { name: /Xác nhận dừng khẩn cấp tour/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Dữ liệu tác động vừa được cập nhật trên hệ thống/i)).toBeDefined();
      expect(screen.queryByText(/Bạn có chắc chắn muốn dừng khẩn cấp tour đang chạy\?/i)).toBeNull();
    });
  });

  it('clears password and focuses password input when cancel dialog or submit fails', async () => {
    vi.spyOn(api, 'getEmergencyImpact').mockResolvedValue(mockStopImpact);
    vi.spyOn(api, 'emergencyStopActive').mockRejectedValueOnce(
      new api.OperatorEmergencyApiError('Sai mật khẩu xác thực', 400, 'INVALID_PASSWORD')
    );

    render(<EmergencyStopForm impact={mockStopImpact} onSuccess={vi.fn()} onCancel={vi.fn()} />);

    const pwdInput = screen.getByLabelText(/Mật khẩu tài khoản hiện tại/i) as HTMLInputElement;
    fireEvent.change(pwdInput, { target: { value: 'WrongPassword!' } });

    fireEvent.change(screen.getByLabelText(/Chỉ dẫn ứng phó khẩn cấp tức thời/i), { target: { value: 'Trú bão' } });
    fireEvent.change(screen.getByLabelText(/Đầu mối liên hệ khẩn cấp/i), { target: { value: '0901234567' } });
    fireEvent.change(screen.getByLabelText(/Chi tiết lý do/i), { target: { value: 'Sạt lở' } });

    fireEvent.click(screen.getByRole('button', { name: /Xác nhận dừng khẩn cấp tour/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Đồng ý dừng tour/i })).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: /Đồng ý dừng tour/i }));

    await waitFor(() => {
      expect(screen.getByText(/Sai mật khẩu xác thực/i)).toBeDefined();
      // Password must be cleared
      expect(pwdInput.value).toBe('');
      // Password input must be focused
      expect(document.activeElement).toBe(pwdInput);
    });
  });
});
