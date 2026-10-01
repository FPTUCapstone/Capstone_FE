'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';

import { ActionButton } from '@/components/ui/ActionButton';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { loadStoredPreferences } from '@/features/account/preferences/travelPreferencesStorage';
import { ROUTES } from '@/lib/routes';

import {
  createSchedulingRequest,
  generateIdempotencyKey,
} from '../services/schedulingApi';
import {
  buildVietnamStartAtIso,
  CreateSchedulingRequestPayload,
  DESTINATION_PRESETS,
  DestinationPreset,
  getVietnamCalendarDate,
  getVietnamTomorrowDateString,
  isFutureVietnamStartAt,
  mapPaceToRestPreference,
  mapTransportPreferenceToMode,
  RestPreference,
  SchedulingResponseDto,
  TransportMode,
  TRIPMATE_TIME_ZONE,
} from '../types/schedulingTypes';

interface CreateSchedulingRequestFormProps {
  userId?: string | number | null;
  onSuccess?: (itinerary: SchedulingResponseDto) => void;
}

type PendingSchedulingAttempt = {
  payloadFingerprint: string;
  idempotencyKey: string;
};

export function CreateSchedulingRequestForm({
  userId,
  onSuccess,
}: CreateSchedulingRequestFormProps) {
  // Selected destination preset
  const [selectedDestination, setSelectedDestination] = useState<DestinationPreset>(
    DESTINATION_PRESETS[0],
  );

  // Stored preferences snapshot
  const [initialPreferences] = useState(() => {
    try {
      return loadStoredPreferences(userId);
    } catch {
      return null;
    }
  });

  // Time & duration
  const [startDate, setStartDate] = useState(getVietnamTomorrowDateString());
  const [startTime, setStartTime] = useState('08:00');
  const [availableHours, setAvailableHours] = useState(() => {
    if (initialPreferences?.travelPace === 'relaxed') return 6;
    if (initialPreferences?.travelPace === 'packed') return 10;
    return 8; // 8 hours = 480 mins
  });

  // Constraints
  const [searchRadiusKm, setSearchRadiusKm] = useState(10);
  const [returnToStart, setReturnToStart] = useState(true);
  const [transportMode, setTransportMode] = useState<TransportMode>(() => {
    if (initialPreferences?.preferredTransport) {
      return mapTransportPreferenceToMode(initialPreferences.preferredTransport);
    }
    return 'Motorbike';
  });
  const [restPreference, setRestPreference] = useState<RestPreference>(() => {
    if (initialPreferences?.travelPace) {
      return mapPaceToRestPreference(initialPreferences.travelPace);
    }
    return 'Auto';
  });
  const [budgetVnd, setBudgetVnd] = useState<number | ''>(() => {
    if (initialPreferences?.budgetLevel === 'economy') return 300000;
    if (initialPreferences?.budgetLevel === 'premium') return 2000000;
    return 800000;
  });

  // Preference sync indicator (supported fields: transport, pace/rest, budget)
  const preferencesSynced = Boolean(
    initialPreferences &&
      (initialPreferences.preferredTransport ||
        initialPreferences.travelPace ||
        initialPreferences.budgetLevel),
  );

  // Idempotency attempt tracking across retries
  const attemptRef = useRef<PendingSchedulingAttempt | null>(null);

  // Submission & Optimization state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optimizationPhase, setOptimizationPhase] = useState<string | null>(null);
  const [generatedItinerary, setGeneratedItinerary] = useState<SchedulingResponseDto | null>(null);
  const [feedback, setFeedback] = useState<{
    tone: 'success' | 'warning' | 'error' | 'info';
    title?: string;
    message: string;
  } | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Handle destination change
  const handleDestinationChange = (destId: string) => {
    const dest = DESTINATION_PRESETS.find((d) => d.id === destId);
    if (dest) {
      setSelectedDestination(dest);
      setFeedback(null);
    }
  };


  // Calculate live end time
  const calculateEndTime = () => {
    try {
      const [h, m] = startTime.split(':').map(Number);
      const totalMinutes = h * 60 + m + availableHours * 60;
      const endH = Math.floor(totalMinutes / 60);
      const endM = totalMinutes % 60;
      const formattedEnd = `${String(endH % 24).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      const isNextDay = totalMinutes >= 24 * 60;
      return { formattedEnd, isNextDay };
    } catch {
      return { formattedEnd: '--:--', isNextDay: false };
    }
  };

  const { formattedEnd, isNextDay } = calculateEndTime();

  // Validate form
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!startDate) {
      errors.startDate = 'Vui lòng chọn ngày bắt đầu chuyến đi.';
    } else if (startDate < getVietnamCalendarDate()) {
      errors.startDate = 'Ngày bắt đầu chuyến đi không thể ở trong quá khứ.';
    }

    if (!startTime) {
      errors.startTime = 'Vui lòng chọn giờ bắt đầu.';
    } else if (startDate && !errors.startDate && !isFutureVietnamStartAt(startDate, startTime)) {
      errors.startDate =
        'Thời gian bắt đầu phải sau thời điểm hiện tại theo giờ Việt Nam (Asia/Ho_Chi_Minh).';
    }

    if (availableHours < 1 || availableHours > 12) {
      errors.availableHours = 'Thời lượng chuyến đi phải từ 1 đến 12 giờ (trong ngày).';
    }

    if (isNextDay) {
      errors.availableHours =
        'Theo quy định, lịch trình trong ngày phải kết thúc trước 24:00 cùng ngày. Vui lòng giảm thời lượng hoặc chọn giờ bắt đầu sớm hơn.';
    }

    if (searchRadiusKm < 1 || searchRadiusKm > 50) {
      errors.searchRadiusKm = 'Bán kính tìm kiếm phải từ 1 đến 50 km.';
    }

    if (budgetVnd !== '' && budgetVnd <= 0) {
      errors.budgetVnd = 'Ngân sách dự kiến phải lớn hơn 0 VNĐ.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!validate()) {
      setFeedback({
        tone: 'error',
        title: 'Thông tin chưa hợp lệ',
        message: 'Vui lòng kiểm tra lại các trường thông tin có viền đỏ bên dưới.',
      });
      return;
    }

    setIsSubmitting(true);

    // Live CSP optimization step progression for delightful feedback
    setOptimizationPhase('Kiểm tra trạng thái & giờ mở cửa điểm tham quan...');
    await new Promise((r) => setTimeout(r, 400));

    setOptimizationPhase(
      `Tính toán ma trận thời gian & lộ trình di chuyển (${
        transportMode === 'Walking'
          ? 'Đi bộ'
          : transportMode === 'Motorbike'
          ? 'Xe máy'
          : transportMode === 'Car'
          ? 'Ô tô / Taxi'
          : 'Công cộng'
      })...`,
    );
    await new Promise((r) => setTimeout(r, 500));

    setOptimizationPhase('Chạy thuật toán thỏa mãn ràng buộc CSP (Constraint Satisfaction)...');
    await new Promise((r) => setTimeout(r, 500));

    // Authoritative pre-request check: verify start instant is still in the future right before POST
    if (!isFutureVietnamStartAt(startDate, startTime)) {
      setValidationErrors((prev) => ({
        ...prev,
        startDate:
          'Thời gian bắt đầu phải sau thời điểm hiện tại theo giờ Việt Nam (Asia/Ho_Chi_Minh).',
      }));
      setFeedback({
        tone: 'error',
        title: 'Thông tin chưa hợp lệ',
        message:
          'Thời gian bắt đầu đã trôi qua trong quá trình khởi tạo. Vui lòng chọn lại giờ bắt đầu ở tương lai.',
      });
      setIsSubmitting(false);
      setOptimizationPhase(null);
      return;
    }

    // Construct backend payload
    const startAtIso = buildVietnamStartAtIso(startDate, startTime);
    const payload: CreateSchedulingRequestPayload = {
      startAt: startAtIso,
      timeZoneId: TRIPMATE_TIME_ZONE,
      startLatitude: selectedDestination.defaultStartLatitude,
      startLongitude: selectedDestination.defaultStartLongitude,
      explorationLatitude: selectedDestination.centerLatitude,
      explorationLongitude: selectedDestination.centerLongitude,
      endPoiId: null,
      returnToStart,
      availableMinutes: availableHours * 60,
      transportMode,
      searchRadiusKm,
      budgetVnd: budgetVnd === '' ? null : Number(budgetVnd),
      mandatoryPoiIds: [],
      restPreference,
    };

    // Stable idempotency key lifecycle across retries for the same payload
    const fingerprint = JSON.stringify(payload);
    let idempotencyKey: string;
    if (attemptRef.current?.payloadFingerprint === fingerprint) {
      idempotencyKey = attemptRef.current.idempotencyKey;
    } else {
      idempotencyKey = generateIdempotencyKey();
      attemptRef.current = {
        payloadFingerprint: fingerprint,
        idempotencyKey,
      };
    }

    try {
      const result = await createSchedulingRequest(payload, {
        idempotencyKey,
      });
      setOptimizationPhase('Hoàn tất! Lịch trình tối ưu đã sẵn sàng.');
      setGeneratedItinerary(result.data);

      setFeedback({
        tone: 'success',
        title: 'Tạo lịch trình thành công!',
        message: result.message,
      });

      if (onSuccess) {
        onSuccess(result.data);
      }
    } catch (err: unknown) {
      const apiErr = err as { code?: string; message?: string };
      setFeedback({
        tone: 'error',
        title: 'Không thể tạo lịch trình tối ưu',
        message:
          apiErr.message ||
          'Ràng buộc không khả thi hoặc hệ thống đang bận. Vui lòng mở rộng bán kính hoặc tăng thời lượng chuyến đi.',
      });
    } finally {
      setIsSubmitting(false);
      setOptimizationPhase(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Preference sync notification banner */}
      {preferencesSynced && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-200 bg-teal-50/80 p-4 text-xs text-teal-900 shadow-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-lg text-[#007d6e]">
              sync_saved_locally
            </span>
            <span>
              TripMate đã tự động điền các thiết lập được UC-10 hỗ trợ hiện tại như phương tiện, nhịp độ và ngân sách.
            </span>
          </div>
          <Link
            href={ROUTES.account.preferences}
            className="inline-flex items-center gap-1 font-bold text-[#007d6e] hover:underline"
          >
            Tùy chỉnh sở thích
            <span className="material-symbols-outlined text-sm">open_in_new</span>
          </Link>
        </div>
      )}

      {/* Feedback banner */}
      {feedback && (
        <div className="mb-6">
          <FeedbackAlert
            tone={feedback.tone}
            title={feedback.title}
          >
            {feedback.message}
          </FeedbackAlert>
        </div>
      )}

      {/* Generated Itinerary Result Banner (Link to UC-11) */}
      {generatedItinerary && (
        <div className="mb-6 rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50 p-5 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-1 rounded-md bg-[#007d6e] px-2.5 py-0.5 text-[11px] font-bold text-white uppercase tracking-wider">
                <span className="material-symbols-outlined text-xs">verified</span>
                Lịch trình #{generatedItinerary.itineraryId}
              </div>
              <h3 className="mt-1.5 text-base font-black text-slate-900 sm:text-lg">
                {generatedItinerary.title}
              </h3>
              <p className="mt-0.5 text-xs text-slate-600 sm:text-sm">
                <strong>{generatedItinerary.items.length}</strong> điểm dừng • Thời lượng:{' '}
                <strong>{Math.round(generatedItinerary.totalDurationMinutes / 60)} giờ</strong> • Chi phí dự kiến:{' '}
                <strong>{generatedItinerary.totalEstimatedCost.toLocaleString('vi-VN')} VNĐ</strong>
              </p>
            </div>
            <Link
              href={ROUTES.itinerary(generatedItinerary.itineraryId)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#007d6e] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#006b5f]"
            >
              <span>Xem lịch trình chi tiết</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Card 1: Destination & Starting Point */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-7">
          <div className="mb-5 flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-[#007d6e]">
              <span className="material-symbols-outlined text-xl">location_on</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                1. Điểm đến & Vị trí khởi hành
              </h2>
              <p className="text-xs text-slate-500">
                Chọn thành phố và địa điểm bắt đầu hành trình của bạn
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="destination-select"
                className="mb-1.5 block text-xs font-bold text-slate-700 sm:text-sm"
              >
                Thành phố / Điểm đến
              </label>
              <select
                id="destination-select"
                value={selectedDestination.id}
                onChange={(e) => handleDestinationChange(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-800 transition focus:border-[#007d6e] focus:outline-hidden focus:ring-2 focus:ring-[#007d6e]/20"
              >
                {DESTINATION_PRESETS.map((dest) => (
                  <option key={dest.id} value={dest.id}>
                    {dest.name} ({dest.province})
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-slate-500">
                {selectedDestination.description}
              </p>
            </div>

            <div>
              <label
                htmlFor="default-start-address"
                className="mb-1.5 block text-xs font-bold text-slate-700 sm:text-sm"
              >
                Điểm xuất phát mặc định
              </label>
              <input
                id="default-start-address"
                type="text"
                readOnly
                value={selectedDestination.defaultStartAddress}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 cursor-not-allowed select-none"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                TripMate hiện sử dụng điểm xuất phát mặc định của khu vực đã chọn.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Tọa độ: {selectedDestination.defaultStartLatitude.toFixed(4)},{' '}
                {selectedDestination.defaultStartLongitude.toFixed(4)}
              </p>
            </div>
          </div>

          {/* Search Radius Slider */}
          <div className="mt-5 border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="radius-slider"
                className="text-xs font-bold text-slate-700 sm:text-sm"
              >
                Bán kính tìm kiếm điểm tham quan xung quanh
              </label>
              <span className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-[#007d6e]">
                {searchRadiusKm} km
              </span>
            </div>
            <input
              id="radius-slider"
              type="range"
              min={1}
              max={50}
              step={1}
              value={searchRadiusKm}
              onChange={(e) => setSearchRadiusKm(Number(e.target.value))}
              className="mt-2.5 h-2 w-full cursor-pointer accent-[#007d6e]"
            />
            <div className="mt-1 flex justify-between text-[11px] text-slate-400">
              <span>1 km (Gần)</span>
              <span>10 km (Chuẩn nội thành)</span>
              <span>50 km (Rộng / Ngoại ô)</span>
            </div>
            {validationErrors.searchRadiusKm && (
              <p className="mt-1 text-xs text-rose-600">
                {validationErrors.searchRadiusKm}
              </p>
            )}
          </div>
        </section>

        {/* Card 2: Date, Time & Duration */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-7">
          <div className="mb-5 flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-[#007d6e]">
              <span className="material-symbols-outlined text-xl">schedule</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                2. Thời gian & Thời lượng chuyến đi
              </h2>
              <p className="text-xs text-slate-500">
                Lịch trình được tối ưu hóa trong cùng một ngày theo quy định hệ thống
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="start-date"
                className="mb-1.5 block text-xs font-bold text-slate-700 sm:text-sm"
              >
                Ngày bắt đầu
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                min={getVietnamCalendarDate()}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setValidationErrors((prev) => ({ ...prev, startDate: '' }));
                }}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-800 transition focus:outline-hidden focus:ring-2 ${
                  validationErrors.startDate
                    ? 'border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-200'
                    : 'border-slate-300 bg-white focus:border-[#007d6e] focus:ring-[#007d6e]/20'
                }`}
              />
              {validationErrors.startDate && (
                <p className="mt-1 text-xs text-rose-600">
                  {validationErrors.startDate}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="start-time"
                className="mb-1.5 block text-xs font-bold text-slate-700 sm:text-sm"
              >
                Giờ xuất phát
              </label>
              <input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  setValidationErrors((prev) => ({ ...prev, startTime: '' }));
                }}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-800 transition focus:outline-hidden focus:ring-2 ${
                  validationErrors.startTime
                    ? 'border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-200'
                    : 'border-slate-300 bg-white focus:border-[#007d6e] focus:ring-[#007d6e]/20'
                }`}
              />
              {validationErrors.startTime && (
                <p className="mt-1 text-xs text-rose-600">
                  {validationErrors.startTime}
                </p>
              )}
            </div>
          </div>

          {/* Duration slider */}
          <div className="mt-5 border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="duration-slider"
                className="text-xs font-bold text-slate-700 sm:text-sm"
              >
                Thời lượng dự kiến
              </label>
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-[#007d6e]">
                  {availableHours} giờ ({availableHours * 60} phút)
                </span>
              </div>
            </div>

            <input
              id="duration-slider"
              type="range"
              min={1}
              max={12}
              step={1}
              value={availableHours}
              onChange={(e) => {
                setAvailableHours(Number(e.target.value));
                setValidationErrors((prev) => ({ ...prev, availableHours: '' }));
              }}
              className="mt-2.5 h-2 w-full cursor-pointer accent-[#007d6e]"
            />

            {/* Quick preset buttons */}
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                { h: 3, label: '3 giờ (Nửa buổi)' },
                { h: 6, label: '6 giờ (Một buổi dài)' },
                { h: 8, label: '8 giờ (Trọn vẹn 1 ngày)' },
                { h: 10, label: '10 giờ (Khám phá sâu)' },
              ].map((preset) => (
                <button
                  key={preset.h}
                  type="button"
                  onClick={() => {
                    setAvailableHours(preset.h);
                    setValidationErrors((prev) => ({ ...prev, availableHours: '' }));
                  }}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                    availableHours === preset.h
                      ? 'border-[#007d6e] bg-teal-50 text-[#007d6e]'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Live calculation banner */}
            <div
              className={`mt-4 flex items-center gap-2 rounded-xl p-3 text-xs sm:text-sm ${
                isNextDay
                  ? 'border border-rose-200 bg-rose-50 text-rose-900'
                  : 'border border-teal-100 bg-teal-50/60 text-teal-900'
              }`}
            >
              <span className="material-symbols-outlined text-base">
                {isNextDay ? 'warning' : 'timelapse'}
              </span>
              <span>
                Bắt đầu: <strong>{startTime}</strong> • Dự kiến kết thúc:{' '}
                <strong>{formattedEnd}</strong> {isNextDay ? '(Qua ngày hôm sau ❌)' : '(Cùng ngày ✓)'}
              </span>
            </div>

            {validationErrors.availableHours && (
              <p className="mt-2 text-xs text-rose-600">
                {validationErrors.availableHours}
              </p>
            )}
          </div>
        </section>

        {/* Card 3: Transport & Rest Preferences */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-7">
          <div className="mb-5 flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-[#007d6e]">
              <span className="material-symbols-outlined text-xl">directions_bike</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                3. Phương tiện & Nhịp độ di chuyển
              </h2>
              <p className="text-xs text-slate-500">
                Lựa chọn phương tiện và mức độ nghỉ ngơi giữa các điểm đến
              </p>
            </div>
          </div>

          {/* Transport mode */}
          <div className="mb-5">
            <label className="mb-2 block text-xs font-bold text-slate-700 sm:text-sm">
              Phương tiện di chuyển chính
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { id: 'Motorbike' as TransportMode, label: 'Xe máy', icon: 'two_wheeler', desc: 'Linh hoạt, phổ biến' },
                { id: 'Car' as TransportMode, label: 'Ô tô / Taxi', icon: 'directions_car', desc: 'Thoải mái, che mưa nắng' },
                { id: 'Walking' as TransportMode, label: 'Đi bộ', icon: 'directions_walk', desc: 'Gần phố cổ / bờ biển' },
                { id: 'PublicTransit' as TransportMode, label: 'Xe buýt', icon: 'directions_bus', desc: 'Chưa hỗ trợ tối ưu', disabled: true },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => !opt.disabled && setTransportMode(opt.id)}
                  className={`flex flex-col items-center rounded-xl border p-3 text-center transition ${
                    opt.disabled
                      ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 opacity-60'
                      : transportMode === opt.id
                      ? 'border-[#007d6e] bg-teal-50/70 text-[#007d6e] ring-2 ring-[#007d6e]/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="material-symbols-outlined text-2xl">{opt.icon}</span>
                  <span className="mt-1 text-xs font-bold sm:text-sm">{opt.label}</span>
                  <span className="text-[10px] text-slate-500">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Rest preference */}
          <div className="mb-5 border-t border-slate-100 pt-5">
            <label className="mb-2 block text-xs font-bold text-slate-700 sm:text-sm">
              Mức độ nghỉ ngơi giữa các điểm dừng
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { id: 'Auto' as RestPreference, label: 'Tự động cân đối (Auto)', icon: 'tune', desc: 'AI tự động tính toán thời gian nghỉ ngơi hợp lý' },
                { id: 'Frequent' as RestPreference, label: 'Nghỉ thường xuyên', icon: 'coffee', desc: 'Nhiều điểm dừng cà phê & thư giãn giữa chặng' },
                { id: 'None' as RestPreference, label: 'Không nghỉ giữa chặng', icon: 'bolt', desc: 'Tập trung tối đa thời gian tham quan các điểm' },
              ].map((pref) => (
                <button
                  key={pref.id}
                  type="button"
                  onClick={() => setRestPreference(pref.id)}
                  className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition ${
                    restPreference === pref.id
                      ? 'border-[#007d6e] bg-teal-50/70 text-[#007d6e] ring-2 ring-[#007d6e]/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="material-symbols-outlined mt-0.5 text-lg">{pref.icon}</span>
                  <div>
                    <div className="text-xs font-bold sm:text-sm">{pref.label}</div>
                    <div className="text-[11px] text-slate-500">{pref.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Return to start toggle */}
          <div className="border-t border-slate-100 pt-5">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={returnToStart}
                onChange={(e) => setReturnToStart(e.target.checked)}
                className="h-4 w-4 rounded-sm border-slate-300 text-[#007d6e] accent-[#007d6e] focus:ring-[#007d6e]"
              />
              <span className="text-xs font-medium text-slate-700 sm:text-sm">
                Quay về điểm xuất phát khi kết thúc hành trình (Tạo thành lộ trình khép kín)
              </span>
            </label>
          </div>
        </section>

        {/* Card 4: Budget */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-7">
          <div className="mb-5 flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-[#007d6e]">
              <span className="material-symbols-outlined text-xl">payments</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                4. Ngân sách
              </h2>
              <p className="text-xs text-slate-500">
                Cá nhân hóa chi phí dự kiến cho chuyến đi
              </p>
            </div>
          </div>

          {/* Budget input */}
          <div className="mb-5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="budget-input"
                className="mb-1.5 block text-xs font-bold text-slate-700 sm:text-sm"
              >
                Ngân sách dự kiến (VNĐ/người)
              </label>
              <span className="text-xs text-slate-400">Không bắt buộc</span>
            </div>
            <div className="relative">
              <input
                id="budget-input"
                type="number"
                min={0}
                step={50000}
                value={budgetVnd}
                onChange={(e) => {
                  setBudgetVnd(e.target.value === '' ? '' : Number(e.target.value));
                  setValidationErrors((prev) => ({ ...prev, budgetVnd: '' }));
                }}
                placeholder="VD: 500000"
                className={`w-full rounded-xl border px-3.5 py-2.5 pr-14 text-sm text-slate-800 transition focus:outline-hidden focus:ring-2 ${
                  validationErrors.budgetVnd
                    ? 'border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-200'
                    : 'border-slate-300 bg-white focus:border-[#007d6e] focus:ring-[#007d6e]/20'
                }`}
              />
              <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">
                VNĐ
              </span>
            </div>

            {/* Quick budget presets */}
            <div className="mt-2.5 flex flex-wrap gap-2">
              {[
                { amount: 300000, label: '300.000đ (Tiết kiệm)' },
                { amount: 800000, label: '800.000đ (Tiêu chuẩn)' },
                { amount: 2000000, label: '2.000.000đ (Thoải mái)' },
              ].map((p) => (
                <button
                  key={p.amount}
                  type="button"
                  onClick={() => setBudgetVnd(p.amount)}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                    budgetVnd === p.amount
                      ? 'border-[#007d6e] bg-teal-50 text-[#007d6e]'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {validationErrors.budgetVnd && (
              <p className="mt-1 text-xs text-rose-600">
                {validationErrors.budgetVnd}
              </p>
            )}
          </div>
        </section>

        {/* Action Button & CSP Optimization progress display */}
        <div className="rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50/60 to-emerald-50/40 p-5 text-center shadow-xs sm:p-7">
          {isSubmitting ? (
            <div className="space-y-3 py-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                <span className="material-symbols-outlined animate-spin text-2xl text-[#007d6e]">
                  progress_activity
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                Đang khởi tạo lịch trình tối ưu với thuật toán CSP...
              </h3>
              <p className="text-xs text-[#007d6e] font-medium animate-pulse">
                {optimizationPhase}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto max-w-lg text-xs text-slate-600 sm:text-sm">
                Thuật toán CSP của TripMate sẽ tự động sắp xếp các điểm tham quan theo cung đường tối ưu,
                tránh trùng lặp và tính toán thời gian di chuyển chính xác nhất.
              </div>

              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                <ActionButton
                  type="submit"
                  variant="teal"
                  className="w-full sm:w-auto min-w-[240px] px-6 py-3.5 text-sm font-bold shadow-md"
                >
                  <span className="material-symbols-outlined text-lg">auto_awesome</span>
                  Tạo lịch trình tối ưu
                </ActionButton>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
