import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CancelBeforeDepartureForm } from '../CancelBeforeDepartureForm';
import * as api from '../../operatorEmergencyApi';
import type { EmergencyTourImpactResponse } from '../../types';

const mockImpact: EmergencyTourImpactResponse = {
  tourId: 100,
  scheduleId: 50,
  scheduleStatus: 'Scheduled',
  action: 'CancelBeforeDeparture',
  impactVersion: 'imp-v1',
  paidBookingCount: 10,
  unpaidBookingCount: 1,
  totalPassengerCount: 20,
  activeSessionCount: 0,
  unusedTicketCount: 20,
  hasUnverifiedSessions: false,
};

describe('CancelBeforeDepartureForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders form inputs for reason, details, and optional evidence', () => {
    render(<CancelBeforeDepartureForm impact={mockImpact} onSuccess={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByLabelText(/Lý do hủy khẩn cấp/i)).toBeDefined();
    expect(screen.getByLabelText(/Chi tiết lý do/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Xác nhận hủy trước khởi hành/i })).toBeDefined();
  });

  it('validates required fields, re-verifies fresh impact and submits with idempotency key', async () => {
    vi.spyOn(api, 'getEmergencyImpact').mockResolvedValueOnce(mockImpact);
    const cancelSpy = vi.spyOn(api, 'cancelBeforeDeparture').mockResolvedValueOnce({
      operationId: 123,
      tourScheduleId: 50,
      action: 'CancelBeforeDeparture',
      scheduleStatus: 'Cancelled',
      affectedBookingCount: 10,
      committedAtUtc: '2026-11-03T10:05:00Z',
    });
    const onSuccess = vi.fn();

    render(<CancelBeforeDepartureForm impact={mockImpact} onSuccess={onSuccess} onCancel={vi.fn()} />);

    // Fill details
    const detailsInput = screen.getByLabelText(/Chi tiết lý do/i);
    fireEvent.change(detailsInput, { target: { value: 'Bão số 9 cấm biển theo chỉ thị UBND' } });

    const submitBtn = screen.getByRole('button', { name: /Xác nhận hủy trước khởi hành/i });
    fireEvent.click(submitBtn);

    // Confirmation dialog appears after verifying fresh impact
    await waitFor(() => {
      expect(screen.getByText(/Bạn có chắc chắn muốn hủy lịch khởi hành này\?/i)).toBeDefined();
    });

    const confirmModalBtn = screen.getByRole('button', { name: /Đồng ý hủy/i });
    fireEvent.click(confirmModalBtn);

    await waitFor(() => {
      expect(cancelSpy).toHaveBeenCalledWith(
        100,
        50,
        expect.objectContaining({
          impactVersion: 'imp-v1',
          reason: 'WeatherEmergency',
          reasonDetails: 'Bão số 9 cấm biển theo chỉ thị UBND',
        }),
        expect.any(String) // idempotency key (UUID)
      );
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it('defers authority evidence so an AuthorityDirective cancellation is not refused', async () => {
    vi.spyOn(api, 'getEmergencyImpact').mockResolvedValueOnce(mockImpact);
    const cancelSpy = vi.spyOn(api, 'cancelBeforeDeparture').mockResolvedValueOnce({
      operationId: 123,
      tourScheduleId: 50,
      action: 'CancelBeforeDeparture',
      scheduleStatus: 'Cancelled',
      affectedBookingCount: 10,
      committedAtUtc: '2026-11-03T10:05:00Z',
    });

    render(<CancelBeforeDepartureForm impact={mockImpact} onSuccess={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/Lý do hủy khẩn cấp/i), { target: { value: 'AuthorityDirective' } });
    fireEvent.change(screen.getByLabelText(/Chi tiết lý do/i), { target: { value: 'Lệnh cấm đường' } });
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận hủy trước khởi hành/i }));
    fireEvent.click(await screen.findByRole('button', { name: /Đồng ý hủy/i }));

    await waitFor(() => {
      expect(cancelSpy).toHaveBeenCalledWith(
        100,
        50,
        expect.objectContaining({ reason: 'AuthorityDirective', addEvidenceLater: true }),
        expect.any(String)
      );
    });
  });

  it('opens confirmation on retry once the refreshed impact is unchanged', async () => {
    const changed = { ...mockImpact, impactVersion: 'imp-v2-changed', paidBookingCount: 12 };
    vi.spyOn(api, 'getEmergencyImpact').mockResolvedValueOnce(changed).mockResolvedValueOnce(changed);

    render(<CancelBeforeDepartureForm impact={mockImpact} onSuccess={vi.fn()} onCancel={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/Chi tiết lý do/i), { target: { value: 'Bão số 9' } });
    const submitBtn = screen.getByRole('button', { name: /Xác nhận hủy trước khởi hành/i });
    fireEvent.click(submitBtn);
    await screen.findByText(/Dữ liệu tác động vừa được cập nhật trên hệ thống/i);

    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Bạn có chắc chắn muốn hủy lịch khởi hành này\?/i)).toBeDefined();
  });

  it('blocks confirmation dialog if impactVersion changed on server before confirm', async () => {
    vi.spyOn(api, 'getEmergencyImpact').mockResolvedValueOnce({
      ...mockImpact,
      impactVersion: 'imp-v2-changed',
      paidBookingCount: 12,
    });

    render(<CancelBeforeDepartureForm impact={mockImpact} onSuccess={vi.fn()} onCancel={vi.fn()} />);

    const detailsInput = screen.getByLabelText(/Chi tiết lý do/i);
    fireEvent.change(detailsInput, { target: { value: 'Bão số 9' } });

    const submitBtn = screen.getByRole('button', { name: /Xác nhận hủy trước khởi hành/i });
    fireEvent.click(submitBtn);

    // Expect warning message and dialog NOT opened
    await waitFor(() => {
      expect(screen.getByText(/Dữ liệu tác động vừa được cập nhật trên hệ thống/i)).toBeDefined();
      expect(screen.queryByText(/Bạn có chắc chắn muốn hủy lịch khởi hành này\?/i)).toBeNull();
    });
  });

  it('generates a new idempotency key when payload is modified after a failure', async () => {
    vi.spyOn(api, 'getEmergencyImpact').mockResolvedValue(mockImpact);
    const cancelSpy = vi
      .spyOn(api, 'cancelBeforeDeparture')
      .mockRejectedValueOnce(new api.OperatorEmergencyApiError('Server error', 500))
      .mockResolvedValueOnce({
        operationId: 124,
        tourScheduleId: 50,
        action: 'CancelBeforeDeparture',
        scheduleStatus: 'Cancelled',
        affectedBookingCount: 10,
        committedAtUtc: '2026-11-03T10:06:00Z',
      });

    render(<CancelBeforeDepartureForm impact={mockImpact} onSuccess={vi.fn()} onCancel={vi.fn()} />);

    const detailsInput = screen.getByLabelText(/Chi tiết lý do/i);
    fireEvent.change(detailsInput, { target: { value: 'Bão số 9' } });

    // 1st submit attempt
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận hủy trước khởi hành/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Đồng ý hủy/i })).toBeDefined());
    fireEvent.click(screen.getByRole('button', { name: /Đồng ý hủy/i }));

    await waitFor(() => {
      expect(screen.getByText(/Server error/i)).toBeDefined();
    });
    const firstKey = cancelSpy.mock.calls[0][3];

    // Change payload: details changed
    fireEvent.change(detailsInput, { target: { value: 'Bão số 9 tăng cấp 11 cấm biển tuyệt đối' } });

    // 2nd submit attempt with new payload
    fireEvent.click(screen.getByRole('button', { name: /Xác nhận hủy trước khởi hành/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Đồng ý hủy/i })).toBeDefined());
    fireEvent.click(screen.getByRole('button', { name: /Đồng ý hủy/i }));

    await waitFor(() => {
      expect(cancelSpy).toHaveBeenCalledTimes(2);
    });
    const secondKey = cancelSpy.mock.calls[1][3];
    expect(secondKey).not.toBe(firstKey);
  });
});
