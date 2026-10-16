import React from 'react';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateSchedulingRequestForm } from '../components/CreateSchedulingRequestForm';
import * as schedulingApi from '../services/schedulingApi';
import * as placeSearchApi from '../services/placeSearchApi';
import * as preferencesApi from '@/features/account/preferences/travelPreferencesApi';
import {
  TRIPMATE_TIME_ZONE,
  getVietnamCalendarDate,
  getVietnamTomorrowDateString,
  buildVietnamStartAtIso,
  isFutureVietnamStartAt,
} from '../types/schedulingTypes';

const CHAM_MUSEUM = {
  id: 10003,
  name: 'Da Nang Museum of Cham Sculpture',
  categoryName: 'Museum',
  address: '02 September 2 Street, Hai Chau, Da Nang',
  latitude: 16.040393,
  longitude: 108.223058,
};
const MY_KHE = {
  id: 20007,
  name: 'Bãi biển Mỹ Khê',
  categoryName: 'Beach',
  address: null,
  latitude: 16.069967,
  longitude: 108.246066,
};

vi.mock('../services/placeSearchApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../services/placeSearchApi')>()),
  getBrowserLocation: vi.fn(async () => ({ latitude: 15.9686, longitude: 108.2607 })),
  searchSelectablePois: vi.fn(async () => [CHAM_MUSEUM, MY_KHE]),
  isAddressSearchAvailable: () => false,
}));

vi.mock('../components/maps/LazyMaps', () => ({
  LazyRadiusMap: ({
    center,
    radiusKm,
  }: {
    center: { latitude: number; longitude: number };
    radiusKm: number;
  }) => <div data-testid="radius-map">{`${center.latitude},${center.longitude}:${radiusKm}`}</div>,
  LazyItineraryMap: () => null,
}));

async function flush() {
  for (let i = 0; i < 5; i++) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

/** Opens a place field, searches and picks the place with the given name. */
async function pickPlace(fieldName: RegExp, placeName: string) {
  fireEvent.click(screen.getByRole('button', { name: fieldName }));
  const dialog = screen.getByRole('dialog');
  fireEvent.click(within(dialog).getByRole('button', { name: 'Tìm' }));
  await flush();
  fireEvent.click(within(dialog).getByRole('button', { name: new RegExp(placeName) }));
  await flush();
}

/** Start from the current location and explore around the Cham museum. */
async function chooseStartAndArea() {
  fireEvent.click(screen.getByRole('button', { name: /Dùng vị trí hiện tại/ }));
  await flush();
  await pickPlace(/^Khu vực khám phá:/, CHAM_MUSEUM.name);
}

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

    expect(screen.getByText(/1\. Điểm xuất phát & khu vực khám phá/i)).toBeDefined();
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
      await chooseStartAndArea();

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
      await chooseStartAndArea();

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
      await chooseStartAndArea();

      const dateInput = screen.getByLabelText(/Ngày bắt đầu/i);
      fireEvent.change(dateInput, { target: { value: '2026-10-01' } });

      // Start at 09:00 (future by 1 hour) with 3 hours duration so it completes before 24:00
      const timeInput = screen.getByLabelText(/Giờ xuất phát/i);
      fireEvent.change(timeInput, { target: { value: '09:00' } });

      fireEvent.change(screen.getByLabelText('Số giờ'), { target: { value: '3' } });

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
      await chooseStartAndArea();

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
      await chooseStartAndArea();

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
      await chooseStartAndArea();

      const dateInput = screen.getByLabelText(/Ngày bắt đầu/i);
      fireEvent.change(dateInput, { target: { value: '2026-10-01' } });

      const timeInput = screen.getByLabelText(/Giờ xuất phát/i);
      fireEvent.change(timeInput, { target: { value: '19:30' } });

      fireEvent.change(screen.getByLabelText('Số giờ'), { target: { value: '3' } });

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
      await chooseStartAndArea();

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
  describe('[P1-1] Starting point, area, finish and must-see places (same as mobile)', () => {
    it('has no city presets and starts with nothing chosen', () => {
      render(<CreateSchedulingRequestForm />);

      expect(screen.queryByLabelText(/Thành phố \/ Điểm đến/i)).toBeNull();
      expect(screen.getByTestId('start-point-label').textContent).toBe('Chưa chọn điểm xuất phát');
      expect(
        (screen.getByRole('button', { name: /^Khu vực khám phá:/ }) as HTMLButtonElement).disabled,
      ).toBe(true);
    });

    it('requires a starting point and an area before generating', async () => {
      const createSpy = vi.spyOn(schedulingApi, 'createSchedulingRequest');
      render(<CreateSchedulingRequestForm />);

      fireEvent.click(screen.getByRole('button', { name: /Tạo lịch trình tối ưu/i }));

      expect(await screen.findByText('Vui lòng chọn điểm xuất phát.')).toBeDefined();
      expect(screen.getByText('Vui lòng chọn khu vực muốn khám phá.')).toBeDefined();
      expect(createSpy).not.toHaveBeenCalled();
    });

    it('keeps "Finish at" locked while returning to the start, with the reason', async () => {
      render(<CreateSchedulingRequestForm />);
      await chooseStartAndArea();

      const finish = screen.getByRole('button', { name: /^Điểm kết thúc:/ }) as HTMLButtonElement;
      expect(finish.disabled).toBe(true);
      expect(finish.textContent).toContain('Bỏ chọn "Quay về điểm xuất phát"');

      fireEvent.click(screen.getByLabelText(/Quay về điểm xuất phát khi kết thúc hành trình/));
      expect(
        (screen.getByRole('button', { name: /^Điểm kết thúc:/ }) as HTMLButtonElement).disabled,
      ).toBe(false);
    });

    it('sends the chosen coordinates, finish POI and must-see places', async () => {
      const createSpy = vi
        .spyOn(schedulingApi, 'createSchedulingRequest')
        .mockResolvedValueOnce(mockSuccessResponse);
      render(<CreateSchedulingRequestForm />);
      await chooseStartAndArea();

      fireEvent.click(screen.getByLabelText(/Quay về điểm xuất phát khi kết thúc hành trình/));
      await pickPlace(/^Điểm kết thúc:/, MY_KHE.name);
      await pickPlace(/Thêm địa điểm muốn ghé/, MY_KHE.name);

      fireEvent.click(screen.getByRole('button', { name: /Tạo lịch trình tối ưu/i }));
      await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(1), { timeout: 4000 });

      const payload = createSpy.mock.calls[0][0];
      expect(payload.startLatitude).toBe(15.9686);
      expect(payload.startLongitude).toBe(108.2607);
      expect(payload.explorationLatitude).toBe(CHAM_MUSEUM.latitude);
      expect(payload.explorationLongitude).toBe(CHAM_MUSEUM.longitude);
      expect(payload.returnToStart).toBe(false);
      expect(payload.endPoiId).toBe(MY_KHE.id);
      expect(payload.mandatoryPoiIds).toEqual([MY_KHE.id]);
    });

    it('requires a finish place when not returning to the start', async () => {
      const createSpy = vi.spyOn(schedulingApi, 'createSchedulingRequest');
      render(<CreateSchedulingRequestForm />);
      await chooseStartAndArea();

      fireEvent.click(screen.getByLabelText(/Quay về điểm xuất phát khi kết thúc hành trình/));
      fireEvent.click(screen.getByRole('button', { name: /Tạo lịch trình tối ưu/i }));

      expect(
        await screen.findByText('Chọn điểm kết thúc hoặc bật "Quay về điểm xuất phát".'),
      ).toBeDefined();
      expect(createSpy).not.toHaveBeenCalled();
    });

    it('clears must-see places when the area changes', async () => {
      render(<CreateSchedulingRequestForm />);
      await chooseStartAndArea();
      await pickPlace(/Thêm địa điểm muốn ghé/, MY_KHE.name);
      expect(screen.getByRole('button', { name: `Bỏ ${MY_KHE.name}` })).toBeDefined();

      await pickPlace(/^Khu vực khám phá:/, MY_KHE.name);

      expect(screen.queryByRole('button', { name: `Bỏ ${MY_KHE.name}` })).toBeNull();
    });

    it('allows a search radius up to 100 km and uses it for must-see places and the request', async () => {
      const createSpy = vi
        .spyOn(schedulingApi, 'createSchedulingRequest')
        .mockResolvedValueOnce(mockSuccessResponse);
      render(<CreateSchedulingRequestForm />);
      await chooseStartAndArea();

      const slider = screen.getByLabelText(/Bán kính tìm kiếm điểm tham quan xung quanh/);
      expect(slider.getAttribute('max')).toBe('100');
      fireEvent.change(slider, { target: { value: '100' } });
      expect(screen.getByText('100 km')).toBeDefined();

      await pickPlace(/Thêm địa điểm muốn ghé/, MY_KHE.name);
      expect(vi.mocked(placeSearchApi.searchSelectablePois)).toHaveBeenLastCalledWith(
        expect.objectContaining({ radiusKm: 100 }),
      );

      fireEvent.click(screen.getByRole('button', { name: /Tạo lịch trình tối ưu/i }));
      await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(1), { timeout: 4000 });
      expect(createSpy.mock.calls[0][0].searchRadiusKm).toBe(100);
    });

    it('warns only when the radius is wider than 30 km (Review 2, D9)', () => {
      render(<CreateSchedulingRequestForm />);

      const slider = screen.getByLabelText(/Bán kính tìm kiếm điểm tham quan xung quanh/);
      expect((slider as HTMLInputElement).value).toBe('10');
      expect(screen.queryByText(/khá rộng/)).toBeNull();

      fireEvent.change(slider, { target: { value: '30' } });
      expect(screen.queryByText(/khá rộng/)).toBeNull();

      fireEvent.change(slider, { target: { value: '45' } });
      expect(screen.getByText(/Bán kính 45 km khá rộng/)).toBeDefined();
    });

    it('draws the exploration radius on a map that follows the slider when Mapbox is configured (D9)', async () => {
      vi.stubEnv('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN', 'pk.test');
      try {
        render(<CreateSchedulingRequestForm />);
        expect(screen.queryByTestId('radius-map')).toBeNull();

        await chooseStartAndArea();
        expect(screen.getByTestId('radius-map').textContent).toBe(
          `${CHAM_MUSEUM.latitude},${CHAM_MUSEUM.longitude}:10`,
        );

        fireEvent.change(screen.getByLabelText(/Bán kính tìm kiếm điểm tham quan xung quanh/), {
          target: { value: '25' },
        });
        expect(screen.getByTestId('radius-map').textContent).toBe(
          `${CHAM_MUSEUM.latitude},${CHAM_MUSEUM.longitude}:25`,
        );
      } finally {
        vi.unstubAllEnvs();
      }
    });

    it('shows no radius map without a Mapbox token', async () => {
      vi.stubEnv('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN', '');
      try {
        render(<CreateSchedulingRequestForm />);
        await chooseStartAndArea();
        expect(screen.queryByTestId('radius-map')).toBeNull();
      } finally {
        vi.unstubAllEnvs();
      }
    });

    it('excludes restaurants from the must-see picker but not from the area picker (Review 2, D2)', async () => {
      render(<CreateSchedulingRequestForm />);
      await chooseStartAndArea();
      expect(vi.mocked(placeSearchApi.searchSelectablePois)).toHaveBeenLastCalledWith(
        expect.not.objectContaining({ excludeFoodAndDrink: true }),
      );

      await pickPlace(/Thêm địa điểm muốn ghé/, MY_KHE.name);
      expect(vi.mocked(placeSearchApi.searchSelectablePois)).toHaveBeenLastCalledWith(
        expect.objectContaining({ excludeFoodAndDrink: true }),
      );
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

    it('pre-fills only supported transport from the saved server preferences', async () => {
      vi.spyOn(preferencesApi, 'getTravelPreferences').mockResolvedValueOnce({
        ok: true,
        data: {
          interests: [],
          preferredTransportMode: 'Car',
          travelPace: 'Relaxed',
          riskTolerance: null,
          foodPreferences: [],
          updatedAtUtc: null,
        },
      });

      render(<CreateSchedulingRequestForm />);

      expect(
        await screen.findByText(/TripMate đã tự động điền phương tiện từ sở thích du lịch đã lưu của bạn/i),
      ).toBeDefined();
      expect(screen.getByRole('button', { name: /Ô tô/i }).className).toContain('border-[#007d6e]');
      expect((screen.getByLabelText('Số giờ') as HTMLInputElement).value).toBe('8');
      expect(screen.queryByText(/sở thích trải nghiệm/i)).toBeNull();
    });

    it('does NOT include any invented interest fields in backend payload', async () => {
      const createSpy = vi
        .spyOn(schedulingApi, 'createSchedulingRequest')
        .mockResolvedValueOnce(mockSuccessResponse);

      render(<CreateSchedulingRequestForm />);
      await chooseStartAndArea();

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

    it('does not read preferences from browser storage', () => {
      const getItem = vi.spyOn(Storage.prototype, 'getItem');
      vi.spyOn(preferencesApi, 'getTravelPreferences').mockResolvedValueOnce({ ok: false, kind: 'sessionExpired' });

      render(<CreateSchedulingRequestForm userId={789} />);

      expect(getItem).not.toHaveBeenCalledWith(expect.stringContaining('tripmate_travel_preferences'));
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
      await chooseStartAndArea();

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
      await chooseStartAndArea();

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
      await chooseStartAndArea();

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
      await chooseStartAndArea();

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

    it('CASE G: generates a new key when the exploration area is changed', async () => {
      const createSpy = vi
        .spyOn(schedulingApi, 'createSchedulingRequest')
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce(mockSuccessResponse);

      render(<CreateSchedulingRequestForm />);
      await chooseStartAndArea();

      const submitBtn = screen.getByRole('button', { name: /Tạo lịch trình tối ưu/i });
      fireEvent.click(submitBtn);

      await waitFor(() => expect(createSpy).toHaveBeenCalledTimes(1), { timeout: 4000 });
      const key1 = createSpy.mock.calls[0][1]?.idempotencyKey;

      // Explore around another place
      await pickPlace(/^Khu vực khám phá:/, MY_KHE.name);

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
    fireEvent.change(screen.getByLabelText('Số giờ'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Số phút'), { target: { value: '15' } });

    expect(screen.getByText('12:15')).toBeDefined();
    expect(screen.getByText(/\(cùng ngày\)/i)).toBeDefined();
  });

  it('allows a trip that runs past midnight into the next days', () => {
    render(<CreateSchedulingRequestForm />);

    fireEvent.change(screen.getByLabelText(/Giờ xuất phát/i), { target: { value: '20:00' } });
    fireEvent.change(screen.getByLabelText('Số giờ'), { target: { value: '30' } });
    fireEvent.change(screen.getByLabelText('Số phút'), { target: { value: '0' } });

    expect(screen.getByText('02:00')).toBeDefined();
    expect(screen.getByText(/\(sau 2 ngày\)/i)).toBeDefined();
  });

  it.each([
    ['0', '45', 'Thời lượng tối thiểu là 1 giờ.'],
    ['72', '1', 'Thời lượng tối đa là 72 giờ (3 ngày).'],
    ['2', '75', 'Nhập số giờ nguyên và số phút từ 0 đến 59.'],
  ])('rejects %s h %s min', (hours, minutes, message) => {
    render(<CreateSchedulingRequestForm />);

    fireEvent.change(screen.getByLabelText('Số giờ'), { target: { value: hours } });
    fireEvent.change(screen.getByLabelText('Số phút'), { target: { value: minutes } });

    expect(screen.getAllByText(message).length).toBeGreaterThan(0);
  });

  it('shows error if budget is zero or negative', async () => {
    render(<CreateSchedulingRequestForm />);
    await chooseStartAndArea();

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
    await chooseStartAndArea();

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
