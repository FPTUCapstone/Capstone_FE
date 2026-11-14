import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor, fireEvent } from '@testing-library/react';
import { WeatherSafetyReviewDetailPage } from '../WeatherSafetyReviewDetailPage';
import * as api from '../../weatherSafetyApi';
import * as emergencyApi from '../../../tours/emergency/operatorEmergencyApi';
import type { WeatherSafetyReview } from '../../types';

const realtime = vi.hoisted(() => ({ onRefreshHint: undefined as undefined | (() => void) }));

vi.mock('../../realtime/useWeatherSafetyRealtime', () => ({
  useWeatherSafetyRealtime: (options: { onRefreshHint?: () => void }) => {
    realtime.onRefreshHint = options.onRefreshHint;
    return { isConnected: false, connectionState: 'Disconnected' };
  },
}));

const sampleReview: WeatherSafetyReview = {
  id: 42,
  tourScheduleId: 105,
  tourId: 300,
  tourTitle: 'Tour Trekking Bạch Mã',
  scheduleStartAtUtc: '2026-11-05T01:00:00Z',
  scheduleEndAtUtc: '2026-11-05T10:00:00Z',
  scheduleStatus: 'Scheduled',
  provider: 'Tomorrow.io',
  providerEventId: 'evt-bachma',
  eventType: 'FlashFlood',
  severity: 'Extreme',
  description: 'Nguy cơ lũ quét và sạt lở đất nghiêm trọng',
  validFromUtc: '2026-11-05T00:00:00Z',
  validToUtc: '2026-11-05T18:00:00Z',
  originalAuthority: 'NCHMF',
  officialVietnamRiskLevel: 4,
  verifiedDirective: 'Sơ tán dân cư và dừng mọi hoạt động du lịch mạo hiểm',
  affectedAreaSummary: 'Vườn Quốc gia Bạch Mã',
  isWithdrawn: false,
  status: 'PendingAcknowledgement',
  urgentNoticeSentAtUtc: '2026-11-03T10:00:00Z',
  acknowledgementDeadlineUtc: '2026-11-03T12:00:00Z',
  acknowledgedAtUtc: null,
  acknowledgedByOperatorId: null,
  escalatedAtUtc: null,
  escalationContact: null,
  immediateInstructions: null,
  createdAtUtc: '2026-11-03T10:00:00Z',
};

describe('WeatherSafetyReviewDetailPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders loading state initially then displays review details', async () => {
    vi.spyOn(api, 'getWeatherSafetyReview').mockResolvedValueOnce(sampleReview);

    render(<WeatherSafetyReviewDetailPage reviewId={42} />);
    expect(screen.getByText(/Đang tải chi tiết cảnh báo/i)).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('Tour Trekking Bạch Mã')).toBeDefined();
      expect(screen.getByText(/Nguy cơ lũ quét và sạt lở đất nghiêm trọng/i)).toBeDefined();
    });
  });

  it('keeps the loaded review when a background refresh fails', async () => {
    const getSpy = vi
      .spyOn(api, 'getWeatherSafetyReview')
      .mockResolvedValueOnce(sampleReview)
      .mockRejectedValueOnce(new Error('Network down'));

    render(<WeatherSafetyReviewDetailPage reviewId={42} />);
    await waitFor(() => {
      expect(screen.getByText('Tour Trekking Bạch Mã')).toBeDefined();
    });

    await act(async () => {
      realtime.onRefreshHint?.();
    });

    await waitFor(() => expect(getSpy).toHaveBeenCalledTimes(2));
    expect(screen.queryByText('Network down')).toBeNull();
    expect(screen.getByText('Tour Trekking Bạch Mã')).toBeDefined();
  });

  it('renders safe 404/not-found when review does not exist or user lacks permission', async () => {
    vi.spyOn(api, 'getWeatherSafetyReview').mockRejectedValueOnce(
      new api.WeatherSafetyApiError('Review not found', 404, 'NOT_FOUND')
    );

    render(<WeatherSafetyReviewDetailPage reviewId={999} />);

    await waitFor(() => {
      expect(screen.getByText(/Không tìm thấy hồ sơ cảnh báo/i)).toBeDefined();
    });
  });

  describe('a closed review', () => {
    const closed: WeatherSafetyReview = {
      ...sampleReview,
      status: 'Closed',
      scheduleStatus: 'Cancelled',
    };
    const evidence = {
      operationId: 7,
      evidenceUrl: null,
      authorityReference: null,
      evidenceReference: 'OLD-REF',
      evidenceProvenance: 'OperatorProvided',
      evidenceAddedLater: false,
      evidenceVersion: 'version-1',
    };

    it('offers no acknowledgement or decision, and keeps evidence reachable', async () => {
      vi.spyOn(api, 'getWeatherSafetyReview').mockResolvedValueOnce(closed);
      vi.spyOn(emergencyApi, 'getEmergencyEvidence').mockResolvedValueOnce(evidence);

      render(<WeatherSafetyReviewDetailPage reviewId={42} />);

      expect(await screen.findByText('OLD-REF')).toBeDefined();
      expect(screen.queryByRole('button', { name: /Đã xem cảnh báo/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /Mở tính toán tác động/i })).toBeNull();
    });

    it('becomes read-only when a refresh reports the closure', async () => {
      vi.spyOn(api, 'getWeatherSafetyReview')
        .mockResolvedValueOnce(sampleReview)
        .mockResolvedValueOnce(closed);
      vi.spyOn(emergencyApi, 'getEmergencyEvidence').mockResolvedValue(evidence);

      render(<WeatherSafetyReviewDetailPage reviewId={42} />);
      expect(await screen.findByRole('button', { name: /Mở tính toán tác động/i })).toBeDefined();

      await act(async () => {
        realtime.onRefreshHint?.();
      });

      await waitFor(() =>
        expect(screen.queryByRole('button', { name: /Mở tính toán tác động/i })).toBeNull()
      );
      expect(screen.queryByRole('button', { name: /Đã xem cảnh báo/i })).toBeNull();
    });
  });

  it('keeps evidence reachable after a reload of a decided departure', async () => {
    vi.spyOn(api, 'getWeatherSafetyReview').mockResolvedValueOnce({
      ...sampleReview,
      scheduleStatus: 'EmergencyStopped',
    });
    vi.spyOn(emergencyApi, 'getEmergencyEvidence').mockResolvedValueOnce({
      operationId: 7,
      evidenceUrl: null,
      authorityReference: null,
      evidenceReference: 'OLD-REF',
      evidenceProvenance: 'OperatorProvided',
      evidenceAddedLater: false,
      evidenceVersion: 'version-1',
    });

    render(<WeatherSafetyReviewDetailPage reviewId={42} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/Mã hiệu công điện/i)).toBeDefined();
    });
    expect(await screen.findByText('OLD-REF')).toBeDefined();
  });

  it('stays silent for a departure cancelled outside UC-70', async () => {
    vi.spyOn(api, 'getWeatherSafetyReview').mockResolvedValueOnce({
      ...sampleReview,
      scheduleStatus: 'Cancelled',
    });
    const read = vi
      .spyOn(emergencyApi, 'getEmergencyEvidence')
      .mockRejectedValueOnce(new emergencyApi.OperatorEmergencyApiError('Not found', 404));

    render(<WeatherSafetyReviewDetailPage reviewId={42} />);

    await waitFor(() => expect(read).toHaveBeenCalled());
    await waitFor(() => {
      expect(screen.queryByLabelText(/Mã hiệu công điện/i)).toBeNull();
    });
    expect(screen.queryByText(/Không thể tải bằng chứng/i)).toBeNull();
  });

  it('offers no evidence while the departure is undecided', async () => {
    vi.spyOn(api, 'getWeatherSafetyReview').mockResolvedValueOnce(sampleReview);
    const read = vi.spyOn(emergencyApi, 'getEmergencyEvidence');

    render(<WeatherSafetyReviewDetailPage reviewId={42} />);

    await waitFor(() => {
      expect(screen.getByText('Tour Trekking Bạch Mã')).toBeDefined();
    });
    expect(read).not.toHaveBeenCalled();
  });

  describe('after an emergency decision', () => {
    const cancelImpact = {
      tourId: 300,
      scheduleId: 105,
      action: 'CancelBeforeDeparture',
      scheduleStatus: 'Scheduled',
      paidBookingCount: 2,
      unpaidBookingCount: 1,
      totalPassengerCount: 5,
      activeSessionCount: 0,
      unusedTicketCount: 5,
      hasUnverifiedSessions: false,
      impactVersion: 'imp-1',
    };
    const stopImpact = { ...cancelImpact, action: 'EmergencyStopActive', scheduleStatus: 'InProgress' };
    const cancelResult = {
      operationId: 77,
      tourScheduleId: 105,
      action: 'CancelBeforeDeparture',
      scheduleStatus: 'Cancelled',
      affectedBookingCount: 3,
      committedAtUtc: '2026-11-03T10:05:00Z',
    };
    const stopResult = { ...cancelResult, action: 'EmergencyStopActive', scheduleStatus: 'EmergencyStopped' };

    async function openDecision(impact: typeof cancelImpact) {
      vi.spyOn(api, 'getWeatherSafetyReview').mockResolvedValue(sampleReview);
      vi.spyOn(emergencyApi, 'getEmergencyImpact').mockResolvedValue(impact);
      vi.spyOn(emergencyApi, 'getEmergencyEvidence').mockRejectedValue(
        new emergencyApi.OperatorEmergencyApiError('Not found', 404)
      );

      render(<WeatherSafetyReviewDetailPage reviewId={42} />);
      fireEvent.click(await screen.findByRole('button', { name: /Mở tính toán tác động/i }));
      fireEvent.click(await screen.findByRole('button', { name: /Tiến hành (hủy|dừng)/i }));
      fireEvent.change(screen.getByLabelText(/Lý do hiển thị cho du khách/i), {
        target: { value: 'Bão số 9 cấm biển' },
      });
    }

    async function cancelWith(result: typeof cancelResult & { refundsSubmitted?: number }) {
      vi.spyOn(emergencyApi, 'cancelBeforeDeparture').mockResolvedValueOnce(result);
      await openDecision(cancelImpact);
      fireEvent.click(screen.getByRole('button', { name: /Xác nhận hủy trước khởi hành/i }));
      fireEvent.click(await screen.findByRole('button', { name: /Đồng ý hủy/i }));
      await screen.findByText(/Thao tác thành công/i);
    }

    async function stopWith(result: typeof stopResult & { refundsSubmitted?: number }) {
      vi.spyOn(emergencyApi, 'emergencyStopActive').mockResolvedValueOnce(result);
      await openDecision(stopImpact);
      fireEvent.change(screen.getByLabelText(/Mật khẩu tài khoản hiện tại/i), { target: { value: 'Secret123!' } });
      fireEvent.change(screen.getByLabelText(/Chỉ dẫn ứng phó khẩn cấp tức thời/i), {
        target: { value: 'Tập trung tại sảnh khách sạn' },
      });
      fireEvent.change(screen.getByLabelText(/Đầu mối liên hệ khẩn cấp/i), { target: { value: '0901234567' } });
      fireEvent.click(screen.getByRole('button', { name: /Xác nhận dừng khẩn cấp tour/i }));
      fireEvent.click(await screen.findByRole('button', { name: /Đồng ý dừng tour/i }));
      await screen.findByText(/Thao tác thành công/i);
    }

    it('reports how many refund requests a cancellation created', async () => {
      await cancelWith({ ...cancelResult, refundsSubmitted: 2 });
      expect(screen.getByText('Đã tạo 2 yêu cầu hoàn tiền.')).toBeDefined();
    });

    it('says paid bookings went to TripMate for refund review after a stop', async () => {
      await stopWith({ ...stopResult, refundsSubmitted: 0 });
      expect(
        screen.getByText('Các booking đã thanh toán đã được chuyển cho TripMate xem xét hoàn tiền.')
      ).toBeDefined();
    });

    it('says nothing about refunds when the Backend does not report them', async () => {
      await cancelWith(cancelResult);
      expect(screen.queryByText(/yêu cầu hoàn tiền/i)).toBeNull();
    });
  });

  it('calls acknowledge API and refreshes review state', async () => {
    vi.spyOn(api, 'getWeatherSafetyReview')
      .mockResolvedValueOnce(sampleReview)
      .mockResolvedValueOnce({
        ...sampleReview,
        status: 'Acknowledged',
        acknowledgedAtUtc: '2026-11-03T11:00:00Z',
        acknowledgedByOperatorId: 88,
      });
    const acknowledgeSpy = vi.spyOn(api, 'acknowledgeWeatherSafetyReview').mockResolvedValueOnce({
      ...sampleReview,
      status: 'Acknowledged',
      acknowledgedAtUtc: '2026-11-03T11:00:00Z',
      acknowledgedByOperatorId: 88,
    });

    render(<WeatherSafetyReviewDetailPage reviewId={42} />);

    await waitFor(() => {
      expect(screen.getByText('Tour Trekking Bạch Mã')).toBeDefined();
    });

    const submitBtn = screen.getByRole('button', { name: /Đã xem cảnh báo/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(acknowledgeSpy).toHaveBeenCalledWith(42, { immediateInstructions: null });
    });
  });
});
