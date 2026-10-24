'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

import { ActionButton } from '@/components/ui/ActionButton';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { getTravelPreferences } from '@/features/account/preferences/travelPreferencesApi';
import { getMapboxPublicToken } from '@/lib/mapboxToken';
import { ROUTES } from '@/lib/routes';

import { getBrowserLocation, PlaceSearchError, SelectablePoi } from '../services/placeSearchApi';
import { createSchedulingRequest, generateIdempotencyKey } from '../services/schedulingApi';
import {
  buildVietnamStartAtIso,
  calculateTripEnd,
  CreateSchedulingRequestPayload,
  getVietnamCalendarDate,
  getVietnamTomorrowDateString,
  isFutureVietnamStartAt,
  parseAvailableDuration,
  RestPreference,
  SchedulingResponseDto,
  TransportMode,
  TRIPMATE_TIME_ZONE,
} from '../types/schedulingTypes';
import { radiusWarning } from '../utils/itineraryPresentation';
import { calculateDistanceKm, SPEED_KMH } from '../utils/schedulingGeometry';
import { LazyRadiusMap } from './maps/LazyMaps';
import { PickedPlace, PlacePickerDialog } from './PlacePickerDialog';

export { calculateDistanceKm, SPEED_KMH } from '../utils/schedulingGeometry';

const MAX_MANDATORY_POIS = 6;
// Same bounds as the API (and the mobile app): Da Nang to Hue is about 85 km.
const MIN_SEARCH_RADIUS_KM = 1;
const MAX_SEARCH_RADIUS_KM = 100;

type PickerTarget = 'start' | 'exploration' | 'end' | 'mandatory';

interface CreateSchedulingRequestFormProps {
  /** Kept for callers; preferences are resolved for the signed-in Traveler by the API. */
  userId?: string | number | null;
  onSuccess?: (itinerary: SchedulingResponseDto) => void;
}

type PendingSchedulingAttempt = {
  payloadFingerprint: string;
  idempotencyKey: string;
};

export function CreateSchedulingRequestForm({
  onSuccess,
}: CreateSchedulingRequestFormProps) {
  // Where: the same choices as the mobile app.
  const [startPoint, setStartPoint] = useState<PickedPlace | null>(null);
  const [explorationPoi, setExplorationPoi] = useState<PickedPlace | null>(null);
  const [endPoi, setEndPoi] = useState<PickedPlace | null>(null);
  const [mandatoryPois, setMandatoryPois] = useState<SelectablePoi[]>([]);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Time & duration
  const [startDate, setStartDate] = useState(getVietnamTomorrowDateString());
  const [startTime, setStartTime] = useState('08:00');
  // "Thời lượng" is typed freely (hours + minutes): 1 hour to 3 days, and the trip may run
  // past midnight.
  const [durationHours, setDurationHours] = useState('8');
  const [durationMinutes, setDurationMinutes] = useState('0');
  const duration = parseAvailableDuration(durationHours, durationMinutes);

  // Constraints
  const [searchRadiusKm, setSearchRadiusKm] = useState(10);
  const [returnToStart, setReturnToStart] = useState(true);
  const [transportMode, setTransportMode] = useState<TransportMode>('Motorbike');
  const [restPreference, setRestPreference] = useState<RestPreference>('Auto');
  const [budgetVnd, setBudgetVnd] = useState<number | ''>('');

  // UC-09 can pre-fill a supported transport mode only. Budget belongs to this request and is
  // intentionally not read from the Traveler profile.
  const [preferencesSynced, setPreferencesSynced] = useState(false);
  const transportTouched = useRef(false);

  useEffect(() => {
    let active = true;
    void getTravelPreferences()
      .then((result) => {
        if (!active || !result.ok) return;
        const mode = result.data.preferredTransportMode;
        if (mode && mode !== 'PublicTransit' && !transportTouched.current) {
          setTransportMode(mode);
          setPreferencesSynced(true);
        }
      })
      .catch(() => {
        // Preference prefill is optional; scheduling remains usable when it cannot load.
      });
    return () => {
      active = false;
    };
  }, []);

  const chooseTransportMode = (mode: TransportMode) => {
    transportTouched.current = true;
    setTransportMode(mode);
  };

  const chooseBudget = (value: number | '') => {
    setBudgetVnd(value);
  };

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
  const [infeasibilityFix, setInfeasibilityFix] = useState<{
    requiredMinutes: number;
    currentMinutes: number;
    suggestedHours: number;
  } | null>(null);

  const locateStartPoint = async () => {
    setIsLocating(true);
    try {
      const location = await getBrowserLocation();
      setStartPoint({ label: 'Vị trí hiện tại', ...location });
      setValidationErrors((prev) => ({ ...prev, startPoint: '' }));
    } catch (error) {
      setFeedback({
        tone: 'warning',
        message: error instanceof PlaceSearchError
          ? error.message
          : 'Không lấy được vị trí hiện tại. Hãy chọn một địa điểm.',
      });
    } finally {
      setIsLocating(false);
    }
  };

  const handlePicked = (place: PickedPlace) => {
    const target = pickerTarget;
    setPickerTarget(null);
    setFeedback(null);
    setInfeasibilityFix(null);
    switch (target) {
      case 'start':
        setStartPoint(place);
        setValidationErrors((prev) => ({ ...prev, startPoint: '' }));
        break;
      case 'exploration': {
        const previousPrimaryPoiId = explorationPoi?.poi?.id;
        setExplorationPoi(place);
        if (place.poi) {
          const newPoi = place.poi;
          setMandatoryPois((prev) => {
            const filtered = previousPrimaryPoiId
              ? prev.filter((p) => p.id !== previousPrimaryPoiId)
              : prev;
            const validAroundNewCenter = filtered.filter((p) => {
              const dist = calculateDistanceKm(place.latitude, place.longitude, p.latitude, p.longitude);
              return dist <= searchRadiusKm;
            });
            return validAroundNewCenter.some((p) => p.id === newPoi.id)
              ? validAroundNewCenter
              : [newPoi, ...validAroundNewCenter].slice(0, MAX_MANDATORY_POIS);
          });
        } else {
          setMandatoryPois((prev) => {
            const filtered = previousPrimaryPoiId
              ? prev.filter((p) => p.id !== previousPrimaryPoiId)
              : prev;
            return filtered.filter((p) => {
              const dist = calculateDistanceKm(place.latitude, place.longitude, p.latitude, p.longitude);
              return dist <= searchRadiusKm;
            });
          });
        }
        setValidationErrors((prev) => ({ ...prev, exploration: '' }));
        break;
      }
      case 'end':
        setEndPoi(place);
        setValidationErrors((prev) => ({ ...prev, endPoi: '' }));
        break;
      case 'mandatory': {
        const poi = place.poi;
        if (!poi) break;
        setMandatoryPois((prev) =>
          prev.length >= MAX_MANDATORY_POIS || prev.some((item) => item.id === poi.id)
            ? prev
            : [...prev, poi]);
        break;
      }
      default:
        break;
    }
  };

  const travelFeasibility = (() => {
    if (!startPoint || !explorationPoi || !duration.minutes || duration.minutes <= 0) {
      return null;
    }
    const speed = SPEED_KMH[transportMode] ?? 35;
    const outboundKm = calculateDistanceKm(
      startPoint.latitude,
      startPoint.longitude,
      explorationPoi.latitude,
      explorationPoi.longitude,
    );
    let inboundKm = outboundKm;
    if (!returnToStart && endPoi) {
      inboundKm = calculateDistanceKm(
        explorationPoi.latitude,
        explorationPoi.longitude,
        endPoi.latitude,
        endPoi.longitude,
      );
    }
    const totalTransitKm = outboundKm + inboundKm;
    const transitMinutes = Math.round((totalTransitKm / speed) * 60);
    const transitHours = Math.round((transitMinutes / 60) * 10) / 10;
    const isWarning = transitMinutes > 0.5 * duration.minutes;
    const suggestedHours = Math.max(6, Math.ceil((transitMinutes * 2) / 60));

    return {
      totalTransitKm,
      transitMinutes,
      transitHours,
      isWarning,
      suggestedHours,
      message: `Thời gian di chuyển 2 chiều (~${transitHours}h) chiếm hơn một nửa chuyến đi. Bạn nên tăng thời lượng lên từ ${suggestedHours} giờ để có thời gian trải nghiệm trọn vẹn.`,
    };
  })();


  // Review 2 (D9): the radius circle is drawn around the exploration area (or the start).
  const mapboxToken = getMapboxPublicToken();
  const [radiusMapFailed, setRadiusMapFailed] = useState(false);
  const radiusCenterSource = explorationPoi ?? startPoint;
  const radiusCenterLatitude = radiusCenterSource?.latitude;
  const radiusCenterLongitude = radiusCenterSource?.longitude;
  const radiusCenter = useMemo(
    () =>
      radiusCenterLatitude === undefined || radiusCenterLongitude === undefined
        ? null
        : { latitude: radiusCenterLatitude, longitude: radiusCenterLongitude },
    [radiusCenterLatitude, radiusCenterLongitude],
  );

  // Live end time (the trip may end on a later day)
  const tripEnd =
    duration.minutes === null ? null : calculateTripEnd(startDate, startTime, duration.minutes);

  // Validate form
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!startPoint) {
      errors.startPoint = 'Vui lòng chọn điểm xuất phát.';
    }

    if (!explorationPoi) {
      errors.exploration = 'Vui lòng chọn khu vực muốn khám phá.';
    }

    if (!returnToStart && !endPoi?.poi) {
      errors.endPoi = 'Chọn điểm kết thúc hoặc bật "Quay về điểm xuất phát".';
    }

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

    if (duration.error) {
      errors.availableHours = duration.error;
    }

    if (searchRadiusKm < MIN_SEARCH_RADIUS_KM || searchRadiusKm > MAX_SEARCH_RADIUS_KM) {
      errors.searchRadiusKm = `Bán kính tìm kiếm phải từ ${MIN_SEARCH_RADIUS_KM} đến ${MAX_SEARCH_RADIUS_KM} km.`;
    }

    if (budgetVnd !== '' && budgetVnd <= 0) {
      errors.budgetVnd = 'Ngân sách dự kiến phải lớn hơn 0 VNĐ.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form submit implementation
  const executeSubmit = async (overrideAvailableMinutes?: number) => {
    setFeedback(null);
    setInfeasibilityFix(null);

    const activeAvailableMinutes = overrideAvailableMinutes ?? duration.minutes;
    if (!overrideAvailableMinutes && !validate()) {
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

    // Construct backend payload (validate() guarantees the places are chosen).
    const startAtIso = buildVietnamStartAtIso(startDate, startTime);
    const payload: CreateSchedulingRequestPayload = {
      startAt: startAtIso,
      timeZoneId: TRIPMATE_TIME_ZONE,
      startLatitude: startPoint!.latitude,
      startLongitude: startPoint!.longitude,
      explorationLatitude: explorationPoi!.latitude,
      explorationLongitude: explorationPoi!.longitude,
      endPoiId: returnToStart ? null : endPoi?.poi?.id ?? null,
      returnToStart,
      availableMinutes: activeAvailableMinutes ?? 0,
      transportMode,
      searchRadiusKm,
      budgetVnd: budgetVnd === '' ? null : Number(budgetVnd),
      mandatoryPoiIds: mandatoryPois.map((poi) => poi.id),
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
      const result = await createSchedulingRequest(payload, { idempotencyKey });
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
      const apiErr = err as { code?: string; message?: string; status?: number };
      const is422 = apiErr.status === 422 || apiErr.code === 'planning.constraints_infeasible';

      if (is422) {
        const speed = SPEED_KMH[transportMode] ?? 35;
        const outboundKm = startPoint && explorationPoi
          ? calculateDistanceKm(
              startPoint.latitude,
              startPoint.longitude,
              explorationPoi.latitude,
              explorationPoi.longitude,
            )
          : 0;
        const inboundKm = !returnToStart && endPoi && explorationPoi
          ? calculateDistanceKm(
              explorationPoi.latitude,
              explorationPoi.longitude,
              endPoi.latitude,
              endPoi.longitude,
            )
          : outboundKm;
        const transitMinutes = Math.round(((outboundKm + inboundKm) / speed) * 60);
        const totalVisitMinutes = mandatoryPois.reduce((acc, poi) => {
          return acc + ((poi as unknown as { averageVisitDurationMinutes?: number }).averageVisitDurationMinutes ?? 60);
        }, 0);
        const currentMins = activeAvailableMinutes ?? 0;
        const requiredMinutes = Math.max(
          currentMins + 60,
          transitMinutes + Math.max(totalVisitMinutes, 120),
        );
        const suggestedHours = Math.max(
          Math.ceil(currentMins / 60) + 2,
          Math.ceil(requiredMinutes / 60),
        );

        setInfeasibilityFix({
          requiredMinutes,
          currentMinutes: currentMins,
          suggestedHours,
        });

        setFeedback({
          tone: 'error',
          title: 'Không thể tạo lịch trình tối ưu',
          message: `Không thể xếp lịch: Các điểm bắt buộc cần tối thiểu ${requiredMinutes} phút (bao gồm di chuyển và tham quan), vượt quá thời lượng ${currentMins} phút của bạn.`,
        });
      } else {
        setInfeasibilityFix(null);
        setFeedback({
          tone: 'error',
          title: 'Không thể tạo lịch trình tối ưu',
          message:
            apiErr.message ||
            'Ràng buộc không khả thi hoặc hệ thống đang bận. Vui lòng mở rộng bán kính hoặc tăng thời lượng chuyến đi.',
        });
      }
    } finally {
      setIsSubmitting(false);
      setOptimizationPhase(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void executeSubmit();
  };

  const handleApplyFixAndResubmit = async (suggestedHours: number) => {
    setDurationHours(String(suggestedHours));
    setDurationMinutes('0');
    await executeSubmit(suggestedHours * 60);
  };

  return (
    <div className="mx-auto max-w-7xl">
      {/* Preference sync notification banner */}
      {preferencesSynced && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-200 bg-teal-50/80 p-4 text-xs text-teal-900 shadow-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-lg text-[#007d6e]">
              sync_saved_locally
            </span>
            <span>
              TripMate đã tự động điền phương tiện từ sở thích du lịch đã lưu của bạn.
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
        <div className="mb-6 space-y-3">
          <FeedbackAlert
            tone={feedback.tone}
            title={feedback.title}
          >
            {feedback.message}
          </FeedbackAlert>
          {infeasibilityFix && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void handleApplyFixAndResubmit(infeasibilityFix.suggestedHours)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#007d6e] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#006b5f]"
              >
                <span className="material-symbols-outlined text-base">update</span>
                Tăng thời lượng lên {infeasibilityFix.suggestedHours} giờ và thử lại
              </button>
            </div>
          )}
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

      {/* Main Form & Interactive Studio Layout */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* LEFT COLUMN: Guided Planning Input Cards (45% -> 5 cols or 6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Card 1: Where — Starting point, Exploration area, End point & Must-see places */}
            <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-7">
              <div className="mb-5 flex items-center gap-2.5 border-b border-slate-100 pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-[#007d6e]">
                  <span className="material-symbols-outlined text-xl">location_on</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                    1. Điểm xuất phát & khu vực khám phá
                  </h2>
                  <p className="text-xs text-slate-500">
                    Bắt đầu từ nơi bạn đang ở, rồi chọn khu vực và những nơi bạn muốn ghé
                  </p>
                </div>
              </div>

              {/* Starting point */}
              <div>
                <p className="text-xs font-bold text-slate-700 sm:text-sm">Điểm xuất phát</p>
                <p
                  className={`mt-1 text-sm ${startPoint ? 'font-semibold text-slate-800' : 'text-slate-500'}`}
                  data-testid="start-point-label"
                >
                  {startPoint ? startPoint.label : 'Chưa chọn điểm xuất phát'}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void locateStartPoint()}
                    disabled={isLocating || isSubmitting}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#007d6e] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#006b5f] disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-base">my_location</span>
                    {isLocating ? 'Đang lấy vị trí…' : 'Dùng vị trí hiện tại'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickerTarget('start')}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:border-slate-400 disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-base">search</span>
                    Chọn điểm xuất phát
                  </button>
                </div>
                {validationErrors.startPoint && (
                  <p className="mt-1.5 text-xs text-rose-600">{validationErrors.startPoint}</p>
                )}
              </div>

              {/* Explore around */}
              <div className="mt-5 border-t border-slate-100 pt-5">
                <PlaceField
                  label="Khu vực khám phá"
                  value={explorationPoi?.label ?? null}
                  helper={
                    startPoint
                      ? 'Chọn khu vực hoặc điểm tham quan bạn muốn khám phá xung quanh.'
                      : 'Chọn điểm xuất phát trước.'
                  }
                  disabled={!startPoint || isSubmitting}
                  onOpen={() => setPickerTarget('exploration')}
                  error={validationErrors.exploration}
                />
              </div>

              {/* Finish at + return to start */}
              <div className="mt-5 border-t border-slate-100 pt-5">
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    checked={returnToStart}
                    onChange={(e) => {
                      setReturnToStart(e.target.checked);
                      setValidationErrors((prev) => ({ ...prev, endPoi: '' }));
                    }}
                    className="h-4 w-4 rounded-sm border-slate-300 text-[#007d6e] accent-[#007d6e] focus:ring-[#007d6e]"
                  />
                  <span className="text-xs font-medium text-slate-700 sm:text-sm">
                    Quay về điểm xuất phát khi kết thúc hành trình
                  </span>
                </label>
                <div className="mt-3">
                  <PlaceField
                    label="Điểm kết thúc"
                    value={returnToStart ? null : endPoi?.label ?? null}
                    helper={
                      returnToStart
                        ? 'Bỏ chọn "Quay về điểm xuất phát" để chọn nơi kết thúc chuyến đi.'
                        : 'Chọn nơi kết thúc chuyến đi.'
                    }
                    disabled={returnToStart || !startPoint || isSubmitting}
                    onOpen={() => setPickerTarget('end')}
                    error={validationErrors.endPoi}
                  />
                </div>
              </div>

              {/* Must-see places */}
              <div className="mt-5 border-t border-slate-100 pt-5">
                <p className="text-xs font-bold text-slate-700 sm:text-sm">Địa điểm muốn ghé</p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Không bắt buộc. Thêm tối đa {MAX_MANDATORY_POIS} nơi bạn không muốn bỏ lỡ.
                </p>
                {mandatoryPois.length > 0 && (
                  <ul className="mt-2.5 flex flex-wrap gap-2">
                    {mandatoryPois.map((poi) => {
                      const isPrimary = poi.id === explorationPoi?.poi?.id;
                      return (
                        <li
                          key={poi.id}
                          className={`inline-flex items-center gap-1.5 rounded-full border py-1 pl-3 pr-1 text-xs font-semibold ${
                            isPrimary
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                              : 'border-teal-200 bg-teal-50 text-[#007d6e]'
                          }`}
                        >
                          <span>{poi.name}</span>
                          {isPrimary && (
                            <span className="rounded-full bg-emerald-200/70 px-1.5 py-0.5 text-[10px] font-bold text-emerald-900">
                              Điểm khám phá chính
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setMandatoryPois((prev) => prev.filter((item) => item.id !== poi.id))
                            }
                            disabled={isSubmitting}
                            aria-label={`Bỏ ${poi.name}`}
                            className="rounded-full p-0.5 hover:bg-black/5"
                          >
                            <span className="material-symbols-outlined text-sm">close</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <button
                  type="button"
                  onClick={() => setPickerTarget('mandatory')}
                  disabled={!startPoint || isSubmitting || mandatoryPois.length >= MAX_MANDATORY_POIS}
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-300 px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:border-[#007d6e] hover:text-[#007d6e] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-base">add_location_alt</span>
                  Thêm địa điểm muốn ghé
                </button>
              </div>

              {/* Travel Feasibility Gate Warning (Soft Alert) */}
              {travelFeasibility?.isWarning && (
                <div
                  role="alert"
                  className="mt-5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/90 p-3.5 text-xs text-amber-900 shadow-2xs"
                >
                  <span className="material-symbols-outlined mt-0.5 text-base text-amber-600" aria-hidden="true">
                    warning
                  </span>
                  <div>
                    <p className="font-bold">Lưu ý về thời gian di chuyển</p>
                    <p className="mt-0.5 leading-relaxed text-amber-800">
                      {travelFeasibility.message}
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* Card 2: Date, Time & Duration */}
            <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-7">
              <div className="mb-5 flex items-center gap-2.5 border-b border-slate-100 pb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100 text-[#007d6e]">
                  <span className="material-symbols-outlined text-xl">schedule</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                    2. Thời gian & Thời lượng chuyến đi
                  </h2>
                  <p className="text-xs text-slate-500">
                    Chuyến đi từ 1 giờ đến 3 ngày, có thể kéo dài qua đêm
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

              {/* Duration: free hours + minutes, 1 hour to 3 days */}
              <div className="mt-5 border-t border-slate-100 pt-5">
                <p className="text-xs font-bold text-slate-700 sm:text-sm">Thời lượng dự kiến</p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Từ 1 giờ đến 3 ngày (72 giờ). Chuyến đi có thể kéo dài qua đêm sang ngày hôm sau.
                </p>
                <div className="mt-2.5 grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="duration-hours" className="text-xs font-semibold text-slate-600">
                      Số giờ
                    </label>
                    <input
                      id="duration-hours"
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      value={durationHours}
                      onChange={(e) => {
                        setDurationHours(e.target.value.replace(/\D/g, ''));
                        setValidationErrors((prev) => ({ ...prev, availableHours: '' }));
                      }}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#007d6e] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="duration-minutes" className="text-xs font-semibold text-slate-600">
                      Số phút
                    </label>
                    <input
                      id="duration-minutes"
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      value={durationMinutes}
                      onChange={(e) => {
                        setDurationMinutes(e.target.value.replace(/\D/g, ''));
                        setValidationErrors((prev) => ({ ...prev, availableHours: '' }));
                      }}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-[#007d6e] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Live calculation banner */}
                <div
                  className={`mt-4 flex items-center gap-2 rounded-xl p-3 text-xs sm:text-sm ${
                    duration.error
                      ? 'border border-rose-200 bg-rose-50 text-rose-900'
                      : 'border border-teal-100 bg-teal-50/60 text-teal-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-base">
                    {duration.error ? 'warning' : 'timelapse'}
                  </span>
                  {duration.error || !tripEnd ? (
                    <span>{duration.error ?? 'Chọn ngày và giờ xuất phát.'}</span>
                  ) : (
                    <span>
                      Bắt đầu: <strong>{startTime}</strong> • Dự kiến kết thúc:{' '}
                      <strong>{tripEnd.time}</strong>{' '}
                      {tripEnd.dayOffset === 0
                        ? '(cùng ngày)'
                        : `ngày ${tripEnd.date} (sau ${tripEnd.dayOffset} ngày)`}
                    </span>
                  )}
                </div>

                {validationErrors.availableHours && (
                  <p className="mt-2 text-xs text-rose-600">
                    {validationErrors.availableHours}
                  </p>
                )}
              </div>
            </section>

            {/* Card 3: Transport & Rest Preferences */}
            <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-7">
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
                      onClick={() => !opt.disabled && chooseTransportMode(opt.id)}
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
              <div className="border-t border-slate-100 pt-5">
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
            </section>

            {/* Card 4: Budget */}
            <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs sm:p-7">
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
              <div>
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
                      chooseBudget(e.target.value === '' ? '' : Number(e.target.value));
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
                      onClick={() => chooseBudget(p.amount)}
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
          </div>

          {/* RIGHT COLUMN: Interactive Mapbox Preview, Search Radius & Planning Summary (55%) */}
          <aside className="lg:col-span-6 space-y-6 lg:sticky lg:top-24">
            {/* Card 1: Interactive Mapbox Preview & Search Radius */}
            <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-[#007d6e]">
                    <span className="material-symbols-outlined text-lg">explore</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Bản đồ bán kính tìm kiếm</h3>
                    <p className="text-[11px] text-slate-500">
                      {radiusCenterSource
                        ? `Tâm: ${radiusCenterSource.label}`
                        : 'Chọn điểm xuất phát hoặc khu vực để xem bán kính'}
                    </p>
                  </div>
                </div>
                <span className="rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-bold text-[#007d6e]">
                  {searchRadiusKm} km
                </span>
              </div>

              {/* Radius Slider */}
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="radius-slider"
                    className="text-xs font-bold text-slate-700"
                  >
                    Bán kính tìm kiếm điểm tham quan xung quanh
                  </label>
                  <span className="text-[11px] font-semibold text-teal-700">
                    R = {searchRadiusKm} km
                  </span>
                </div>
                <input
                  id="radius-slider"
                  type="range"
                  min={MIN_SEARCH_RADIUS_KM}
                  max={MAX_SEARCH_RADIUS_KM}
                  step={1}
                  value={searchRadiusKm}
                  onChange={(e) => {
                    const newRadius = Number(e.target.value);
                    setSearchRadiusKm(newRadius);
                    setMandatoryPois((prev) => {
                      if (!explorationPoi) return [];
                      return prev.filter((p) => {
                        if (explorationPoi.poi && p.id === explorationPoi.poi.id) {
                          return true;
                        }
                        const dist = calculateDistanceKm(
                          explorationPoi.latitude,
                          explorationPoi.longitude,
                          p.latitude,
                          p.longitude,
                        );
                        return dist <= newRadius;
                      });
                    });
                  }}
                  className="mt-2 h-2 w-full cursor-pointer accent-[#007d6e]"
                />
                <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                  <span>{MIN_SEARCH_RADIUS_KM} km (Gần)</span>
                  <span>50 km (Ngoại ô)</span>
                  <span>{MAX_SEARCH_RADIUS_KM} km (Liên tỉnh)</span>
                </div>
                {radiusWarning(searchRadiusKm) && (
                  <p role="status" className="mt-2.5 flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    <span>{radiusWarning(searchRadiusKm)}</span>
                  </p>
                )}
                {validationErrors.searchRadiusKm && (
                  <p className="mt-1 text-xs text-rose-600">
                    {validationErrors.searchRadiusKm}
                  </p>
                )}
              </div>

              {/* Map preview */}
              {mapboxToken && radiusCenter && !radiusMapFailed ? (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <LazyRadiusMap
                    token={mapboxToken}
                    center={radiusCenter}
                    radiusKm={searchRadiusKm}
                    onUnavailable={() => setRadiusMapFailed(true)}
                  />
                </div>
              ) : (
                <div className="flex h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-center">
                  <span className="material-symbols-outlined text-3xl text-slate-300">map</span>
                  <p className="mt-2 text-xs font-semibold text-slate-600">
                    {!mapboxToken
                      ? 'Bản đồ xem trước không khả dụng (chưa có Mapbox token)'
                      : !radiusCenter
                      ? 'Chọn điểm xuất phát hoặc khu vực khám phá để kích hoạt bản đồ'
                      : 'Không thể tải bản đồ'}
                  </p>
                  <span className="mt-1 text-[11px] text-slate-400">
                    TripMate sẽ tìm kiếm các địa điểm trong bán kính {searchRadiusKm} km
                  </span>
                </div>
              )}
            </section>

            {/* Card 2: Selected Locations Feedback Overview */}
            <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 sm:text-sm">
                <span className="material-symbols-outlined text-base text-[#007d6e]">pin_drop</span>
                Tóm tắt địa điểm đã chọn
              </h3>
              <div className="mt-3.5 space-y-3">
                {/* Starting point */}
                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#007d6e] text-[11px] font-bold text-white">
                    A
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-slate-500">Điểm xuất phát</p>
                    <p className="truncate text-xs font-semibold text-slate-800">
                      {startPoint ? startPoint.label : 'Chưa chọn'}
                    </p>
                  </div>
                </div>

                {/* Exploration area */}
                <div className="flex items-start gap-3 rounded-xl bg-teal-50/60 p-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-600 text-[11px] font-bold text-white">
                    ★
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-teal-800">Khu vực khám phá trung tâm</p>
                    <p className="truncate text-xs font-semibold text-teal-950">
                      {explorationPoi ? explorationPoi.label : 'Chưa chọn'}
                    </p>
                  </div>
                </div>

                {/* End point */}
                <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-600 text-[11px] font-bold text-white">
                    B
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-slate-500">Điểm kết thúc</p>
                    <p className="truncate text-xs font-semibold text-slate-800">
                      {returnToStart ? 'Quay về điểm xuất phát' : endPoi ? endPoi.label : 'Chưa chọn'}
                    </p>
                  </div>
                </div>

                {/* Mandatory POIs list */}
                <div className="border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Địa điểm muốn ghé</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                      {mandatoryPois.length} / {MAX_MANDATORY_POIS}
                    </span>
                  </div>
                  {mandatoryPois.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {mandatoryPois.map((p, idx) => (
                        <li key={p.id} className="flex items-center gap-2 text-xs text-slate-600">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#007d6e]" />
                          <span className="truncate">{idx + 1}. {p.name}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-[11px] text-slate-400 italic">
                      Chưa thêm địa điểm nào (tùy chọn)
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Card 3: Planning Estimates Summary */}
            <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
              <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 sm:text-sm">
                <span className="material-symbols-outlined text-base text-[#007d6e]">insights</span>
                Dự kiến hành trình
              </h3>
              <dl className="mt-3.5 space-y-2.5 text-xs text-slate-600">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <dt className="text-slate-500">Thời gian bắt đầu</dt>
                  <dd className="font-bold text-slate-800">{startTime} ({startDate})</dd>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <dt className="text-slate-500">Thời lượng dự kiến</dt>
                  <dd className="font-bold text-slate-800">{durationHours} giờ {durationMinutes !== '0' ? `${durationMinutes} phút` : ''}</dd>
                </div>
                {tripEnd && (
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <dt className="text-slate-500">Dự kiến kết thúc</dt>
                    <dd className="font-bold text-[#007d6e]">
                      ~{tripEnd.time} {tripEnd.dayOffset > 0 ? `(ngày +${tripEnd.dayOffset})` : ''}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <dt className="text-slate-500">Phương tiện</dt>
                  <dd className="font-bold text-slate-800">
                    {transportMode === 'Walking' ? 'Đi bộ (~4.5 km/h)' : transportMode === 'Car' ? 'Ô tô / Taxi (~30 km/h)' : 'Xe máy (~35 km/h)'}
                  </dd>
                </div>
                {budgetVnd !== '' && (
                  <div className="flex justify-between items-center py-1">
                    <dt className="text-slate-500">Ngân sách dự kiến</dt>
                    <dd className="font-bold text-emerald-700">{Number(budgetVnd).toLocaleString('vi-VN')} VNĐ/người</dd>
                  </div>
                )}
              </dl>
            </section>
          </aside>
        </div>
      </form>

      {pickerTarget && (
        <PlacePickerDialog
          title={PICKER_TITLES[pickerTarget]}
          allowAddresses={pickerTarget === 'start'}
          near={pickerTarget === 'mandatory' ? explorationPoi ?? startPoint : startPoint}
          radiusKm={pickerTarget === 'mandatory' ? searchRadiusKm : null}
          excludeFoodAndDrink={pickerTarget === 'mandatory'}
          onSelect={handlePicked}
          onClose={() => setPickerTarget(null)}
        />
      )}
    </div>
  );
}

const PICKER_TITLES: Record<PickerTarget, string> = {
  start: 'Chọn điểm xuất phát',
  exploration: 'Chọn khu vực khám phá',
  end: 'Chọn điểm kết thúc',
  mandatory: 'Thêm địa điểm muốn ghé',
};

function PlaceField({
  label,
  value,
  helper,
  disabled,
  onOpen,
  error,
}: {
  label: string;
  value: string | null;
  helper: string;
  disabled: boolean;
  onOpen: () => void;
  error?: string;
}) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-700 sm:text-sm">{label}</p>
      <button
        type="button"
        onClick={onOpen}
        disabled={disabled}
        aria-label={`${label}: ${value ?? helper}`}
        className="mt-1.5 flex w-full items-center justify-between gap-3 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-left text-sm transition hover:border-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50"
      >
        <span className={value ? 'font-semibold text-slate-800' : 'text-slate-500'}>
          {value ?? helper}
        </span>
        <span className="material-symbols-outlined text-lg text-slate-400">chevron_right</span>
      </button>
      {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
