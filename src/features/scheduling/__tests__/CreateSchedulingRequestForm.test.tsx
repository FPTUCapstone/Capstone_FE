import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateSchedulingRequestForm } from '../components/CreateSchedulingRequestForm';
import * as schedulingApi from '../services/schedulingApi';
import * as preferencesStorage from '@/features/account/preferences/travelPreferencesStorage';
import {
  TRIPMATE_TIME_ZONE,
  getVietnamCalendarDate,
  getVietnamTomorrowDateString,
  buildVietnamStartAtIso,
  isFutureVietnamStartAt,
} from '../types/schedulingTypes';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('CreateSchedulingRequestForm (UC-10)', () => {
  const mockSuccessResponse = {
    success: true,
    messageCode: 'MSG30',
    message: 'Khởi tạo lịch trình thành công!',
    data: {
      schedulingRequestId: 10,
      itineraryId: 888,
      title: 'Lịch trình Đà Nẵng',
      status: 'OptimalGenerated',
      totalEstimatedCost: 650000,
      totalDurationMinutes: 480,
      items: [],
    },
  };

  beforeEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
    localStorage.clear();
  });

  it('renders all form cards and inputs correctly with Section 4 as Budget only', () => {
    render(<CreateSchedulingRequestForm />);

    expect(screen.getByText(/1\. Điểm đến & Vị trí khởi hành/i)).toBeDefined();
    expect(screen.getByText(/2\. Thời gian & Thời lượng chuyến đi/i)).toBeDefined();
    expect(screen.getByText(/3\. Phương tiện & Nhịp độ di chuyển/i)).toBeDefined();
    expect(screen.getByText(/4\. Ngân sách/i)).toBeDefined();
    expect(screen.queryByText(/Ngân sách & Sở thích trải nghiệm/i)).toBeNull();
    expect(screen.getByRole('button', { name: /Tạo lịch trình tối ưu/i })).toBeDefined();
  });

  /* ------------------------------------------------------------------ */
  /* [P1] StartAt past validation under Asia/Ho_Chi_Minh                */
  /* ------------------------------------------------------------------ */
  describe('[P1] StartAt past validation under Asia/Ho_Chi_Minh', () => {
    describe('Timezone helpers', () => {
      it('builds canonical Vietnam ISO instant with +07:00 offset', () => {
        const iso = buildVietnamStartAtIso('2026-10-01', '19:30');
        expect(iso).toBe('2026-10-01T19:30:00+07:00');
        expect(TRIPMATE_TIME_ZONE).toBe('Asia/Ho_Chi_Minh');
      });

      it('CASE FE-6: correctly evaluates Vietnam calendar date across UTC midnight boundary', () => {
        // UTC 17:30:00 on Sept 30 is 00:30:00 on Oct 01 in Vietnam (UTC+7)
        const boundaryDate = new Date('2026-09-30T17:30:00.000Z');
        expect(getVietnamCalendarDate(boundaryDate)).toBe('2026-10-01');
        expect(getVietnamTomorrowDateString(boundaryDate)).toBe('2026-10-02');
      });

      it('evaluates whether start instant is in the future accurately', () => {
        // Reference time: 2026-10-01 19:30:00 Vietnam time (12:30:00 UTC)
        const refTime = new Date('2026-10-01T12:30:00.000Z');

        // Past time on same day
        expect(isFutureVietnamStartAt('2026-10-01', '18:00', refTime)).toBe(false);

        // Exact equal time on same day
        expect(isFutureVietnamStartAt('2026-10-01', '19:30', refTime)).toBe(false);

        // Future time on same day
        expect(isFutureVietnamStartAt('2026-10-01', '20:00', refTime)).toBe(true);

        // Tomorrow
        expect(isFutureVietnamStartAt('2026-10-02', '08:00', refTime)).toBe(true);

        // Yesterday
        expect(isFutureVietnamStartAt('2026-09-30', '22:00', refTime)).toBe(false);
      });
    });

    it('CASE FE-1: rejects Vietnam today with a past start time and does NOT call backend', async () => {
      // Mock clock: 2026-10-01 19:30:00 Vietnam time (12:30 UTC)
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-10-01T12:30:00.000Z'));

      const createSpy = vi.spyOn(schedulingApi, 'createSchedulingRequest');

      render(<CreateSchedulingRequestForm />);

      // Select today (2026-10-01) and past time (18:00)
      const dateInput = screen.getByLabelText(/Ngày bắt đầu/i);
      fireEvent.change(dateInput, { target: { value: '2026-10-01' } });

      const timeInput = screen.getByLabelText(/Giờ xuất phát/i);
      fireEvent.change(timeInput, { target: { value: '18:00' } });

      const submitBtn = screen.getByRole('button', { name: /Tạo lịch trình tối ưu/i });
      fireEvent.click(submitBtn);

      expect(
        screen.getByText(
          /Thời gian bắt đầu phải sau thời điểm hiện tại theo giờ Việt Nam \(Asia\/Ho_Chi_Minh\)\./i,
        ),
      ).toBeDefined();
      expect(createSpy).not.toHaveBeenCalled();
    });

    it('CASE FE-2: rejects Vietnam today with exact current minute / instant', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-10-01T12:30:00.000Z')); // 19:30 Vietnam

      const createSpy = vi.spyOn(schedulingApi, 'createSchedulingRequest');

      render(<CreateSchedulingRequestForm />);

      const dateInput = screen.getByLabelText(/Ngày bắt đầu/i);
      fireEvent.change(dateInput, { target: { value: '2026-10-01' } });

      const timeInput = screen.getByLabelText(/Giờ xuất phát/i);
      fireEvent.change(timeInput, { target: { value: '19:30' } });

      const submitBtn = screen.getByRole('button', { name: /Tạo lịch trình tối ưu/i });
      fireEvent.click(submitBtn);

      expect(
        screen.getByText(
          /Thời gian bắt đầu phải sau thời điểm hiện tại theo giờ Việt Nam \(Asia\/Ho_Chi_Minh\)\./i,
        ),
      ).toBeDefined();
      expect(createSpy).not.toHaveBeenCalled();
    });

    it('CASE FE-3: allows Vietnam today with future start time', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-10-01T01:00:00.000Z')); // 08:00 Vietnam time

      const createSpy = vi
        .spyOn(schedulingApi, 'createSchedulingRequest')
        .mockResolvedValueOnce(mockSuccessResponse);

      render(<CreateSchedulingRequestForm />);

      const dateInput = screen.getByLabelText(/Ngày bắt đầu/i);
      fireEvent.change(dateInput, { target: { value: '2026-10-01' } });

      // Start at 09:00 (future by 1 hour) with 3 hours duration so it completes before 24:00
      const timeInput = screen.getByLabelText(/Giờ xuất phát/i);
      fireEvent.change(timeInput, { target: { value: '09:00' } });

      const quickPresetBtn = screen.getByRole('button', { name: /3 giờ \(Nửa buổi\)/i });
      fireEvent.click(quickPresetBtn);

      const submitBtn = screen.getByRole('button', { name: /Tạo lịch trình tối ưu/i });
      fireEvent.click(submitBtn);

      // Fast-forward CSP progression timers (400ms + 500ms + 500ms)
      await vi.advanceTimersByTimeAsync(1500);

      expect(createSpy).toHaveBeenCalledTimes(1);
      const payload = createSpy.mock.calls[0][0];
      expect(payload.startAt).toBe('2026-10-01T09:00:00+07:00');
      expect(payload.timeZoneId).toBe('Asia/Ho_Chi_Minh');
    });

    it('CASE FE-4: rejects previous calendar date', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-10-01T12:00:00.000Z')); // 2026-10-01 19:00 Vietnam

      render(<CreateSchedulingRequestForm />);

      const dateInput = screen.getByLabelText(/Ngày bắt đầu/i);
      fireEvent.change(dateInput, { target: { value: '2026-09-30' } });

      const submitBtn = screen.getByRole('button', { name: /Tạo lịch trình tối ưu/i });
      fireEvent.click(submitBtn);

      expect(screen.getByText(/Ngày bắt đầu chuyến đi không thể ở trong quá khứ/i)).toBeDefined();
    });

    it('CASE FE-5: allows tomorrow date', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-10-01T12:00:00.000Z')); // 2026-10-01 19:00 Vietnam

      const createSpy = vi
        .spyOn(schedulingApi, 'createSchedulingRequest')
        .mockResolvedValueOnce(mockSuccessResponse);

      render(<CreateSchedulingRequestForm />);

      const dateInput = screen.getByLabelText(/Ngày bắt đầu/i) as HTMLInputElement;
      expect(dateInput.value).toBe('2026-10-02'); // Defaults to Vietnam tomorrow

      const submitBtn = screen.getByRole('button', { name: /Tạo lịch trình tối ưu/i });
      fireEvent.click(submitBtn);

      await vi.advanceTimersByTimeAsync(1500);

      expect(createSpy).toHaveBeenCalledTimes(1);
      expect(createSpy.mock.calls[0][0].startAt).toContain('2026-10-02');
    });

    it('CASE FE-6: date input min attribute reflects Vietnam calendar date', () => {
      vi.useFakeTimers();
      // UTC 2026-09-30 17:30 -> Vietnam 2026-10-01 00:30
      vi.setSystemTime(new Date('2026-09-30T17:30:00.000Z'));

      render(<CreateSchedulingRequestForm />);

      const dateInput = screen.getByLabelText(/Ngày bắt đầu/i) as HTMLInputElement;
      expect(dateInput.min).toBe('2026-10-01');
    });

    it('CASE FE-7: immediately re-validates right before network POST and blocks if start time elapsed', async () => {
      vi.useFakeTimers();
      // Initially: 2026-10-01 19:29:59 Vietnam (future by 1 second for 19:30)
      vi.setSystemTime(new Date('2026-10-01T12:29:59.000Z'));

      const createSpy = vi.spyOn(schedulingApi, 'createSchedulingRequest');

      render(<CreateSchedulingRequestForm />);

      const dateInput = screen.getByLabelText(/Ngày bắt đầu/i);
      fireEvent.change(dateInput, { target: { value: '2026-10-01' } });

      const timeInput = screen.getByLabelText(/Giờ xuất phát/i);
      fireEvent.change(timeInput, { target: { value: '19:30' } });

      const quickPresetBtn = screen.getByRole('button', { name: /3 giờ \(Nửa buổi\)/i });
      fireEvent.click(quickPresetBtn);

      const submitBtn = screen.getByRole('button', { name: /Tạo lịch trình tối ưu/i });
      fireEvent.click(submitBtn);

      // Advance timers by 2 seconds during the 1.4s progression so clock becomes 19:30:01
      await vi.advanceTimersByTimeAsync(2000);

      // Pre-request check caught the elapsed time
      expect(createSpy).not.toHaveBeenCalled();
      expect(
        screen.getByText(/Thời gian bắt đầu đã trôi qua trong quá trình khởi tạo/i),
      ).toBeDefined();
    });

    it('CASE FE-8: sends verified startAt and timeZoneId Asia/Ho_Chi_Minh in payload', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-10-01T01:00:00.000Z'));

      const createSpy = vi
        .spyOn(schedulingApi, 'createSchedulingRequest')
        .mockResolvedValueOnce(mockSuccessResponse);

      render(<CreateSchedulingRequestForm />);

      const dateInput = screen.getByLabelText(/Ngày bắt đầu/i);
      fireEvent.change(dateInput, { target: { value: '2026-10-05' } });

      const timeInput = screen.getByLabelText(/Giờ xuất phát/i);
      fireEvent.change(timeInput, { target: { value: '10:00' } });

      const submitBtn = screen.getByRole('button', { name: /Tạo lịch trình tối ưu/i });
      fireEvent.click(submitBtn);

      await vi.advanceTimersByTimeAsync(1500);

      expect(createSpy).toHaveBeenCalledTimes(1);
      const payload = createSpy.mock.calls[0][0];
      expect(payload.startAt).toBe('2026-10-05T10:00:00+07:00');
      expect(payload.timeZoneId).toBe('Asia/Ho_Chi_Minh');
    });
  });

  /* ------------------------------------------------------------------ */
  /* [P1-1] Starting location truthfulness tests                        */
  /* ------------------------------------------------------------------ */
  describe('[P1-1] Starting location truthfulness', () => {
    it('renders start location as a readonly input with truthful helper text', () => {
      render(<CreateSchedulingRequestForm />);

      const startAddrInput = screen.getByLabelText(/Điểm xuất phát mặc định/i) as HTMLInputElement;
      expect(startAddrInput).toBeDefined();
      expect(startAddrInput.readOnly).toBe(true);
      expect(startAddrInput.value).toBe('Trung tâm Hải Châu / Cầu Rồng, Đà Nẵng');

      expect(
        screen.getByText(/TripMate hiện sử dụng điểm xuất phát mặc định của khu vực đã chọn/i),
      ).toBeDefined();
      expect(screen.getByText(/Tọa độ: 16\.0544, 108\.2022/i)).toBeDefined();
    });

    it('updates preset start location and coordinates when destination preset changes', () => {
      render(<CreateSchedulingRequestForm />);

      const select = screen.getByLabelText(/Thành phố \/ Điểm đến/i);
      fireEvent.change(select, { target: { value: 'hoian' } });

      const startAddrInput = screen.getByLabelText(/Điểm xuất phát mặc định/i) as HTMLInputElement;
      expect(startAddrInput.readOnly).toBe(true);
      expect(startAddrInput.value).toContain('Hội An');
      expect(screen.getByText(/Tọa độ: 15\.8801, 108\.3380/i)).toBeDefined();
    });

    it('submits payload with exact coordinates matching the displayed preset', async () => {
      const createSpy = vi
        .spyOn(schedulingApi, 'createSchedulingRequest')
        .mockResolvedValueOnce(mockSuccessResponse);

      render(<CreateSchedulingRequestForm />);

      const select = screen.getByLabelText(/Thành phố \/ Điểm đến/i);
      fireEvent.change(select, { target: { value: 'hue' } });

      const submitBtn = screen.getByRole('button', { name: /Tạo lịch trình tối ưu/i });
      fireEvent.click(submitBtn);

      await waitFor(
        () => {
          expect(createSpy).toHaveBeenCalledTimes(1);
        },
        { timeout: 4000 },
      );

      const submittedPayload = createSpy.mock.calls[0][0];
      expect(submittedPayload.startLatitude).toBe(16.4637);
      expect(submittedPayload.startLongitude).toBe(107.5909);
      expect(submittedPayload.explorationLatitude).toBe(16.4637);
      expect(submittedPayload.explorationLongitude).toBe(107.5909);
    });
  });

  /* ------------------------------------------------------------------ */
  /* [P1-2] Interests preference claim & payload truthfulness          */
  /* ------------------------------------------------------------------ */
  describe('[P1-2] Interests preference claim & payload truthfulness', () => {
    it('does NOT render editable experience interest tags or controls', () => {
      render(<CreateSchedulingRequestForm />);

      expect(screen.queryByText(/Sở thích & Chủ đề tham quan/i)).toBeNull();
      expect(screen.queryByRole('button', { name: /Ẩm thực/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /Thiên nhiên/i })).toBeNull();
      expect(screen.queryByRole('button', { name: /Văn hóa & Lịch sử/i })).toBeNull();
    });

    it('pre-fills supported preferences (transport, pace, budget) without claiming interests are applied', () => {
      vi.spyOn(preferencesStorage, 'loadStoredPreferences').mockReturnValueOnce({
        interests: ['food', 'relaxation'],
        travelStyle: 'couple',
        budgetLevel: 'premium',
        preferredTransport: 'car',
        travelPace: 'relaxed',
        foodPreference: 'noRestriction',
        autoApplyToPlans: true,
      });

      render(<CreateSchedulingRequestForm userId={123} />);

      expect(
        screen.getByText(
          /TripMate đã tự động điền các thiết lập được UC-10 hỗ trợ hiện tại như phương tiện, nhịp độ và ngân sách/i,
        ),
      ).toBeDefined();
      expect(screen.queryByText(/sở thích trải nghiệm/i)).toBeNull();
      expect(screen.getByText(/6 giờ \(360 phút\)/i)).toBeDefined();
    });

    it('does NOT include any invented interest fields in backend payload', async () => {
      const createSpy = vi
        .spyOn(schedulingApi, 'createSchedulingRequest')
        .mockResolvedValueOnce(mockSuccessResponse);

      render(<CreateSchedulingRequestForm />);

      const submitBtn = screen.getByRole('button', { name: /Tạo lịch trình tối ưu/i });
      fireEvent.click(submitBtn);

      await waitFor(
        () => {
          expect(createSpy).toHaveBeenCalledTimes(1);
        },
        { timeout: 4000 },
      );

      const submittedPayload = createSpy.mock.calls[0][0];
      expect(submittedPayload).not.toHaveProperty('interests');
      expect(submittedPayload).not.toHaveProperty('interestTags');
      expect(submittedPayload).not.toHaveProperty('interestIds');
      expect(submittedPayload).not.toHaveProperty('preferenceTags');
    });

    it('safely handles corrupted localStorage preferences by consuming sanitized canonical defaults', () => {
      localStorage.setItem(
        'tripmate_travel_preferences_456',
        JSON.stringify({
          preferredTransport: 'teleport',
          travelPace: 'turbo',
          travelStyle: 'spaceship',
          budgetLevel: 'billionaire',
        }),
      );

      render(<CreateSchedulingRequestForm userId={456} />);

      const motorbikeBtn = screen.getByRole('button', { name: /Xe máy/i });
      expect(motorbikeBtn.className).toContain('border-[#007d6e]');
      expect(screen.getByText(/8 giờ \(480 phút\)/i)).toBeDefined();
    });

    it('safely handles malformed JSON in localStorage and initializes form with defaults', () => {
      localStorage.setItem('tripmate_travel_preferences_789', '{invalid-json:broken');

      render(<CreateSchedulingRequestForm userId={789} />);

      const motorbikeBtn = screen.getByRole('button', { name: /Xe máy/i });
      expect(motorbikeBtn.className).toContain('border-[#007d6e]');
    });

    it('safely initializes when stored interests array is empty []', () => {
      localStorage.setItem(
        'tripmate_travel_preferences_empty',
        JSON.stringify({
          interests: [],
          travelStyle: 'solo',
          budgetLevel: 'standard',
          preferredTransport: 'walking',
          travelPace: 'relaxed',
          foodPreference: 'noRestriction',
          autoApplyToPlans: true,
        }),
      );

      render(<CreateSchedulingRequestForm userId="empty" />);

      const walkingBtn = screen.getByRole('button', { name: /Đi bộ/i });
      expect(walkingBtn.className).toContain('border-[#007d6e]');
      expect(screen.getByText(/6 giờ \(360 phút\)/i)).toBeDefined();
    });
  });

  /* ------------------------------------------------------------------ */
  /* [P1-3] Idempotency retry lifecycle tests                          */
  /* ------------------------------------------------------------------ */
  describe('[P1-3] Idempotency-Key retry semantics', () => {
    it('CASE A & B (FE-9): generates K1 on first submit and reuses exact same K1 across retries on network failure', async () => {
      const createSpy = vi
        .spyOn(schedulingApi, 'createSchedulingRequest')
        .mockRejectedValueOnce(new Error('Network disconnected'))
        .mockResolvedValueOnce(mockSuccessResponse);

      render(<CreateSchedulingRequestForm />);

      const submitBtn = screen.getByRole('button', { name: /Tạo lịch trình tối ưu/i });

      // First submit -> fails with network error
      fireEvent.click(submitBtn);

      await waitFor(
        () => {
          expect(createSpy).toHaveBeenCalledTimes(1);
          expect(screen.getByText(/Không thể tạo lịch trình tối ưu/i)).toBeDefined();
        },
        { timeout: 4000 },
      );

      const firstKey = createSpy.mock.calls[0][1]?.idempotencyKey;
      expect(firstKey).toBeTruthy();

      // Re-query button after submission state reset and retry
      const retryBtn = screen.getByRole('button', { name: /Tạo lịch trình tối ưu/i });
      fireEvent.click(retryBtn);

      await waitFor(
        () => {
          expect(createSpy).toHaveBeenCalledTimes(2);
        },
        { timeout: 4000 },
      );

      const secondKey = createSpy.mock.calls[1][1]?.idempotencyKey;
      expect(secondKey).toBe(firstKey);
    }, 10000);

    it('CASE C: reuses exact same key K1 when retrying after a 500 server error', async () => {
      const createSpy = vi
        .spyOn(schedulingApi, 'createSchedulingRequest')
        .mockRejectedValueOnce({ status: 500, message: 'Internal Server Error' })
        .mockResolvedValueOnce(mockSuccessResponse);

      render(<CreateSchedulingRequestForm />);

      const submitBtn = screen.getByRole('button', { name: /Tạo lịch trình tối ưu/i });

      // First attempt
      fireEvent.click(submitBtn);

      await waitFor(
        () => {
          expect(createSpy).toHaveBeenCalledTimes(1);
          expect(screen.getByText(/Internal Server Error/i)).toBeDefined();
        },
        { timeout: 4000 },
      );

      const firstKey = createSpy.mock.calls[0][1]?.idempotencyKey;

      // Re-query button after error state reset and retry
      const retryBtn = screen.getByRole('button', { name: /Tạo lịch trình tối ưu/i });
      fireEvent.click(retryBtn);

      await waitFor(
        () => {
          expect(createSpy).toHaveBeenCalledTimes(2);
        },
        { timeout: 4000 },
      );

      const retryKey = createSpy.mock.calls[1][1]?.idempotencyKey;
      expect(retryKey).toBe(firstKey);
    }, 10000);

    it('CASE D & E (FE-10): generates a new key K2 != K1 when user materially changes payload after failure', async () => {
      const createSpy = vi
        .spyOn(schedulingApi, 'createSchedulingRequest')
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockSuccessResponse);

      render(<CreateSchedulingRequestForm />);

      const submitBtn = screen.getByRole('button', { name: /Tạo lịch trình tối ưu/i });

      // First submit
      fireEvent.click(submitBtn);

      await waitFor(
        () => {
          expect(createSpy).toHaveBeenCalledTimes(1);
        },
        { timeout: 4000 },
      );

      const key1 = createSpy.mock.calls[0][1]?.idempotencyKey;

      // User changes budget materially
      const budgetInput = screen.getByLabelText(/Ngân sách dự kiến/i);
      fireEvent.change(budgetInput, { target: { value: '1500000' } });

      // Re-query submit button and submit updated payload
      const secondSubmitBtn = screen.getByRole('button', { name: /Tạo lịch trình tối ưu/i });
      fireEvent.click(secondSubmitBtn);

      await waitFor(
        () => {
          expect(createSpy).toHaveBeenCalledTimes(2);
        },
        { timeout: 4000 },
      );

      const key2 = createSpy.mock.calls[1][1]?.idempotencyKey;
      expect(key2).toBeTruthy();
      expect(key2).not.toBe(key1);
    }, 10000);

    it('CASE F: generates a new key when transport mode is changed', async () => {
      const createSpy = vi
        .spyOn(schedulingApi, 'createSchedulingRequest')
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce(mockSuccessResponse);

      render(<CreateSchedulingRequestForm />);

      const submitBtn = screen.getByRole('button', { name: /Tạo lịch trình tối ưu/i });
      fireEvent.click(submitBtn);

      await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(1), { timeout: 4000 });
      const key1 = createSpy.mock.calls[0][1]?.idempotencyKey;

      // Change transport to Car
      const carBtn = screen.getByRole('button', { name: /Ô tô \/ Taxi/i });
      fireEvent.click(carBtn);

      const retryBtn = screen.getByRole('button', { name: /Tạo lịch trình tối ưu/i });
      fireEvent.click(retryBtn);
      await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(2), { timeout: 4000 });
      const key2 = createSpy.mock.calls[1][1]?.idempotencyKey;

      expect(key2).not.toBe(key1);
    }, 10000);

    it('CASE G: generates a new key when destination preset is changed', async () => {
      const createSpy = vi
        .spyOn(schedulingApi, 'createSchedulingRequest')
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce(mockSuccessResponse);

      render(<CreateSchedulingRequestForm />);

      const submitBtn = screen.getByRole('button', { name: /Tạo lịch trình tối ưu/i });
      fireEvent.click(submitBtn);

      await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(1), { timeout: 4000 });
      const key1 = createSpy.mock.calls[0][1]?.idempotencyKey;

      // Change destination to Hội An
      const destSelect = screen.getByLabelText(/Thành phố \/ Điểm đến/i);
      fireEvent.change(destSelect, { target: { value: 'hoian' } });

      const retryBtn = screen.getByRole('button', { name: /Tạo lịch trình tối ưu/i });
      fireEvent.click(retryBtn);
      await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(2), { timeout: 4000 });
      const key2 = createSpy.mock.calls[1][1]?.idempotencyKey;

      expect(key2).not.toBe(key1);
    }, 10000);
  });

  /* ------------------------------------------------------------------ */
  /* Standard Form Validation & Submission Tests                        */
  /* ------------------------------------------------------------------ */
  it('updates duration and live end-time calculation', () => {
    render(<CreateSchedulingRequestForm />);

    const timeInput = screen.getByLabelText(/Giờ xuất phát/i);
    fireEvent.change(timeInput, { target: { value: '09:00' } });

    const quickPresetBtn = screen.getByRole('button', { name: /3 giờ \(Nửa buổi\)/i });
    fireEvent.click(quickPresetBtn);

    expect(screen.getByText('12:00')).toBeDefined();
    expect(screen.getByText(/Cùng ngày ✓/i)).toBeDefined();
  });

  it('shows error if budget is zero or negative', async () => {
    render(<CreateSchedulingRequestForm />);

    const budgetInput = screen.getByLabelText(/Ngân sách dự kiến/i);
    fireEvent.change(budgetInput, { target: { value: '-50000' } });

    const submitBtn = screen.getByRole('button', { name: /Tạo lịch trình tối ưu/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Ngân sách dự kiến phải lớn hơn 0 VNĐ/i)).toBeDefined();
    });
  });

  it('submits form and calls onSuccess when API responds successfully', async () => {
    vi.spyOn(schedulingApi, 'createSchedulingRequest').mockResolvedValueOnce(mockSuccessResponse);
    const onSuccessMock = vi.fn();

    render(<CreateSchedulingRequestForm onSuccess={onSuccessMock} />);

    const submitBtn = screen.getByRole('button', { name: /Tạo lịch trình tối ưu/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Đang khởi tạo lịch trình tối ưu với thuật toán CSP/i)).toBeDefined();
    });

    await waitFor(
      () => {
        expect(onSuccessMock).toHaveBeenCalledWith(mockSuccessResponse.data);
      },
      { timeout: 4000 },
    );
  });
});
