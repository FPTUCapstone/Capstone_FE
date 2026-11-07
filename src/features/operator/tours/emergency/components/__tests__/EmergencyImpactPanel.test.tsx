import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { EmergencyImpactPanel } from '../EmergencyImpactPanel';
import * as api from '../../operatorEmergencyApi';
import type { EmergencyTourImpactResponse } from '../../types';

const safeImpact: EmergencyTourImpactResponse = {
  tourId: 200,
  scheduleId: 50,
  scheduleStatus: 'Scheduled',
  action: 'CancelBeforeDeparture',
  impactVersion: 'imp-v1-abc',
  paidBookingCount: 15,
  unpaidBookingCount: 2,
  totalPassengerCount: 30,
  activeSessionCount: 0,
  unusedTicketCount: 30,
  hasUnverifiedSessions: false,
};

const unverifiedImpact: EmergencyTourImpactResponse = {
  ...safeImpact,
  action: 'EmergencyStopActive',
  scheduleStatus: 'InProgress',
  hasUnverifiedSessions: true,
};

describe('EmergencyImpactPanel', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches and renders commercial impact metrics correctly', async () => {
    vi.spyOn(api, 'getEmergencyImpact').mockResolvedValueOnce(safeImpact);

    render(<EmergencyImpactPanel tourId={200} scheduleId={50} onProceed={vi.fn()} />);

    expect(screen.getByText(/Đang tính toán tác động vận hành/i)).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('15')).toBeDefined(); // Paid bookings
      expect(screen.getByText('30')).toBeDefined(); // Affected passengers
      expect(screen.getByText(/được xử lý riêng theo chính sách hủy booking áp dụng/i)).toBeDefined();
      expect(screen.queryByText(/VND|Refund Estimate|UC-71|UC-42|đơn thủ công/i)).toBeNull();
    });
  });

  it('fails closed when hasUnverifiedSessions is true by disabling proceed button', async () => {
    vi.spyOn(api, 'getEmergencyImpact').mockResolvedValueOnce(unverifiedImpact);

    render(<EmergencyImpactPanel tourId={200} scheduleId={50} onProceed={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Có phiên đi tour chưa đồng bộ trạng thái/i)).toBeDefined();
    });

    const actionBtn = screen.getByRole('button', { name: /Tiến hành dừng khẩn cấp/i });
    expect(actionBtn.hasAttribute('disabled')).toBe(true);
  });

  it('calls onProceed with latest impact when proceed button is clicked', async () => {
    vi.spyOn(api, 'getEmergencyImpact').mockResolvedValueOnce(safeImpact);
    const onProceed = vi.fn();

    render(<EmergencyImpactPanel tourId={200} scheduleId={50} onProceed={onProceed} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Tiến hành hủy trước khởi hành/i })).toBeDefined();
    });

    const proceedBtn = screen.getByRole('button', { name: /Tiến hành hủy trước khởi hành/i });
    expect(proceedBtn.hasAttribute('disabled')).toBe(false);
    fireEvent.click(proceedBtn);

    expect(onProceed).toHaveBeenCalledWith(safeImpact);
  });

  it('names the departure status in Vietnamese', async () => {
    vi.spyOn(api, 'getEmergencyImpact').mockResolvedValueOnce(safeImpact);
    render(<EmergencyImpactPanel tourId={200} scheduleId={50} onProceed={vi.fn()} />);

    await waitFor(() => expect(screen.getByText('Đã lên lịch')).toBeDefined());
    expect(screen.queryByText('Scheduled')).toBeNull();
  });
});
