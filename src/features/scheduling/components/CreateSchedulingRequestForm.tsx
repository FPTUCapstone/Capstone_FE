'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

import { ActionButton } from '@/components/ui/ActionButton';
import { FeedbackAlert } from '@/components/ui/FeedbackAlert';
import { getTravelPreferences } from '@/features/account/preferences/travelPreferencesApi';
import { getMapboxPublicToken } from '@/lib/mapboxToken';
import { ROUTES } from '@/lib/routes';
import { formatDisplayDate } from '@/lib/displayDate';

import { getBrowserLocation, PlaceSearchError, SelectablePoi } from '../services/placeSearchApi';
import { createSchedulingRequest, generateIdempotencyKey } from '../services/schedulingApi';
import { registerExplanationPending } from '../utils/explanationRefresh';
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
const EXPLORATION_QUICK_SUGGESTIONS = [
  'Sơn Trà',
  'Bà Nà Hills',
  'Hội An',
  'Ngũ Hành Sơn',
  'Cầu Rồng',
  'Mỹ Khê',
] as const;
const DURATION_PRESETS = [
  { label: '4 giờ', hours: '4', minutes: '0' },
  { label: '1 ngày (8h)', hours: '8', minutes: '0' },
  { label: '12 giờ', hours: '12', minutes: '0' },
  { label: '2 ngày', hours: '36', minutes: '0' },
  { label: '3 ngày', hours: '72', minutes: '0' },
] as const;
const QUICK_DEPARTURE_TIMES = [
  '06:00',
  '07:00',
  '07:30',
  '08:00',
  '08:30',
  '09:00',
  '10:00',
  '13:30',
  '15:00',
  '17:00',
  '19:00',
  '20:00',
] as const;
const TIME_24H_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const HOURS_24 = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const MINUTE_STEPS = ['00', '15', '30', '45'] as const;
const CARD_CLASS =
  'rounded-2xl border border-[#DCE2DD] bg-white p-5 shadow-[0_4px_20px_-2px_rgba(0,21,42,0.05)] sm:p-6';

const ERROR_FIELD_IDS: Record<string, string> = {
  startPoint: 'start-point-picker',
  exploration: 'exploration-picker',
  endPoi: 'end-poi-picker',
  startDate: 'start-date',
  startTime: 'start-time',
  availableHours: 'duration-hours',
  searchRadiusKm: 'radius-slider',
  budgetVnd: 'budget-input',
};

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
  const [pickerInitialQuery, setPickerInitialQuery] = useState<string | undefined>(undefined);
  const [isLocating, setIsLocating] = useState(false);

  // Time & duration
  const [startDate, setStartDate] = useState(getVietnamTomorrowDateString());
  const [startTime, setStartTime] = useState('08:00');
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const timePickerRef = useRef<HTMLDivElement>(null);
  // "Thời lượng" is typed freely (hours + minutes): 1 hour to 3 days, and the trip may run
  // past midnight.
  const [durationHours, setDurationHours] = useState('8');
  const [durationMinutes, setDurationMinutes] = useState('0');
  const [customDurationOpen, setCustomDurationOpen] = useState(false);
  const duration = parseAvailableDuration(durationHours, durationMinutes);

  // Constraints
  const [searchRadiusKm, setSearchRadiusKm] = useState(10);
  const [returnToStart, setReturnToStart] = useState(true);
  const [transportMode, setTransportMode] = useState<TransportMode>('Motorbike');
  const [restPreference, setRestPreference] = useState<RestPreference>('Auto');
  const [budgetVnd, setBudgetVnd] = useState<number | ''>('');
  const [optionalOpen, setOptionalOpen] = useState(false);

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

  useEffect(() => {
    if (!timePickerOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (timePickerRef.current && !timePickerRef.current.contains(event.target as Node)) {
        setTimePickerOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setTimePickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [timePickerOpen]);

  const applyStartTime = (nextTime: string) => {
    setStartTime(nextTime);
    setValidationErrors((prev) => ({ ...prev, startTime: '', startDate: '' }));
  };

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

  const focusField = (fieldId: string) => {
    if (typeof window === 'undefined') return;

    window.requestAnimationFrame(() => {
      const field = document.getElementById(fieldId);
      field?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
      field?.focus();
    });
  };

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

  const openPicker = (target: PickerTarget, initialQuery?: string) => {
    setPickerInitialQuery(initialQuery);
    setPickerTarget(target);
  };

  const handlePicked = (place: PickedPlace) => {
    const target = pickerTarget;
    setPickerTarget(null);
    setPickerInitialQuery(undefined);
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
  const isStartTimeValid = TIME_24H_PATTERN.test(startTime);
  const tripEnd =
    duration.minutes === null || !isStartTimeValid
      ? null
      : calculateTripEnd(startDate, startTime, duration.minutes);

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
    } else if (!isStartTimeValid) {
      errors.startTime = 'Vui lòng nhập giờ hợp lệ theo định dạng HH:mm (VD: 08:00).';
    } else if (startDate && !errors.startDate && !isFutureVietnamStartAt(startDate, startTime)) {
      errors.startDate =
        'Thời gian bắt đầu phải sau thời điểm hiện tại theo giờ Việt Nam (Asia/Ho_Chi_Minh).';
    }

    if (duration.error) {
      errors.availableHours = duration.error;
      setCustomDurationOpen(true);
    }

    if (searchRadiusKm < MIN_SEARCH_RADIUS_KM || searchRadiusKm > MAX_SEARCH_RADIUS_KM) {
      errors.searchRadiusKm = `Bán kính tìm kiếm phải từ ${MIN_SEARCH_RADIUS_KM} đến ${MAX_SEARCH_RADIUS_KM} km.`;
    }

    if (budgetVnd !== '' && budgetVnd <= 0) {
      errors.budgetVnd = 'Ngân sách dự kiến phải lớn hơn 0 VNĐ.';
      setOptionalOpen(true);
    }

    setValidationErrors(errors);
    const firstError = Object.keys(errors)[0];
    if (firstError) {
      focusField(ERROR_FIELD_IDS[firstError]);
    }
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

    // ADR-002 (G3): no scripted progress steps or artificial delay. validate() has just checked that
    // the start is in the future, and nothing waits between it and the POST.
    setOptimizationPhase('Đang gửi yêu cầu tới máy chủ TripMate...');

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
      setOptimizationPhase('Hoàn tất! Lịch trình đã sẵn sàng.');
      setGeneratedItinerary(result.data);
      // UC-10: the detail page refreshes once the AI sentences are written in the background.
      registerExplanationPending(result.data);

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

        // ADR-002 (G3): show the backend reason (budget, closed place, area, time...) instead of an
        // invented time shortfall; extending the trip stays available as an optional quick fix.
        setFeedback({
          tone: 'error',
          title: 'Không thể xếp lịch với các ràng buộc hiện tại',
          message: `Lý do từ hệ thống: ${
            apiErr.message ||
            'các ràng buộc về thời gian, ngân sách hoặc khu vực không khả thi.'
          }`,
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
      focusField('scheduling-feedback');
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
    const hoursText = String(suggestedHours);
    setDurationHours(hoursText);
    setDurationMinutes('0');
    if (!DURATION_PRESETS.some((preset) => preset.hours === hoursText)) {
      setCustomDurationOpen(true);
    }
    await executeSubmit(suggestedHours * 60);
  };

  const showCustomDuration =
    customDurationOpen ||
    Boolean(duration.error || validationErrors.availableHours);

  const [selectedHour, selectedMinute] = isStartTimeValid
    ? startTime.split(':')
    : ['08', '00'];
  const minuteOptions = MINUTE_STEPS.includes(selectedMinute as (typeof MINUTE_STEPS)[number])
    ? MINUTE_STEPS
    : ([...MINUTE_STEPS, selectedMinute].sort() as string[]);

  const transportLabel =
    transportMode === 'Walking'
      ? 'Đi bộ'
      : transportMode === 'Car'
        ? 'Ô tô / Taxi'
        : 'Xe máy';
  const restSummaryLabel =
    restPreference === 'Frequent'
      ? 'thong thả'
      : restPreference === 'None'
        ? 'đi nhiều điểm'
        : 'tự động';
  const budgetSummaryText =
    budgetVnd !== ''
      ? `Ngân sách ${Number(budgetVnd).toLocaleString('vi-VN')}đ`
      : 'Chưa đặt ngân sách';

  return (
    <div className="mx-auto max-w-7xl">
      {/* Feedback banner */}
      {feedback && (
        <div id="scheduling-feedback" tabIndex={-1} className="mb-6 space-y-3">
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
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#174B4A] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#103B39]"
              >
                Tăng thời lượng lên {infeasibilityFix.suggestedHours} giờ và thử lại
              </button>
            </div>
          )}
        </div>
      )}

      {/* Generated Itinerary Result Banner (Link to UC-11) */}
      {generatedItinerary && (
        <div className="mb-6 rounded-2xl border border-[#DCE2DD] bg-[#E8F0EA]/70 p-5 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="inline-flex items-center rounded-md bg-[#174B4A] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                Lịch trình #{generatedItinerary.itineraryId}
              </div>
              <h3 className="mt-1.5 text-base font-black text-[#1C2928] sm:text-lg">
                {generatedItinerary.title}
              </h3>
              <p className="mt-0.5 text-xs text-[#5B6E69] sm:text-sm">
                <strong>{generatedItinerary.items.length}</strong> điểm dừng • Thời lượng:{' '}
                <strong>{Math.round(generatedItinerary.totalDurationMinutes / 60)} giờ</strong> • Chi phí dự kiến:{' '}
                <strong>{generatedItinerary.totalEstimatedCost.toLocaleString('vi-VN')} VNĐ</strong>
              </p>
            </div>
            <Link
              href={ROUTES.itinerary(generatedItinerary.itineraryId)}
              className="inline-flex items-center justify-center rounded-xl bg-[#174B4A] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#103B39]"
            >
              Xem lịch trình chi tiết
            </Link>
          </div>
        </div>
      )}

      {/* Main Form & Split Planning Studio Layout */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* LEFT COLUMN: Guided Input Cards */}
          <div className="space-y-5 lg:col-span-6">
            {/* Card 1: Route (A -> ★ -> B) */}
            <section className={CARD_CLASS}>
              <div className="mb-4 border-b border-[#DCE2DD]/70 pb-3.5">
                <h2 className="text-base font-bold text-[#1C2928]">
                  1. Hành trình của bạn
                </h2>
                <p className="mt-0.5 text-xs text-[#5B6E69]">
                  Chọn tự do điểm xuất phát và khu vực bạn muốn khám phá
                </p>
              </div>

              <div className="space-y-4">
                {/* Starting point (A) */}
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center pt-0.5" aria-hidden="true">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#174B4A] text-[11px] font-bold text-white">
                      A
                    </span>
                    <div className="mt-1.5 h-20 w-px border-l-2 border-dashed border-[#DCE2DD]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-bold text-[#1C2928] sm:text-sm">Điểm xuất phát</p>
                      <button
                        type="button"
                        onClick={() => void locateStartPoint()}
                        disabled={isLocating || isSubmitting}
                        className="inline-flex items-center rounded-full bg-[#E8F0EA] px-3 py-1 text-xs font-bold text-[#174B4A] transition hover:bg-[#174B4A] hover:text-white disabled:opacity-60"
                      >
                        {isLocating ? 'Đang lấy vị trí…' : 'Dùng vị trí hiện tại'}
                      </button>
                    </div>
                    <button
                      id="start-point-picker"
                      type="button"
                      onClick={() => openPicker('start')}
                      disabled={isSubmitting}
                      className="mt-1.5 flex w-full items-center justify-between gap-3 rounded-xl border border-[#DCE2DD] bg-[#F7F5EF]/50 px-3.5 py-2.5 text-left text-sm transition hover:border-[#174B4A] disabled:opacity-60"
                    >
                      <span
                        className={`truncate ${startPoint ? 'font-semibold text-[#1C2928]' : 'text-[#5B6E69]'}`}
                        data-testid="start-point-label"
                      >
                        {startPoint ? startPoint.label : 'Chưa chọn điểm xuất phát'}
                      </span>
                      <span className="shrink-0 text-xs font-bold text-[#174B4A]">
                        Chọn điểm xuất phát
                      </span>
                    </button>
                    {validationErrors.startPoint && (
                      <p className="mt-1.5 text-xs text-[#E02D4D]">{validationErrors.startPoint}</p>
                    )}
                  </div>
                </div>

                {/* Exploration area (★) — unlocked from the start */}
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center pt-0.5" aria-hidden="true">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#B96D4C] text-[11px] font-bold text-white">
                      ★
                    </span>
                    {!returnToStart && (
                      <div className="mt-1.5 h-16 w-px border-l-2 border-dashed border-[#DCE2DD]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <PlaceField
                      id="exploration-picker"
                      label="Khu vực khám phá"
                      value={explorationPoi?.label ?? null}
                      helper="Chọn khu vực hoặc điểm tham quan bạn muốn khám phá xung quanh."
                      disabled={isSubmitting}
                      onOpen={() => openPicker('exploration')}
                      error={validationErrors.exploration}
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-[#5B6E69]">Gợi ý nhanh:</span>
                      {EXPLORATION_QUICK_SUGGESTIONS.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => openPicker('exploration', suggestion)}
                          className="rounded-full border border-[#DCE2DD] bg-white px-2.5 py-1 text-xs font-medium text-[#5B6E69] transition hover:border-[#B96D4C] hover:bg-[#FEF3E2]/40 hover:text-[#995436] disabled:opacity-50"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* End point (B) — only shown when not returning to start */}
                {!returnToStart && (
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center pt-0.5" aria-hidden="true">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#5B6E69] text-[11px] font-bold text-white">
                        B
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <PlaceField
                        id="end-poi-picker"
                        label="Điểm kết thúc"
                        value={endPoi?.label ?? null}
                        helper="Chọn nơi kết thúc chuyến đi."
                        disabled={isSubmitting}
                        onOpen={() => openPicker('end')}
                        error={validationErrors.endPoi}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Return to start toggle switch */}
              <div className="mt-4 border-t border-[#DCE2DD]/70 pt-3.5">
                <label className="flex cursor-pointer items-center justify-between gap-3">
                  <div>
                    <span className="block text-xs font-bold text-[#1C2928] sm:text-sm">
                      Quay về điểm xuất phát khi kết thúc hành trình
                    </span>
                    <span className="block text-[11px] text-[#5B6E69]">
                      Tắt đi nếu bạn muốn kết thúc chuyến đi tại một địa điểm khác
                    </span>
                  </div>
                  <span className="relative inline-flex shrink-0 items-center">
                    <input
                      type="checkbox"
                      checked={returnToStart}
                      onChange={(e) => {
                        setReturnToStart(e.target.checked);
                        setValidationErrors((prev) => ({ ...prev, endPoi: '' }));
                      }}
                      className="peer sr-only"
                    />
                    <span className="h-6 w-11 rounded-full bg-[#DCE2DD] transition-colors peer-checked:bg-[#174B4A] peer-focus-visible:ring-2 peer-focus-visible:ring-[#174B4A]/30" />
                    <span className="pointer-events-none absolute left-1 h-4 w-4 rounded-full bg-white shadow-xs transition-transform peer-checked:translate-x-5" />
                  </span>
                </label>
              </div>
            </section>

            {/* Card 2: Time & Transport */}
            <section className={CARD_CLASS}>
              <div className="mb-4 border-b border-[#DCE2DD]/70 pb-3.5">
                <h2 className="text-base font-bold text-[#1C2928]">
                  2. Thời gian &amp; Phương tiện
                </h2>
                <p className="mt-0.5 text-xs text-[#5B6E69]">
                  Chuyến đi từ 1 giờ đến 3 ngày, có thể kéo dài qua đêm
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="start-date"
                    className="mb-1.5 block text-xs font-bold text-[#1C2928]"
                  >
                    Ngày bắt đầu
                  </label>
                  <input
                    id="start-date"
                    type="date"
                    value={startDate}
                    min={getVietnamCalendarDate()}
                    onClick={(e) => {
                      try {
                        e.currentTarget.showPicker?.();
                      } catch {
                        // Native picker trigger is optional across embedded webviews.
                      }
                    }}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setValidationErrors((prev) => ({ ...prev, startDate: '' }));
                    }}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-[#1C2928] transition focus:outline-hidden focus:ring-2 ${
                      validationErrors.startDate
                        ? 'border-[#E02D4D] bg-[#FDECEF]/40 focus:border-[#E02D4D] focus:ring-[#E02D4D]/20'
                        : 'border-[#DCE2DD] bg-white focus:border-[#174B4A] focus:ring-[#174B4A]/20'
                    }`}
                  />
                  {validationErrors.startDate && (
                    <p className="mt-1 text-xs text-[#E02D4D]">
                      {validationErrors.startDate}
                    </p>
                  )}
                </div>

                <div ref={timePickerRef} className="relative">
                  <label
                    htmlFor="start-time"
                    className="mb-1.5 block text-xs font-bold text-[#1C2928]"
                  >
                    Giờ xuất phát
                  </label>
                  <div className="relative">
                    <input
                      id="start-time"
                      type="text"
                      inputMode="numeric"
                      maxLength={5}
                      autoComplete="off"
                      placeholder="08:00"
                      value={startTime}
                      onClick={() => setTimePickerOpen(true)}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) => applyStartTime(e.target.value)}
                      className={`w-full rounded-xl border px-3.5 py-2.5 pr-9 text-sm text-[#1C2928] transition focus:outline-hidden focus:ring-2 ${
                        validationErrors.startTime
                          ? 'border-[#E02D4D] bg-[#FDECEF]/40 focus:border-[#E02D4D] focus:ring-[#E02D4D]/20'
                          : timePickerOpen
                            ? 'border-[#174B4A] bg-white ring-2 ring-[#174B4A]/20'
                            : 'border-[#DCE2DD] bg-white focus:border-[#174B4A] focus:ring-[#174B4A]/20'
                      }`}
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#5B6E69]"
                    >
                      {timePickerOpen ? '▴' : '▾'}
                    </span>
                  </div>

                  {timePickerOpen && (
                    <div
                      role="region"
                      aria-label="Bảng chọn giờ"
                      className="absolute right-0 z-30 mt-2 w-full min-w-[272px] rounded-2xl border border-[#DCE2DD] bg-white p-3.5 shadow-xl"
                    >
                      <div className="mb-2.5 flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1C2928]">Chọn giờ &amp; phút (24h)</span>
                        <button
                          type="button"
                          onClick={() => setTimePickerOpen(false)}
                          className="text-xs font-semibold text-[#5B6E69] hover:text-[#1C2928]"
                        >
                          Đóng
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="mb-1 block text-[11px] font-medium text-[#5B6E69]">Giờ</span>
                          <select
                            aria-label="Chọn giờ"
                            value={selectedHour}
                            onChange={(e) => applyStartTime(`${e.target.value}:${selectedMinute}`)}
                            className="w-full rounded-xl border border-[#DCE2DD] bg-white px-2.5 py-2 text-sm font-semibold text-[#1C2928] focus:border-[#174B4A] focus:outline-none"
                          >
                            {HOURS_24.map((hour) => (
                              <option key={hour} value={hour}>
                                {hour} giờ
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <span className="mb-1 block text-[11px] font-medium text-[#5B6E69]">Phút</span>
                          <select
                            aria-label="Chọn phút"
                            value={selectedMinute}
                            onChange={(e) => applyStartTime(`${selectedHour}:${e.target.value}`)}
                            className="w-full rounded-xl border border-[#DCE2DD] bg-white px-2.5 py-2 text-sm font-semibold text-[#1C2928] focus:border-[#174B4A] focus:outline-none"
                          >
                            {minuteOptions.map((minute) => (
                              <option key={minute} value={minute}>
                                {minute} phút
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="mt-3 border-t border-[#DCE2DD]/60 pt-2.5">
                        <span className="mb-1.5 block text-[11px] font-medium text-[#5B6E69]">
                          Khung giờ phổ biến
                        </span>
                        <div className="grid grid-cols-4 gap-1.5">
                          {QUICK_DEPARTURE_TIMES.map((presetTime) => {
                            const active = startTime === presetTime;
                            return (
                              <button
                                key={presetTime}
                                type="button"
                                onClick={() => {
                                  applyStartTime(presetTime);
                                  setTimePickerOpen(false);
                                }}
                                className={`rounded-lg border py-1.5 text-center text-xs font-semibold transition ${
                                  active
                                    ? 'border-[#174B4A] bg-[#174B4A] text-white'
                                    : 'border-[#DCE2DD] bg-[#F7F5EF]/60 text-[#1C2928] hover:border-[#174B4A]'
                                }`}
                              >
                                {presetTime}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {validationErrors.startTime && (
                    <p className="mt-1 text-xs text-[#E02D4D]">
                      {validationErrors.startTime}
                    </p>
                  )}
                </div>
              </div>

              {/* Duration Quick Chips & Custom Inputs */}
              <div className="mt-4 border-t border-[#DCE2DD]/60 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold text-[#1C2928]">Thời lượng dự kiến</p>
                  {duration.error || !tripEnd ? (
                    <span className="inline-flex items-center rounded-full bg-[#FDECEF] px-3 py-1 text-xs font-semibold text-[#E02D4D]">
                      {duration.error ?? (!isStartTimeValid ? 'Nhập giờ định dạng HH:mm (VD: 08:00).' : 'Chọn ngày và giờ xuất phát.')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F0EA] px-3 py-1 text-xs font-medium text-[#174B4A]">
                      <span>Bắt đầu {startTime} →</span>
                      <strong className="font-bold">{tripEnd.time}</strong>
                      <span>
                        {tripEnd.dayOffset === 0
                          ? '(cùng ngày)'
                          : `ngày ${tripEnd.date} (sau ${tripEnd.dayOffset} ngày)`}
                      </span>
                    </span>
                  )}
                </div>

                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {DURATION_PRESETS.map((preset) => {
                    const active =
                      !customDurationOpen &&
                      durationHours === preset.hours &&
                      durationMinutes === preset.minutes;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setDurationHours(preset.hours);
                          setDurationMinutes(preset.minutes);
                          setCustomDurationOpen(false);
                          setValidationErrors((prev) => ({ ...prev, availableHours: '' }));
                        }}
                        className={`rounded-full border px-2.5 py-1.5 text-xs transition ${
                          active
                            ? 'border-[#174B4A] bg-[#174B4A] font-bold text-white'
                            : 'border-[#DCE2DD] bg-white font-semibold text-[#1C2928] hover:border-[#174B4A]'
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    aria-expanded={showCustomDuration}
                    onClick={() => setCustomDurationOpen((prev) => !prev)}
                    className={`rounded-full border px-2.5 py-1.5 text-xs transition ${
                      showCustomDuration
                        ? 'border-[#174B4A] bg-[#E8F0EA] font-bold text-[#174B4A]'
                        : 'border-[#DCE2DD] bg-white font-semibold text-[#5B6E69] hover:border-[#174B4A] hover:text-[#1C2928]'
                    }`}
                  >
                    Tùy chỉnh
                  </button>
                </div>

                {showCustomDuration && (
                  <div className="mt-3 grid grid-cols-2 gap-3 rounded-xl border border-[#DCE2DD] bg-[#F7F5EF]/70 p-3">
                    <div>
                      <label htmlFor="duration-hours" className="text-xs font-semibold text-[#5B6E69]">
                        Số giờ
                      </label>
                      <input
                        id="duration-hours"
                        type="text"
                        inputMode="numeric"
                        maxLength={2}
                        value={durationHours}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) => {
                          setDurationHours(e.target.value.replace(/\D/g, ''));
                          setValidationErrors((prev) => ({ ...prev, availableHours: '' }));
                        }}
                        className="mt-1 w-full rounded-xl border border-[#DCE2DD] bg-white px-3 py-2 text-sm text-[#1C2928] focus:border-[#174B4A] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="duration-minutes" className="text-xs font-semibold text-[#5B6E69]">
                        Số phút
                      </label>
                      <input
                        id="duration-minutes"
                        type="text"
                        inputMode="numeric"
                        maxLength={2}
                        value={durationMinutes}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) => {
                          setDurationMinutes(e.target.value.replace(/\D/g, ''));
                          setValidationErrors((prev) => ({ ...prev, availableHours: '' }));
                        }}
                        className="mt-1 w-full rounded-xl border border-[#DCE2DD] bg-white px-3 py-2 text-sm text-[#1C2928] focus:border-[#174B4A] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {validationErrors.availableHours && (
                  <p className="mt-2 text-xs text-[#E02D4D]">
                    {validationErrors.availableHours}
                  </p>
                )}
              </div>

              {/* Transport mode (3 supported modes only) */}
              <div className="mt-4 border-t border-[#DCE2DD]/60 pt-4">
                <label className="mb-2 block text-xs font-bold text-[#1C2928]">
                  Phương tiện di chuyển chính
                </label>

                {preferencesSynced && (
                  <div className="mb-2.5 flex items-center justify-between gap-2 rounded-xl border border-[#DCE2DD] bg-[#E8F0EA]/60 px-3 py-2 text-xs text-[#174B4A]">
                    <span>
                      TripMate đã tự động điền phương tiện từ sở thích du lịch đã lưu của bạn.
                    </span>
                    <Link
                      href={ROUTES.account.preferences}
                      className="shrink-0 font-bold text-[#174B4A] underline underline-offset-2 hover:text-[#103B39]"
                    >
                      Tùy chỉnh sở thích
                    </Link>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'Motorbike' as TransportMode, label: 'Xe máy', desc: 'Linh hoạt (~35 km/h)' },
                    { id: 'Car' as TransportMode, label: 'Ô tô / Taxi', desc: 'Thoải mái (~30 km/h)' },
                    { id: 'Walking' as TransportMode, label: 'Đi bộ', desc: 'Gần trung tâm' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => chooseTransportMode(opt.id)}
                      className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition ${
                        transportMode === opt.id
                          ? 'border-[#103B39] bg-[#E8F0EA]/80 text-[#174B4A] ring-2 ring-[#174B4A]/20'
                          : 'border-[#DCE2DD] bg-white text-[#1C2928] hover:border-[#5B6E69]'
                      }`}
                    >
                      <span className="text-xs font-bold sm:text-sm">{opt.label}</span>
                      <span className="mt-0.5 text-[11px] text-[#5B6E69]">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Card 3: Collapsible Optional Preferences */}
            <section className="overflow-hidden rounded-2xl border border-[#DCE2DD] bg-white shadow-[0_4px_20px_-2px_rgba(0,21,42,0.05)]">
              <button
                type="button"
                aria-expanded={optionalOpen}
                onClick={() => setOptionalOpen((prev) => !prev)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-[#F7F5EF]/50 sm:px-6"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-bold text-[#1C2928]">3. Tùy chọn thêm</h2>
                    <span className="rounded-full bg-[#F7F5EF] px-2.5 py-0.5 text-[11px] font-semibold text-[#5B6E69]">
                      Không bắt buộc
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-[#5B6E69]">
                    {mandatoryPois.length}/{MAX_MANDATORY_POIS} điểm muốn ghé • Nghỉ {restSummaryLabel} • {budgetSummaryText}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-bold text-[#174B4A]">
                  {optionalOpen ? 'Thu gọn' : 'Mở rộng'}
                </span>
              </button>

              {/* Keep auto-bound or chosen must-see POIs visible even when collapsed */}
              {!optionalOpen && mandatoryPois.length > 0 && (
                <div className="border-t border-[#DCE2DD]/60 px-5 py-3 sm:px-6">
                  <MandatoryPoiChips
                    pois={mandatoryPois}
                    primaryPoiId={explorationPoi?.poi?.id}
                    disabled={isSubmitting}
                    onRemove={(id) =>
                      setMandatoryPois((prev) => prev.filter((item) => item.id !== id))
                    }
                  />
                </div>
              )}

              {optionalOpen && (
                <div className="space-y-5 border-t border-[#DCE2DD]/70 p-5 sm:p-6">
                  {/* Must-see places */}
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-[#1C2928] sm:text-sm">Địa điểm muốn ghé</p>
                      <span className="rounded-full bg-[#F7F5EF] px-2 py-0.5 text-[11px] font-bold text-[#5B6E69]">
                        {mandatoryPois.length} / {MAX_MANDATORY_POIS}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-[#5B6E69]">
                      Thêm tối đa {MAX_MANDATORY_POIS} nơi bạn không muốn bỏ lỡ trong khu vực khám phá.
                    </p>
                    {mandatoryPois.length > 0 && (
                      <div className="mt-2.5">
                        <MandatoryPoiChips
                          pois={mandatoryPois}
                          primaryPoiId={explorationPoi?.poi?.id}
                          disabled={isSubmitting}
                          onRemove={(id) =>
                            setMandatoryPois((prev) => prev.filter((item) => item.id !== id))
                          }
                        />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => openPicker('mandatory')}
                      disabled={
                        !(explorationPoi || startPoint) ||
                        isSubmitting ||
                        mandatoryPois.length >= MAX_MANDATORY_POIS
                      }
                      className="mt-2.5 inline-flex items-center rounded-xl border border-dashed border-[#DCE2DD] px-3.5 py-2 text-xs font-bold text-[#1C2928] transition hover:border-[#174B4A] hover:text-[#174B4A] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      + Thêm địa điểm muốn ghé
                    </button>
                  </div>

                  {/* Rest preference */}
                  <div className="border-t border-[#DCE2DD]/60 pt-4">
                    <label className="mb-2 block text-xs font-bold text-[#1C2928] sm:text-sm">
                      Nhịp độ nghỉ ngơi
                    </label>
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                      {[
                        { id: 'Auto' as RestPreference, label: 'Tự động', desc: 'Cân đối tham quan & nghỉ' },
                        { id: 'Frequent' as RestPreference, label: 'Thong thả', desc: 'Nhiều chặng dừng cà phê' },
                        { id: 'None' as RestPreference, label: 'Đi nhiều điểm', desc: 'Tối ưu số điểm tham quan' },
                      ].map((pref) => (
                        <button
                          key={pref.id}
                          type="button"
                          onClick={() => setRestPreference(pref.id)}
                          className={`rounded-xl border p-3 text-left transition ${
                            restPreference === pref.id
                              ? 'border-[#174B4A] bg-[#E8F0EA]/70 text-[#174B4A] ring-2 ring-[#174B4A]/20'
                              : 'border-[#DCE2DD] bg-white text-[#1C2928] hover:border-[#5B6E69]'
                          }`}
                        >
                          <div className="text-xs font-bold sm:text-sm">{pref.label}</div>
                          <div className="mt-0.5 text-[11px] text-[#5B6E69]">{pref.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Budget input */}
                  <div className="border-t border-[#DCE2DD]/60 pt-4">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="budget-input"
                        className="mb-1.5 block text-xs font-bold text-[#1C2928] sm:text-sm"
                      >
                        Ngân sách dự kiến (VNĐ/người)
                      </label>
                      <span className="text-xs text-[#5B6E69]">Để trống nếu không giới hạn</span>
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
                        className={`w-full rounded-xl border px-3.5 py-2.5 pr-14 text-sm text-[#1C2928] transition focus:outline-hidden focus:ring-2 ${
                          validationErrors.budgetVnd
                            ? 'border-[#E02D4D] bg-[#FDECEF]/40 focus:border-[#E02D4D] focus:ring-[#E02D4D]/20'
                            : 'border-[#DCE2DD] bg-white focus:border-[#174B4A] focus:ring-[#174B4A]/20'
                        }`}
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs font-bold text-[#5B6E69]">
                        VNĐ
                      </span>
                    </div>

                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {[
                        { amount: 300000, label: '300.000đ (Tiết kiệm)' },
                        { amount: 800000, label: '800.000đ (Tiêu chuẩn)' },
                        { amount: 2000000, label: '2.000.000đ (Thoải mái)' },
                      ].map((p) => (
                        <button
                          key={p.amount}
                          type="button"
                          onClick={() => {
                            chooseBudget(p.amount);
                            setValidationErrors((prev) => ({ ...prev, budgetVnd: '' }));
                          }}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                            budgetVnd === p.amount
                              ? 'border-[#174B4A] bg-[#E8F0EA] font-bold text-[#174B4A]'
                              : 'border-[#DCE2DD] bg-white text-[#5B6E69] hover:border-[#174B4A]'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                      {budgetVnd !== '' && (
                        <button
                          type="button"
                          onClick={() => {
                            chooseBudget('');
                            setValidationErrors((prev) => ({ ...prev, budgetVnd: '' }));
                          }}
                          className="rounded-full border border-[#DCE2DD] bg-white px-3 py-1 text-xs font-medium text-[#5B6E69] transition hover:border-[#174B4A]"
                        >
                          Không giới hạn
                        </button>
                      )}
                    </div>

                    {validationErrors.budgetVnd && (
                      <p className="mt-1 text-xs text-[#E02D4D]">
                        {validationErrors.budgetVnd}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* RIGHT COLUMN: Sticky Map Preview & Always-Visible Action Card */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:col-span-6">
            {/* Map & Integrated Radius Slider */}
            <section className="overflow-hidden rounded-2xl border border-[#DCE2DD] bg-white shadow-[0_4px_20px_-2px_rgba(0,21,42,0.05)]">
              <div className="flex items-center justify-between border-b border-[#DCE2DD]/70 px-5 py-3.5">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-[#1C2928]">Bản đồ khu vực &amp; Bán kính tìm kiếm</h3>
                  <p className="truncate text-xs text-[#5B6E69]">
                    {radiusCenterSource
                      ? `Tâm ★: ${radiusCenterSource.label}`
                      : 'Chọn điểm xuất phát hoặc khu vực để xem bán kính'}
                  </p>
                </div>
                <span className="ml-2 shrink-0 rounded-full bg-[#E8F0EA] px-3 py-1 text-xs font-bold text-[#174B4A]">
                  {searchRadiusKm} km
                </span>
              </div>

              <div className="p-4">
                {mapboxToken && radiusCenter && !radiusMapFailed ? (
                  <div className="overflow-hidden rounded-xl border border-[#DCE2DD]">
                    <LazyRadiusMap
                      token={mapboxToken}
                      center={radiusCenter}
                      radiusKm={searchRadiusKm}
                      onUnavailable={() => setRadiusMapFailed(true)}
                    />
                  </div>
                ) : (
                  <div className="relative flex h-72 flex-col items-center justify-center overflow-hidden rounded-xl border border-[#DCE2DD] bg-[#D8ECF1] p-4 text-center">
                    <MapPlaceholderIllustration />
                    <div className="relative z-10 max-w-xs rounded-2xl border border-[#DCE2DD] bg-white/95 px-4 py-3.5 shadow-xs backdrop-blur-xs">
                      <p className="text-xs font-bold text-[#1C2928]">
                        {!mapboxToken
                          ? 'Bản đồ xem trước không khả dụng (chưa có Mapbox token)'
                          : !radiusCenter
                            ? 'Chọn điểm xuất phát hoặc khu vực khám phá để kích hoạt bản đồ'
                            : 'Không thể tải bản đồ'}
                      </p>
                      <span className="mt-1 block text-[11px] text-[#5B6E69]">
                        TripMate sẽ tìm kiếm các địa điểm trong bán kính {searchRadiusKm} km
                      </span>
                    </div>
                  </div>
                )}

                {/* Radius Slider directly integrated beneath map */}
                <div className="mt-3 rounded-xl border border-[#DCE2DD] bg-[#F7F5EF]/60 p-3.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="radius-slider"
                      className="text-xs font-bold text-[#1C2928]"
                    >
                      Bán kính tìm kiếm điểm tham quan xung quanh
                    </label>
                    <span className="text-xs font-bold text-[#174B4A]">
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
                    className="mt-2 h-2 w-full cursor-pointer accent-[#174B4A]"
                  />
                  <div className="mt-1 flex justify-between text-[11px] text-[#5B6E69]">
                    <span>{MIN_SEARCH_RADIUS_KM} km (Gần)</span>
                    <span>50 km (Ngoại ô)</span>
                    <span>{MAX_SEARCH_RADIUS_KM} km (Liên tỉnh)</span>
                  </div>
                  {radiusWarning(searchRadiusKm) && (
                    <p role="status" className="mt-2 rounded-lg border border-[#D97706]/30 bg-[#FEF3E2] px-3 py-2 text-xs text-[#92400E]">
                      {radiusWarning(searchRadiusKm)}
                    </p>
                  )}
                  {validationErrors.searchRadiusKm && (
                    <p className="mt-1 text-xs text-[#E02D4D]">
                      {validationErrors.searchRadiusKm}
                    </p>
                  )}
                </div>
              </div>
            </section>

            {/* Sticky Compact Summary & Always-Visible CTA */}
            <section className={CARD_CLASS}>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-[#E8F0EA] px-3 py-1 font-bold text-[#174B4A]">
                  {startPoint && explorationPoi
                    ? returnToStart
                      ? `${startPoint.label} ↔ ${explorationPoi.label}`
                      : `${startPoint.label} → ${explorationPoi.label}${endPoi ? ` → ${endPoi.label}` : ''}`
                    : explorationPoi
                      ? `★ ${explorationPoi.label} (chưa chọn điểm đi)`
                      : startPoint
                        ? `A ${startPoint.label} (chưa chọn khu vực)`
                        : 'Chưa chọn hành trình'}
                </span>
                <span className="rounded-full bg-[#F7F5EF] px-2.5 py-1 font-semibold text-[#1C2928]">
                  {durationHours}h{durationMinutes !== '0' ? ` ${durationMinutes}p` : ''}
                  {tripEnd ? ` (${formatDisplayDate(startDate)} • ${startTime}–${tripEnd.time})` : ''}
                </span>
                <span className="rounded-full bg-[#F7F5EF] px-2.5 py-1 font-semibold text-[#1C2928]">
                  {transportLabel}
                </span>
                <span className="rounded-full bg-[#F7F5EF] px-2.5 py-1 font-semibold text-[#1C2928]">
                  R = {searchRadiusKm} km
                </span>
                {mandatoryPois.length > 0 && (
                  <span className="rounded-full bg-[#F7F5EF] px-2.5 py-1 font-semibold text-[#1C2928]">
                    {mandatoryPois.length}/{MAX_MANDATORY_POIS} điểm ghé
                  </span>
                )}
                {budgetVnd !== '' && (
                  <span className="rounded-full bg-[#E6F7F0] px-2.5 py-1 font-bold text-[#0E9F6E]">
                    {Number(budgetVnd).toLocaleString('vi-VN')}đ
                  </span>
                )}
              </div>

              {/* Travel Feasibility Gate Warning (Soft Alert) */}
              {travelFeasibility?.isWarning && (
                <div
                  role="alert"
                  className="mt-3.5 rounded-xl border border-[#D97706]/30 bg-[#FEF3E2] p-3 text-xs text-[#92400E]"
                >
                  <p className="font-bold">Lưu ý về thời gian di chuyển</p>
                  <p className="mt-0.5 leading-relaxed">
                    {travelFeasibility.message}
                  </p>
                </div>
              )}

              <div className="mt-4">
                {isSubmitting ? (
                  <div className="space-y-2.5 rounded-xl border border-[#DCE2DD] bg-[#F7F5EF]/70 py-4 text-center">
                    <div
                      className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-[#174B4A] border-t-transparent"
                      aria-hidden="true"
                    />
                    <h3 className="text-sm font-bold text-[#1C2928]">
                      Đang tối ưu lịch trình cho bạn...
                    </h3>
                    <p className="text-xs font-medium text-[#174B4A] animate-pulse">
                      {optimizationPhase}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 text-center">
                    <ActionButton
                      type="submit"
                      variant="teal"
                      className="w-full py-3.5 text-sm font-bold shadow-[0_4px_12px_0_rgba(23,75,74,0.24)]"
                    >
                      Tạo lịch trình tối ưu
                    </ActionButton>
                    <p className="text-[11px] text-[#5B6E69]">
                      Tự động sắp xếp thứ tự tham quan, giờ mở cửa và thời gian di chuyển.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </aside>
        </div>
      </form>

      {pickerTarget && (
        <PlacePickerDialog
          title={PICKER_TITLES[pickerTarget]}
          initialQuery={pickerInitialQuery}
          allowAddresses={pickerTarget === 'start'}
          near={pickerTarget === 'mandatory' ? explorationPoi ?? startPoint : startPoint}
          radiusKm={
            pickerTarget === 'mandatory'
              ? searchRadiusKm
              : pickerTarget === 'exploration' && startPoint
                ? 100
                : null
          }
          onSelect={handlePicked}
          onClose={() => {
            setPickerTarget(null);
            setPickerInitialQuery(undefined);
          }}
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

function MandatoryPoiChips({
  pois,
  primaryPoiId,
  disabled,
  onRemove,
}: {
  pois: SelectablePoi[];
  primaryPoiId?: number;
  disabled: boolean;
  onRemove: (id: number) => void;
}) {
  return (
    <ul className="flex flex-wrap gap-2">
      {pois.map((poi) => {
        const isPrimary = poi.id === primaryPoiId;
        return (
          <li
            key={poi.id}
            className={`inline-flex items-center gap-1.5 rounded-full border py-1 pl-3 pr-1.5 text-xs font-semibold ${
              isPrimary
                ? 'border-[#174B4A]/30 bg-[#E8F0EA] text-[#174B4A]'
                : 'border-[#DCE2DD] bg-[#F7F5EF] text-[#1C2928]'
            }`}
          >
            <span>{poi.name}</span>
            {isPrimary && (
              <span className="rounded-full bg-[#174B4A]/15 px-1.5 py-0.5 text-[10px] font-bold text-[#174B4A]">
                Điểm khám phá chính
              </span>
            )}
            <button
              type="button"
              onClick={() => onRemove(poi.id)}
              disabled={disabled}
              aria-label={`Bỏ ${poi.name}`}
              className="flex h-4 w-4 items-center justify-center rounded-full text-xs leading-none hover:bg-black/10"
            >
              <span aria-hidden="true">×</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function MapPlaceholderIllustration() {
  return (
    <svg
      viewBox="0 0 600 320"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-80"
    >
      <rect width="600" height="320" fill="#D8ECF1" />
      <path
        d="M0,0 L290,0 C315,40 318,72 308,108 C295,126 320,145 340,154 C362,186 392,235 438,295 L458,320 L0,320 Z"
        fill="#EFECE3"
      />
      <path
        d="M312,112 C332,92 380,74 426,86 C450,94 460,122 434,138 C405,152 358,152 326,142 Z"
        fill="#D5E6DA"
        stroke="#C1D8C8"
        strokeWidth="1.5"
      />
      <path
        d="M278,102 C286,134 292,168 288,208 C284,242 310,275 375,310"
        fill="none"
        stroke="#BBDCE6"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M40,92 C140,116 220,148 295,158 C330,164 360,202 412,282"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeOpacity="0.85"
      />
      <circle cx="395" cy="112" r="56" fill="#174B4A" fillOpacity="0.08" stroke="#174B4A" strokeWidth="1.5" strokeDasharray="5 4" />
    </svg>
  );
}

function PlaceField({
  id,
  label,
  value,
  helper,
  disabled,
  onOpen,
  error,
}: {
  id: string;
  label: string;
  value: string | null;
  helper: string;
  disabled: boolean;
  onOpen: () => void;
  error?: string;
}) {
  return (
    <div>
      <p className="text-xs font-bold text-[#1C2928] sm:text-sm">{label}</p>
      <button
        id={id}
        type="button"
        onClick={onOpen}
        disabled={disabled}
        aria-label={`${label}: ${value ?? helper}`}
        className="mt-1.5 flex w-full items-center justify-between gap-3 rounded-xl border border-[#DCE2DD] bg-white px-3.5 py-2.5 text-left text-sm transition hover:border-[#174B4A] disabled:cursor-not-allowed disabled:bg-[#F7F5EF]"
      >
        <span className={`truncate ${value ? 'font-semibold text-[#1C2928]' : 'text-[#5B6E69]'}`}>
          {value ?? helper}
        </span>
        <span className="shrink-0 text-xs font-bold text-[#174B4A]">
          {value ? 'Đổi' : 'Chọn'}
        </span>
      </button>
      {error && <p className="mt-1.5 text-xs text-[#E02D4D]">{error}</p>}
    </div>
  );
}
