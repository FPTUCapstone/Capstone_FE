'use client';

import React, { useEffect, useRef, useState } from 'react';
import { focusValidationError } from '@/lib/focusValidationError';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OperatorTourStatusBadge } from './OperatorTourStatusBadge';
import { OPERATOR_TOUR_ROUTES, withTourDemoMode } from '../routes';
import {
  createTourPackage,
  OperatorTourValidationError,
  validateCreateTourPackage,
} from '../services/operatorTourService';
import { CancellationPolicySelect, CategorySelect, DestinationCheckboxes, PoiSelect, TransportSelect } from './TourCataloguePickers';
import { DepartureTermsFields, TourDepositFields, TourTermsFields } from './TourExtraFields';
import { TourPreviewModal } from './TourPreviewModal';
import { useTourCatalogues } from './useTourCatalogues';
import {
  OPERATOR_TOUR_MESSAGES,
  type CreateTourPackagePayload,
  type TourDepartureSchedule,
  type TourItineraryActivity,
  type TourItineraryDay,
  type TourValidationErrors,
} from '../types/tourLifecycle';
import { scrollToFirstError } from '@/lib/scrollUtils';

const TOUR_FIELD_MAP: Record<string, string> = {
  title: 'field-title',
  destination: 'field-destination',
  destinationIds: 'label-destination',
  description: 'field-description',
  inclusions: 'field-inclusions',
  exclusions: 'field-exclusions',
  highlights: 'field-highlights',
  travellerRequirements: 'field-requirements',
  depositPercent: 'field-deposit-percent',
  balanceDueDaysBeforeDeparture: 'field-balance-due-days',
  cancellationPolicy: 'field-cancellation',
  durationDays: 'field-duration',
  basePrice: 'field-basePrice',
  maxCapacity: 'field-capacity',
  itinerary: 'tour-itinerary',
  schedules: 'tour-schedules',
  media: 'media-upload',
};

interface CreateTourPackageViewProps {
  isDemo?: boolean;
}

let activitySeq = 1;
function nextActivityId(): string {
  activitySeq += 1;
  return `act-user-${activitySeq}`;
}

let scheduleSeq = 1;
function nextScheduleId(): string {
  scheduleSeq += 1;
  return `sch-user-${scheduleSeq}`;
}

const START_TIME_OPTIONS = Array.from({ length: 96 }, (_, index) => {
  const hours = Math.floor(index / 4).toString().padStart(2, '0');
  const minutes = ((index % 4) * 15).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
});

function dayHeading(day: TourItineraryDay): string {
  const prefix = `Ngày ${day.dayNo}:`;
  const title = day.title?.trim();
  return !title ? prefix : title.startsWith(prefix) ? title : `${prefix} ${title}`;
}

function addDaysYmd(ymd: string, days: number): string {
  const base = Date.parse(`${ymd}T00:00:00Z`);
  if (!Number.isFinite(base)) return ymd;
  return new Date(base + days * 86_400_000).toISOString().slice(0, 10);
}

/** A default departure two weeks ahead in Vietnam time, so the form never starts with a past date. */
function defaultDepartureDate(daysAhead = 14): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  const today = `${pick('year')}-${pick('month')}-${pick('day')}`;
  return addDaysYmd(today, daysAhead);
}

export function CreateTourPackageView({ isDemo = false }: CreateTourPackageViewProps) {
  const router = useRouter();

  // Form State
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [category, setCategory] = useState(isDemo ? 'Di sản & Thiên nhiên' : '');
  const [highlights, setHighlights] = useState('');
  const [travellerRequirements, setTravellerRequirements] = useState('');
  const [allowDeposit, setAllowDeposit] = useState(false);
  const [depositPercent, setDepositPercent] = useState<number | null>(null);
  const [balanceDueDaysBeforeDeparture, setBalanceDueDaysBeforeDeparture] = useState<number | null>(null);
  const [durationDays, setDurationDays] = useState<number>(1);
  const [basePrice, setBasePrice] = useState<number>(1000000);
  const [childPrice, setChildPrice] = useState<number | undefined>(undefined);
  const [maxCapacity, setMaxCapacity] = useState<number>(20);
  const [description, setDescription] = useState('');
  const [inclusions, setInclusions] = useState('');
  const [exclusions, setExclusions] = useState('');
  const [cancellationPolicy, setCancellationPolicy] = useState(
    isDemo ? 'Hoàn tiền 100% khi hủy trước ngày khởi hành ít nhất 24 giờ.' : ''
  );
  const [destinationIds, setDestinationIds] = useState<number[]>([]);
  const catalogues = useTourCatalogues(isDemo);
  const availablePois = catalogues.pois;
  // One idempotency key per unchanged payload: a retry after a lost response must not create a second draft.
  const createAttempt = useRef<{ signature: string; key: string } | null>(null);

  // Itinerary state
  const [itinerary, setItinerary] = useState<TourItineraryDay[]>([
    {
      dayNo: 1,
      title: 'Ngày 1: Khám phá điểm đến',
      activities: [
        {
          id: 'act-init-1',
          time: '08:00',
          poiName: isDemo ? 'Đón khách tại điểm hẹn' : '',
          stayDurationMinutes: 30,
          transport: 'Xe du lịch',
          notes: '',
        },
      ],
    },
  ]);

  // Departure schedules state
  const [schedules, setSchedules] = useState<TourDepartureSchedule[]>([
    {
      id: 'sch-init-1',
      departureDate: defaultDepartureDate(),
      returnDate: defaultDepartureDate(),
      totalCapacity: 20,
      reservedCapacity: 0,
      meetingPoint: '',
      status: 'Scheduled',
    },
  ]);

  // Media state
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Validation & UI state
  const [errors, setErrors] = useState<TourValidationErrors>({});
  const viewRef = useRef<HTMLDivElement>(null);
  const revealErrors = (nextErrors: TourValidationErrors) => {
    const targets: Record<string, string> = {
      title: '#field-title', destination: '#field-destination', category: '#field-category',
      description: '#field-description', inclusions: '#field-inclusions', exclusions: '#field-exclusions',
      highlights: '#field-highlights', travellerRequirements: '#field-requirements',
      depositPercent: '#field-deposit-percent', balanceDueDaysBeforeDeparture: '#field-balance-due-days',
      itinerary: '#tour-itinerary',
      cancellationPolicy: '#field-cancellation', basePrice: '#field-basePrice',
      childPrice: '#field-childPrice', maxCapacity: '#field-capacity', durationDays: '#field-duration',
      schedules: '#tour-schedules, #tour-schedules-section', media: '#media-upload',
    };
    focusValidationError(viewRef.current, Object.keys(nextErrors).map((key) => targets[key]).filter(Boolean));
  };
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationToast, setValidationToast] = useState<string | null>(null);
  const validationToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [initialSnapshot] = useState(() =>
    JSON.stringify({
      title: '',
      destination: '',
      destinationIds: [] as number[],
      category: isDemo ? 'Di sản & Thiên nhiên' : '',
      highlights: '',
      travellerRequirements: '',
      allowDeposit: false,
      depositPercent: null as number | null,
      balanceDueDaysBeforeDeparture: null as number | null,
      durationDays: 1,
      basePrice: 1000000,
      childPrice: undefined as number | undefined,
      maxCapacity: 20,
      description: '',
      inclusions: '',
      exclusions: '',
      cancellationPolicy: isDemo ? 'Hoàn tiền 100% khi hủy trước ngày khởi hành ít nhất 24 giờ.' : '',
      itinerary,
      schedules,
    }),
  );

  const currentSnapshot = JSON.stringify({
    title,
    destination,
    destinationIds,
    category,
    highlights,
    travellerRequirements,
    allowDeposit,
    depositPercent,
    balanceDueDaysBeforeDeparture,
    durationDays,
    basePrice,
    childPrice,
    maxCapacity,
    description,
    inclusions,
    exclusions,
    cancellationPolicy,
    itinerary,
    schedules,
  });

  const hasUnsavedChanges = currentSnapshot !== initialSnapshot || mediaFiles.length > 0;

  useEffect(() => {
    if (!hasUnsavedChanges || submitting || successMessage) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [hasUnsavedChanges, submitting, successMessage]);

  useEffect(() => () => {
    if (validationToastTimer.current) clearTimeout(validationToastTimer.current);
  }, []);

  const showValidationToast = (message: string) => {
    setValidationToast(message);
    if (validationToastTimer.current) clearTimeout(validationToastTimer.current);
    validationToastTimer.current = setTimeout(() => {
      setValidationToast(null);
      validationToastTimer.current = null;
    }, 4500);
  };

  // Handlers for Itinerary
  const handleDurationChange = (nextValue: number) => {
    const nextDuration = Math.max(1, nextValue || 1);
    setDurationDays(nextDuration);
    setItinerary((current) => {
      if (nextDuration < current.length) return current.slice(0, nextDuration);
      if (nextDuration === current.length) return current;
      return [...current, ...Array.from({ length: nextDuration - current.length }, (_, index) => {
        const dayNo = current.length + index + 1;
        return { dayNo, title: `Ngày ${dayNo}: Tiếp tục hành trình`, activities: [] };
      })];
    });
    setSchedules((current) =>
      current.map((sch) => {
        const minReturn = addDaysYmd(sch.departureDate, nextDuration - 1);
        return { ...sch, returnDate: minReturn };
      }),
    );
  };

  const handleAddDay = () => {
    const nextDay = itinerary.length + 1;
    const newDay: TourItineraryDay = {
      dayNo: nextDay,
      title: `Ngày ${nextDay}: Tiếp tục hành trình`,
      activities: [],
    };
    setItinerary([...itinerary, newDay]);
    setDurationDays(nextDay);
    setSchedules((current) =>
      current.map((sch) => ({ ...sch, returnDate: addDaysYmd(sch.departureDate, nextDay - 1) })),
    );
  };

  const handleAddActivity = (dayIndex: number) => {
    const newAct: TourItineraryActivity = {
      id: nextActivityId(),
      time: '10:00',
      poiName: isDemo ? 'Điểm tham quan mới' : '',
      stayDurationMinutes: 60,
      transport: 'Đi bộ',
      notes: '',
    };
    setItinerary((current) =>
      current.map((day, dIdx) =>
        dIdx === dayIndex ? { ...day, activities: [...day.activities, newAct] } : day,
      ),
    );
  };

  const handleRemoveActivity = (dayIndex: number, actIndex: number) => {
    setItinerary((current) =>
      current.map((day, dIdx) =>
        dIdx === dayIndex
          ? { ...day, activities: day.activities.filter((_, aIdx) => aIdx !== actIndex) }
          : day,
      ),
    );
  };

  const updateActivity = (dayIndex: number, actIndex: number, patch: Partial<TourItineraryActivity>) => {
    setItinerary((current) =>
      current.map((day, dIdx) =>
        dIdx === dayIndex
          ? {
              ...day,
              activities: day.activities.map((act, aIdx) => (aIdx === actIndex ? { ...act, ...patch } : act)),
            }
          : day,
      ),
    );
  };

  // Handlers for Schedules
  const handleAddSchedule = () => {
    const lastDeparture = schedules[schedules.length - 1]?.departureDate;
    const nextDep = lastDeparture
      ? addDaysYmd(lastDeparture, 7)
      : defaultDepartureDate(21);
    const newSch: TourDepartureSchedule = {
      id: nextScheduleId(),
      departureDate: nextDep,
      returnDate: addDaysYmd(nextDep, Math.max(0, durationDays - 1)),
      totalCapacity: maxCapacity,
      reservedCapacity: 0,
      meetingPoint: '',
      status: 'Scheduled',
    };
    setSchedules([...schedules, newSch]);
  };

  const handleRemoveSchedule = (index: number) => {
    if (schedules.length <= 1) return;
    const updated = [...schedules];
    updated.splice(index, 1);
    setSchedules(updated);
  };

  // Handlers for Media
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    setMediaFiles([...mediaFiles, ...filesArray]);

    const newPreviews = filesArray.map((file) => URL.createObjectURL(file));
    setMediaPreviews([...mediaPreviews, ...newPreviews]);
  };
  const removeQueuedImage = (index: number) => {
    URL.revokeObjectURL(mediaPreviews[index]);
    setMediaFiles((files) => files.filter((_, candidate) => candidate !== index));
    setMediaPreviews((previews) => previews.filter((_, candidate) => candidate !== index));
  };

  // Submission handler
  const handleSave = async (andSubmitApproval = false) => {
    setErrorMessage(null);
    setPendingMessage(null);
    setSuccessMessage(null);

    const selectedDestinationNames = destinationIds
      .map((id) => catalogues.destinations.find((option) => option.destinationId === id)?.name)
      .filter((name): name is string => Boolean(name));
    const payload: CreateTourPackagePayload = {
      title,
      destination: isDemo ? destination : selectedDestinationNames.join(', '),
      destinationIds: isDemo ? undefined : destinationIds,
      category,
      durationDays,
      basePrice,
      childPrice,
      maxCapacity,
      description,
      inclusions,
      exclusions,
      highlights: isDemo ? undefined : highlights,
      travellerRequirements: isDemo ? undefined : travellerRequirements,
      timeZoneId: isDemo ? undefined : 'Asia/Ho_Chi_Minh',
      allowDeposit,
      depositPercent: allowDeposit ? depositPercent : null,
      balanceDueDaysBeforeDeparture: allowDeposit ? balanceDueDaysBeforeDeparture : null,
      cancellationPolicy,
      itinerary,
      schedules,
      mediaFiles,
    };

    // Client-side pre-validation
    const validationErrors = validateCreateTourPackage(payload);
    if (!isDemo && itinerary.some((day) => day.activities.some((activity) => !Number.isSafeInteger(Number(activity.poiId)) || Number(activity.poiId) <= 0))) {
      validationErrors.itinerary = 'Vui lòng chọn điểm tham quan cho từng điểm dừng.';
    }
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      revealErrors(validationErrors);
      showValidationToast('Không thể lưu gói tour. Vui lòng kiểm tra các trường được đánh dấu.');
      scrollToFirstError(Object.keys(validationErrors), TOUR_FIELD_MAP);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const signature = JSON.stringify({ ...payload, mediaFiles: undefined });
      if (createAttempt.current?.signature !== signature) {
        createAttempt.current = { signature, key: crypto.randomUUID() };
      }
      const result = await createTourPackage(payload, {
        allowDemo: isDemo,
        idempotencyKey: createAttempt.current.key,
      });
      if (result.status === 'SUCCESS' && result.data) {
        createAttempt.current = null;
        setSuccessMessage(result.message || OPERATOR_TOUR_MESSAGES.CREATE_SUCCESS);
        if (andSubmitApproval) {
          router.push(withTourDemoMode(OPERATOR_TOUR_ROUTES.submit(result.data.id), isDemo));
        } else if (isDemo) {
          router.push(withTourDemoMode(OPERATOR_TOUR_ROUTES.list, isDemo));
        } else {
          // A saved draft still needs its cover photo, which is managed on the edit screen.
          router.push(OPERATOR_TOUR_ROUTES.edit(result.data.id));
        }
      } else if (result.status === 'PENDING_BE_INTEGRATION') {
        setPendingMessage(result.message || OPERATOR_TOUR_MESSAGES.PENDING_BE_INTEGRATION);
      }
    } catch (err) {
      if (err instanceof OperatorTourValidationError) {
        setErrors(err.errors);
        revealErrors(err.errors);
        showValidationToast('Không thể lưu gói tour. Vui lòng kiểm tra các trường được đánh dấu.');
        scrollToFirstError(Object.keys(err.errors), TOUR_FIELD_MAP);
      } else {
        setErrorMessage(
          err instanceof Error ? err.message : OPERATOR_TOUR_MESSAGES.SYSTEM_FAILURE
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div ref={viewRef} className="space-y-6 pb-20">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-extrabold text-[#1C2928] sm:text-2xl break-words">
              Tạo gói tour mới
            </h1>
            <OperatorTourStatusBadge status="Draft" />
          </div>
          <p className="mt-1 text-xs text-slate-500 break-words">
            Khởi tạo gói tour thương mại gồm lịch trình, các chuyến khởi hành, mức giá và chính sách hủy.
          </p>
        </div>

        <Link
          href={withTourDemoMode(OPERATOR_TOUR_ROUTES.list, isDemo)}
          className="w-full sm:w-auto text-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shrink-0"
        >
          Quay lại danh sách
        </Link>
      </div>

      {/* Demo Mode Banner */}
      {isDemo && (
        <div className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-amber-600" aria-hidden="true">
              preview
            </span>
            <span>
              <strong>Bản xem trước DEMO:</strong> Đang thao tác trên dữ liệu mô phỏng độc lập.
            </span>
          </div>
          <span className="rounded bg-amber-200 px-2 py-0.5 font-bold uppercase text-[10px] text-amber-800">
            DEMO ONLY
          </span>
        </div>
      )}

      {!isDemo && catalogues.error && (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
          {catalogues.error}
        </div>
      )}

      {/* Notifications */}
      {successMessage && (
        <div
          role="status"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-900 shadow-xs"
        >
          {successMessage}
        </div>
      )}
      {pendingMessage && (
        <div
          role="status"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-900 shadow-xs"
        >
          {pendingMessage}
        </div>
      )}
      {errorMessage && (
        <div
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800 shadow-xs"
        >
          {errorMessage}
        </div>
      )}

      {/* 2-Column Responsive Layout (Report 3 Screen #41) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left Column (2/3 width on desktop): Basic Info, Itinerary, Policies */}
        <div className="space-y-6 xl:col-span-2">
          {/* Card 1: Basic Information */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
            <h3 className="text-base font-extrabold text-[#1C2928] border-b border-slate-100 pb-3">
              Thông tin cơ bản gói tour
            </h3>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="field-title" className="block text-xs font-bold text-[#1C2928]">
                  Tên gói tour <span className="text-rose-500">*</span>
                </label>
                <input
                  id="field-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Tour trọn ngày Bà Nà Hills - Cầu Vàng"
                  className={`mt-1.5 w-full rounded-xl border p-3 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#174B4A]/20 ${
                    errors.title ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-[#174B4A]'
                  }`}
                />
                {errors.title && (
                  <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">
                    {errors.title}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label id="label-destination" htmlFor="field-destination" className="block text-xs font-bold text-[#1C2928]">
                    Điểm đến chính <span className="text-rose-500">*</span>
                  </label>
                  {isDemo ? (
                    <input
                      id="field-destination"
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="Đà Nẵng"
                      className={`mt-1.5 w-full rounded-xl border p-3 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#174B4A]/20 ${
                        errors.destination ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-[#174B4A]'
                      }`}
                    />
                  ) : (
                    <DestinationCheckboxes
                      options={catalogues.destinations}
                      selectedIds={destinationIds}
                      onChange={setDestinationIds}
                      labelId="label-destination"
                      hasError={Boolean(errors.destination)}
                    />
                  )}
                  {errors.destination && (
                    <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">
                      {errors.destination}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="field-category" className="block text-xs font-bold text-[#1C2928]">
                    Danh mục tour
                  </label>
                  {isDemo ? (
                    <select
                      id="field-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-[#174B4A] focus:outline-hidden focus:ring-2 focus:ring-[#174B4A]/20"
                    >
                      <option value="Di sản & Thiên nhiên">Di sản & Thiên nhiên</option>
                      <option value="Văn hóa & Ẩm thực">Văn hóa & Ẩm thực</option>
                      <option value="Khám phá biển đảo">Khám phá biển đảo</option>
                      <option value="Nghỉ dưỡng & Sinh thái">Nghỉ dưỡng & Sinh thái</option>
                    </select>
                  ) : (
                    <CategorySelect options={catalogues.categories} value={category} onChange={setCategory} />
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="field-description" className="block text-xs font-bold text-[#1C2928]">
                  Mô tả chi tiết gói tour <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="field-description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Giới thiệu điểm nổi bật, trải nghiệm du khách nhận được trong chuyến đi..."
                  className={`mt-1.5 w-full rounded-xl border p-3 text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#174B4A]/20 ${
                    errors.description ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-[#174B4A]'
                  }`}
                />
                {errors.description && (
                  <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">
                    {errors.description}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Card 2: Day-by-Day Itinerary Builder */}
          <section id="tour-itinerary" tabIndex={-1} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#1C2928]">
                  Lịch trình chi tiết theo ngày <span className="text-rose-500" aria-hidden="true">*</span>
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Xây dựng các điểm dừng, hoạt động và thời gian biểu. Cần tối thiểu một ngày và một điểm dừng.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddDay}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Thêm ngày
              </button>
            </div>

            {errors.itinerary && (
              <p role="alert" className="mt-3 text-xs font-semibold text-rose-600">
                {errors.itinerary}
              </p>
            )}

            <div className="mt-4 space-y-6">
              {itinerary.map((day, dIdx) => (
                <div key={day.dayNo} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
                    <span className="text-xs font-extrabold text-[#1C2928]">
                      {dayHeading(day)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddActivity(dIdx)}
                      className="text-xs font-bold text-[#174B4A] hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">add_circle</span>
                      Thêm điểm dừng
                    </button>
                  </div>

                  <div className="mt-3 space-y-3">
                    {day.activities.map((act, aIdx) => (
                      <div key={act.id} className="rounded-xl border border-slate-200 bg-white p-3">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">Điểm dừng {aIdx + 1}</span>
                          <button type="button" aria-label={`Xóa điểm dừng ${aIdx + 1}`} onClick={() => handleRemoveActivity(dIdx, aIdx)} className="grid h-8 w-8 place-items-center rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700" title="Xóa điểm dừng">
                            <span className="material-symbols-outlined text-[19px]">delete</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                          <div className="md:col-span-5"><label className="block text-[11px] font-semibold text-slate-600">Điểm dừng <span className="text-rose-500" aria-hidden="true">*</span></label><div className="mt-1">{isDemo ? <input type="text" value={act.poiName} onChange={(e) => updateActivity(dIdx, aIdx, { poiName: e.target.value })} className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs" /> : <PoiSelect options={availablePois} value={act.poiId} currentName={act.poiName} onChange={(poi) => updateActivity(dIdx, aIdx, { poiId: poi?.id, poiName: poi?.name ?? '' })} />}</div></div>
                          <div className="md:col-span-2"><label className="block text-[11px] font-semibold text-slate-600">Giờ bắt đầu <span className="text-rose-500" aria-hidden="true">*</span></label><select value={act.time} onChange={(e) => updateActivity(dIdx, aIdx, { time: e.target.value })} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-2.5 text-xs">{!START_TIME_OPTIONS.includes(act.time) && <option value={act.time}>{act.time}</option>}{START_TIME_OPTIONS.map((time) => <option key={time} value={time}>{time}</option>)}</select></div>
                          <div className="md:col-span-2"><label className="block text-[11px] font-semibold text-slate-600">Lưu lại (phút) <span className="text-rose-500" aria-hidden="true">*</span></label><input type="number" min="10" step="10" value={act.stayDurationMinutes} onChange={(e) => updateActivity(dIdx, aIdx, { stayDurationMinutes: Number(e.target.value) })} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-2.5 text-xs" /></div>
                          <div className="md:col-span-3"><label className="block text-[11px] font-semibold text-slate-600">Phương tiện <span className="text-rose-500" aria-hidden="true">*</span></label><div className="mt-1"><TransportSelect value={act.transport} onChange={(value) => updateActivity(dIdx, aIdx, { transport: value })} /></div></div>
                          <div className="md:col-span-12">
                            <input
                              type="text"
                              aria-label={`Ghi chú điểm dừng ${aIdx + 1}`}
                              value={act.notes ?? ''}
                              onChange={(e) => updateActivity(dIdx, aIdx, { notes: e.target.value })}
                              placeholder="Mô tả hoạt động hoặc ghi chú thêm (tùy chọn)"
                              className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-400"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Card 3: Inclusions, Exclusions & Policies */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
            <h3 className="text-base font-extrabold text-[#1C2928] border-b border-slate-100 pb-3">
              Dịch vụ bao gồm & Chính sách hủy
            </h3>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="field-inclusions" className="block text-xs font-bold text-[#1C2928]">
                    Bao gồm trong giá tour
                  </label>
                  <textarea
                    id="field-inclusions"
                    rows={3}
                    value={inclusions}
                    onChange={(e) => setInclusions(e.target.value)}
                    placeholder="Xe đưa đón, hướng dẫn viên, vé tham quan..."
                    className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-[#174B4A] focus:outline-hidden focus:ring-2 focus:ring-[#174B4A]/20"
                  />
                  {errors.inclusions && (
                    <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">{errors.inclusions}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="field-exclusions" className="block text-xs font-bold text-[#1C2928]">
                    Không bao gồm
                  </label>
                  <textarea
                    id="field-exclusions"
                    rows={3}
                    value={exclusions}
                    onChange={(e) => setExclusions(e.target.value)}
                    placeholder="Chi phí cá nhân, tiền tip..."
                    className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-[#174B4A] focus:outline-hidden focus:ring-2 focus:ring-[#174B4A]/20"
                  />
                  {errors.exclusions && (
                    <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">{errors.exclusions}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="field-cancellation" className="block text-xs font-bold text-[#1C2928]">
                  Chính sách hủy tour <span className="text-rose-500">*</span>
                </label>
                {isDemo ? (
                  <textarea
                    id="field-cancellation"
                    rows={2}
                    value={cancellationPolicy}
                    onChange={(e) => setCancellationPolicy(e.target.value)}
                    placeholder="Quy định hoàn hủy đối với du khách..."
                    className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900"
                  />
                ) : (
                  <CancellationPolicySelect
                    options={catalogues.policies}
                    value={cancellationPolicy}
                    onChange={setCancellationPolicy}
                    hasError={Boolean(errors.cancellationPolicy)}
                  />
                )}
                {errors.cancellationPolicy && (
                  <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">
                    {errors.cancellationPolicy}
                  </p>
                )}
              </div>

              <TourDepositFields
                allowDeposit={allowDeposit}
                depositPercent={depositPercent}
                balanceDueDaysBeforeDeparture={balanceDueDaysBeforeDeparture}
                basePrice={basePrice}
                depositPercentError={errors.depositPercent}
                balanceDueDaysError={errors.balanceDueDaysBeforeDeparture}
                onChange={(patch) => {
                  if (patch.allowDeposit !== undefined) setAllowDeposit(patch.allowDeposit);
                  if (patch.depositPercent !== undefined) setDepositPercent(patch.depositPercent);
                  if (patch.balanceDueDaysBeforeDeparture !== undefined) {
                    setBalanceDueDaysBeforeDeparture(patch.balanceDueDaysBeforeDeparture);
                  }
                }}
              />
            </div>
          </section>
        </div>

        {/* Right column: departure schedules, optional terms and media */}
        <div className="space-y-6">
          {/* Card: Departure Schedules */}
          <section id="tour-schedules-section" tabIndex={-1} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-[#1C2928]">Lịch khởi hành <span className="text-rose-500" aria-hidden="true">*</span></h3>
              <button
                type="button"
                onClick={handleAddSchedule}
                className="text-xs font-bold text-[#174B4A] hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">add_circle</span>
                Thêm lịch
              </button>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><label htmlFor="field-basePrice" className="block text-[11px] font-semibold text-slate-600">Giá người lớn (VNĐ) <span className="text-rose-500" aria-hidden="true">*</span></label><input id="field-basePrice" type="number" min="1" step="10000" value={basePrice} onChange={(e) => setBasePrice(Number(e.target.value))} className={`mt-1 h-10 w-full rounded-lg border px-2.5 text-xs font-mono text-slate-900 ${errors.basePrice ? 'border-rose-400' : 'border-slate-300'}`} />{errors.basePrice && <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">{errors.basePrice}</p>}</div>
              <div><label htmlFor="field-childPrice" className="block text-[11px] font-semibold text-slate-600">Giá trẻ em (VNĐ)</label><input id="field-childPrice" type="number" min="0" step="10000" value={childPrice ?? ''} onChange={(e) => setChildPrice(e.target.value ? Number(e.target.value) : undefined)} placeholder="Tùy chọn" className={`mt-1 h-10 w-full rounded-lg border px-2.5 text-xs font-mono text-slate-900 ${errors.childPrice ? 'border-rose-400' : 'border-slate-300'}`} />{errors.childPrice && <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">{errors.childPrice}</p>}</div>
              <div><label htmlFor="field-capacity" className="block text-[11px] font-semibold text-slate-600">Sức chứa tối đa <span className="text-rose-500" aria-hidden="true">*</span></label><input id="field-capacity" type="number" min="1" value={maxCapacity} onChange={(e) => setMaxCapacity(Number(e.target.value))} className={`mt-1 h-10 w-full rounded-lg border px-2.5 text-xs text-slate-900 ${errors.maxCapacity ? 'border-rose-400' : 'border-slate-300'}`} />{errors.maxCapacity && <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">{errors.maxCapacity}</p>}</div>
              <div><label htmlFor="field-duration" className="block text-[11px] font-semibold text-slate-600">Thời lượng (ngày) <span className="text-rose-500" aria-hidden="true">*</span></label><input id="field-duration" type="number" min="1" value={durationDays} onChange={(e) => handleDurationChange(Number(e.target.value))} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-2.5 text-xs text-slate-900" />{errors.durationDays && <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">{errors.durationDays}</p>}</div>
            </div>

            {errors.schedules && (
              <p id="tour-schedules" tabIndex={-1} role="alert" className="mt-3 text-xs font-semibold text-rose-600">
                {errors.schedules}
              </p>
            )}

            <div className="mt-3 space-y-3">
              {schedules.map((sch, sIdx) => (
                <div key={sch.id} className="rounded-xl border border-slate-200 p-3 bg-slate-50 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Khởi hành #{sIdx + 1}</span>
                    {schedules.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSchedule(sIdx)}
                        className="text-rose-500 hover:text-rose-700"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500">Ngày đi <span className="text-rose-500" aria-hidden="true">*</span></span>
                      <input
                        type="date"
                        value={sch.departureDate}
                        onChange={(e) => {
                          const dep = e.target.value;
                          const minRet = addDaysYmd(dep, Math.max(0, durationDays - 1));
                          setSchedules((current) =>
                            current.map((item, idx) =>
                              idx === sIdx
                                ? { ...item, departureDate: dep, returnDate: item.returnDate < minRet ? minRet : item.returnDate }
                                : item,
                            ),
                          );
                        }}
                        className="w-full rounded-lg border border-slate-200 p-1 text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Ngày về <span className="text-rose-500" aria-hidden="true">*</span></span>
                      <input
                        type="date"
                        value={sch.returnDate}
                        onChange={(e) => {
                          const returnDate = e.target.value;
                          setSchedules((current) =>
                            current.map((item, idx) => (idx === sIdx ? { ...item, returnDate } : item)),
                          );
                        }}
                        className="w-full rounded-lg border border-slate-200 p-1 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Chỗ mở bán <span className="text-rose-500" aria-hidden="true">*</span></span>
                    <input
                      type="number"
                      min="1"
                      value={sch.totalCapacity}
                      onChange={(e) => {
                        const totalCapacity = Number(e.target.value);
                        setSchedules((current) =>
                          current.map((item, idx) => (idx === sIdx ? { ...item, totalCapacity } : item)),
                        );
                      }}
                      className="w-full rounded-lg border border-slate-200 p-1 text-xs"
                    />
                  </div>
                  {!isDemo && (
                    <DepartureTermsFields
                      showCoordinates
                      schedule={sch}
                      onChange={(patch) => {
                        setSchedules((current) =>
                          current.map((item, idx) => (idx === sIdx ? { ...item, ...patch } : item)),
                        );
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </section>

          {!isDemo && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
              <h3 className="border-b border-slate-100 pb-3 text-base font-extrabold text-[#1C2928]">Thông tin bổ sung</h3>
              <div className="mt-3">
                <TourTermsFields
                  highlights={highlights}
                  travellerRequirements={travellerRequirements}
                  onHighlights={setHighlights}
                  onTravellerRequirements={setTravellerRequirements}
                  highlightsError={errors.highlights}
                  travellerRequirementsError={errors.travellerRequirements}
                />
              </div>
            </section>
          )}

          {/* Card: Cover Photos / Media */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
            <h3 className="text-base font-extrabold text-[#1C2928] border-b border-slate-100 pb-3">
              Hình ảnh giới thiệu
            </h3>
            <p className="mt-1 text-[11px] text-slate-500">
              Tệp hình ảnh dung lượng tối đa 5MB mỗi ảnh.
            </p>

            {!isDemo ? (
              <p role="status" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                Hãy lưu bản nháp trước. Hệ thống sẽ chuyển bạn tới màn hình chỉnh sửa để tải ảnh; gói tour cần có ảnh đại diện
                đang hoạt động trước khi gửi xét duyệt.
              </p>
            ) : (
              <div className="mt-3">
                <label
                  htmlFor="media-upload"
                  className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 p-4 text-center cursor-pointer hover:bg-slate-50 transition"
                >
                  <span className="material-symbols-outlined text-[28px] text-slate-400">add_photo_alternate</span>
                  <span className="mt-1 text-xs font-bold text-slate-700">Tải lên hình ảnh</span>
                  <span className="text-[10px] text-slate-400">Chọn ảnh từ thiết bị</span>
                  <input
                    id="media-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {errors.media && (
                  <p role="alert" className="mt-2 text-xs font-semibold text-rose-600">
                    {errors.media}
                  </p>
                )}

                {mediaPreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {mediaPreviews.map((src, pIdx) => (
                      <div key={src} className="group overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1.5 shadow-xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`Ảnh tải lên ${pIdx + 1}`} className="aspect-[4/3] w-full rounded-lg object-cover" />
                        <div className="flex items-center justify-between px-1 pt-1.5">
                          <span className="text-[11px] font-medium text-slate-500">Ảnh {pIdx + 1}</span>
                          <button type="button" aria-label={`Xóa ảnh ${pIdx + 1}`} onClick={() => removeQueuedImage(pIdx)} className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 focus-visible:bg-rose-50 focus-visible:text-rose-600" title="Xóa ảnh">
                            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Amber Alert Notice from Screen #41 */}
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 shadow-2xs">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[20px] text-amber-600 shrink-0">
                warning
              </span>
              <p className="leading-relaxed">
                Gói tour mới được lưu ở trạng thái <strong>Bản nháp</strong>. Gói tour không thể mở bán cho du khách cho đến khi Quản trị viên phê duyệt.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:pr-48 shadow-xs">
        <Link
          href={withTourDemoMode(OPERATOR_TOUR_ROUTES.list, isDemo)}
          className="w-full sm:w-auto text-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          Hủy
        </Link>
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="w-full sm:w-auto text-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          Xem trước
        </button>
        <button
          type="button"
          onClick={() => handleSave(false)}
          disabled={submitting}
          className="w-full sm:w-auto text-center rounded-xl border border-[#174B4A] bg-white px-5 py-2.5 text-xs font-bold text-[#174B4A] hover:bg-[#174B4A]/5 transition disabled:opacity-50"
        >
          {submitting ? 'Đang lưu bản nháp…' : 'Lưu bản nháp'}
        </button>
        <button
          type="button"
          onClick={() => handleSave(true)}
          disabled={submitting}
          className="w-full sm:w-auto text-center rounded-xl bg-[#174B4A] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#103B39] transition disabled:opacity-50"
        >
          {submitting ? 'Đang lưu…' : 'Lưu và gửi xét duyệt'}
        </button>
      </div>

      <TourPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        preview={{
          title,
          destination: isDemo
            ? destination
            : destinationIds
                .map((id) => catalogues.destinations.find((d) => d.destinationId === id)?.name)
                .filter((name): name is string => Boolean(name))
                .join(', '),
          category: isDemo
            ? category
            : catalogues.categories.find((c) => String(c.categoryId) === category)?.name,
          durationDays,
          basePrice,
          childPrice,
          description,
          highlights,
          travellerRequirements,
          inclusions,
          exclusions,
          allowDeposit,
          depositPercent,
          balanceDueDaysBeforeDeparture,
          cancellationPolicy: isDemo
            ? cancellationPolicy
            : catalogues.policies.find((p) => String(p.id) === cancellationPolicy)?.name ?? cancellationPolicy,
          itinerary,
          schedules,
          mediaUrls: mediaPreviews,
        }}
      />

      {validationToast && (
        <div role="alert" className="fixed bottom-20 right-5 z-[60] flex max-w-sm items-start gap-3 rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm text-rose-900 shadow-lg">
          <span className="material-symbols-outlined shrink-0 text-[20px] text-rose-600" aria-hidden="true">error</span>
          <p className="flex-1 font-medium leading-5">{validationToast}</p>
          <button type="button" aria-label="Đóng thông báo" onClick={() => setValidationToast(null)} className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
