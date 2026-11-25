'use client';

import { formatDisplayDate } from '@/lib/displayDate';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AddDepartureModal } from './AddDepartureModal';
import { OperatorTourStatusBadge } from './OperatorTourStatusBadge';
import { CancellationPolicySelect, CategorySelect, DestinationCheckboxes, PoiSelect, TransportSelect } from './TourCataloguePickers';
import { DepartureTermsFields, TourReadinessPanel, TourTermsFields } from './TourExtraFields';
import { TourMediaManager } from './TourMediaManager';
import { TourPreviewModal } from './TourPreviewModal';
import { useTourCatalogues } from './useTourCatalogues';
import { OPERATOR_TOUR_ROUTES, withTourDemoMode } from '../routes';
import {
  getOperatorTourById,
  OperatorTourValidationError,
  updateTourPackage,
  validateUpdateTourPackage,
} from '../services/operatorTourService';
import {
  OPERATOR_TOUR_MESSAGES,
  type TourDepartureSchedule,
  type TourItineraryActivity,
  type TourItineraryDay,
  type TourMediaItem,
  type TourPackageDto,
  type TourValidationErrors,
  type UpdateTourPackagePayload,
} from '../types/tourLifecycle';

interface UpdateTourPackageViewProps {
  initialTour: TourPackageDto;
  isDemo?: boolean;
  initialOpenAddDeparture?: boolean;
}

const START_TIME_OPTIONS = Array.from({ length: 96 }, (_, index) => {
  const hours = Math.floor(index / 4).toString().padStart(2, '0');
  const minutes = ((index % 4) * 15).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
});

function addDaysYmd(ymd: string, days: number): string {
  const base = Date.parse(`${ymd}T00:00:00Z`);
  if (!Number.isFinite(base)) return ymd;
  return new Date(base + days * 86_400_000).toISOString().slice(0, 10);
}

function defaultFutureYmd(daysAhead = 14): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return addDaysYmd(`${pick('year')}-${pick('month')}-${pick('day')}`, daysAhead);
}

function normalizeItineraryDays(days: TourItineraryDay[], durationDays: number): TourItineraryDay[] {
  if (days.length >= durationDays) return days.slice(0, durationDays);
  return [...days, ...Array.from({ length: durationDays - days.length }, (_, index) => {
    const dayNo = days.length + index + 1;
    return { dayNo, title: `Ngày ${dayNo}: Tiếp tục hành trình`, activities: [] };
  })];
}

export function UpdateTourPackageView({
  initialTour,
  isDemo = false,
  initialOpenAddDeparture = false,
}: UpdateTourPackageViewProps) {
  const router = useRouter();
  const [tour, setTour] = useState<TourPackageDto>(initialTour);
  const isPending = tour.status === 'Pending';
  const isInactive = tour.status === 'Inactive';
  const isReadOnly = isPending || isInactive;
  // A published package is edited through a new version exactly like an approved one (BR-103).
  const isApproved = tour.status === 'Approved' || tour.status === 'Published';
  const catalogues = useTourCatalogues(isDemo);
  const [destinationIds, setDestinationIds] = useState<number[]>(tour.destinationIds ?? []);
  const [highlights, setHighlights] = useState(tour.highlights ?? '');
  const [travellerRequirements, setTravellerRequirements] = useState(tour.travellerRequirements ?? '');
  const [timeZoneId] = useState(tour.timeZoneId ?? 'Asia/Ho_Chi_Minh');
  const [media, setMedia] = useState<TourMediaItem[]>(tour.media ?? []);

  // Form State initialized from initialTour
  const [title, setTitle] = useState(tour.title);
  const [destination, setDestination] = useState(tour.destination);
  const [category, setCategory] = useState(tour.category || (isDemo ? 'Di sản & Thiên nhiên' : ''));
  const [durationDays, setDurationDays] = useState(tour.durationDays);
  const [basePrice, setBasePrice] = useState(tour.basePrice);
  const [childPrice, setChildPrice] = useState(tour.childPrice);
  const [maxCapacity, setMaxCapacity] = useState(tour.maxCapacity);
  const [description, setDescription] = useState(tour.description);
  const [inclusions, setInclusions] = useState(tour.inclusions || '');
  const [exclusions, setExclusions] = useState(tour.exclusions || '');
  const [cancellationPolicy, setCancellationPolicy] = useState(tour.cancellationPolicy);

  // Itinerary & Schedules
  const [itinerary, setItinerary] = useState<TourItineraryDay[]>(() =>
    normalizeItineraryDays(JSON.parse(JSON.stringify(tour.itinerary || [])), tour.durationDays),
  );
  const [schedules, setSchedules] = useState<TourDepartureSchedule[]>(
    JSON.parse(JSON.stringify(tour.schedules || []))
  );
  const [addDepartureOpen, setAddDepartureOpen] = useState(Boolean(initialOpenAddDeparture && isApproved));
  const [previewOpen, setPreviewOpen] = useState(false);

  // Total confirmed bookings calculation
  const totalSoldSlots = schedules.reduce((acc, s) => acc + (s.reservedCapacity || 0), 0);

  // UI & Validation states
  const [errors, setErrors] = useState<TourValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draggedActivity, setDraggedActivity] = useState<{ dayIndex: number; activityIndex: number } | null>(null);
  const [validationToast, setValidationToast] = useState<string | null>(null);
  const validationToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activitySequence = useRef(0);
  const scheduleSequence = useRef(0);

  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify({
      title: initialTour.title,
      destination: initialTour.destination,
      destinationIds: initialTour.destinationIds ?? [],
      category: initialTour.category || (isDemo ? 'Di sản & Thiên nhiên' : ''),
      durationDays: initialTour.durationDays,
      basePrice: initialTour.basePrice,
      childPrice: initialTour.childPrice,
      maxCapacity: initialTour.maxCapacity,
      description: initialTour.description,
      inclusions: initialTour.inclusions || '',
      exclusions: initialTour.exclusions || '',
      highlights: initialTour.highlights ?? '',
      travellerRequirements: initialTour.travellerRequirements ?? '',
      cancellationPolicy: initialTour.cancellationPolicy,
      itinerary: normalizeItineraryDays(
        JSON.parse(JSON.stringify(initialTour.itinerary || [])),
        initialTour.durationDays,
      ),
      schedules: initialTour.schedules || [],
    }),
  );

  const currentSnapshot = JSON.stringify({
    title,
    destination,
    destinationIds,
    category,
    durationDays,
    basePrice,
    childPrice,
    maxCapacity,
    description,
    inclusions,
    exclusions,
    highlights,
    travellerRequirements,
    cancellationPolicy,
    itinerary,
    schedules,
  });
  const isDirty = currentSnapshot !== savedSnapshot;

  useEffect(() => {
    if (!isDirty || isReadOnly || submitting) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty, isReadOnly, submitting]);

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

  const refreshTourFromServer = async () => {
    if (isDemo) return;
    try {
      const res = await getOperatorTourById(tour.id, { allowDemo: false });
      if (res.status === 'SUCCESS' && res.data) {
        setTour(res.data);
        setMedia(res.data.media ?? []);
      }
    } catch {
      // Readiness refresh is best-effort after media operations.
    }
  };

  // Handlers for Itinerary
  const handleAddActivity = (dayIndex: number) => {
    if (isReadOnly) return;
    const updated = itinerary.map((day) => ({ ...day, activities: [...day.activities] }));
    if (!updated[dayIndex]) {
      updated.push({ dayNo: 1, title: 'Ngày 1: Khám phá điểm đến', activities: [] });
      dayIndex = updated.length - 1;
    }
    const newAct: TourItineraryActivity = {
      id: `new-activity-${++activitySequence.current}`,
      time: '16:00',
      poiName: isDemo ? 'Điểm tham quan mới' : '',
      stayDurationMinutes: 45,
      transport: 'Đi bộ',
      notes: '',
    };
    updated[dayIndex].activities.push(newAct);
    setItinerary(updated);
  };

  const updateActivityField = (dayIndex: number, actIndex: number, patch: Partial<TourItineraryActivity>) => {
    setItinerary((current) =>
      current.map((day, dIdx) =>
        dIdx === dayIndex
          ? { ...day, activities: day.activities.map((a, aIdx) => (aIdx === actIndex ? { ...a, ...patch } : a)) }
          : day,
      ),
    );
  };

  const handleDurationChange = (nextValue: number) => {
    const nextDuration = Math.max(1, nextValue || 1);
    setDurationDays(nextDuration);
    setItinerary((current) => normalizeItineraryDays(current, nextDuration));
    if (!isApproved) {
      setSchedules((current) =>
        current.map((sch) => ({
          ...sch,
          returnDate: addDaysYmd(sch.departureDate, nextDuration - 1),
        })),
      );
    }
  };

  const handleRemoveActivity = (dayIndex: number, actIndex: number) => {
    if (isReadOnly) return;
    const updated = itinerary.map((day) => ({ ...day, activities: [...day.activities] }));
    if (!updated[dayIndex]?.activities[actIndex]) return;
    updated[dayIndex].activities.splice(actIndex, 1);
    setItinerary(updated);
  };

  const moveActivity = (fromDayIndex: number, fromIndex: number, toDayIndex: number, toIndex: number) => {
    if (isReadOnly || (fromDayIndex === toDayIndex && fromIndex === toIndex)) return;
    const updated = itinerary.map((day) => ({ ...day, activities: [...day.activities] }));
    if (!updated[fromDayIndex]?.activities[fromIndex] || !updated[toDayIndex]) return;
    const [activity] = updated[fromDayIndex].activities.splice(fromIndex, 1);
    if (toIndex < 0 || toIndex >= updated[toDayIndex].activities.length) {
      updated[toDayIndex].activities.push(activity);
    } else {
      updated[toDayIndex].activities.splice(toIndex, 0, activity);
    }
    setItinerary(updated);
  };

  const handleAddDraftSchedule = () => {
    if (isReadOnly || isApproved) return;
    const lastDep = schedules[schedules.length - 1]?.departureDate;
    const nextDep = lastDep ? addDaysYmd(lastDep, 7) : defaultFutureYmd(14);
    const nextSch: TourDepartureSchedule = {
      id: `new-schedule-${++scheduleSequence.current}`,
      departureDate: nextDep,
      returnDate: addDaysYmd(nextDep, Math.max(0, durationDays - 1)),
      totalCapacity: maxCapacity > 0 ? maxCapacity : 20,
      reservedCapacity: 0,
      minimumCapacity: 1,
      meetingPoint: '',
      status: 'Scheduled',
    };
    setSchedules((current) => [...current, nextSch]);
  };

  const handleRemoveDraftSchedule = (index: number) => {
    if (isReadOnly || isApproved || schedules.length <= 1) return;
    if (schedules[index]?.reservedCapacity > 0) return;
    setSchedules((current) => current.filter((_, idx) => idx !== index));
  };

  // Submit Handler
  const handleSave = async (andSubmit = false) => {
    if (isReadOnly) return;

    setErrorMessage(null);
    setPendingMessage(null);
    setSuccessMessage(null);

    const selectedDestinationNames = catalogues.destinations
      .filter((option) => destinationIds.includes(option.destinationId))
      .map((option) => option.name);
    const activeFutureSchedules = isApproved
      ? schedules.filter((s) => !s.isCompleted && s.status === 'Scheduled')
      : schedules;
    const schedulesForSave = activeFutureSchedules.length > 0 ? activeFutureSchedules : schedules;
    const payload: UpdateTourPackagePayload = {
      id: tour.id,
      title,
      destination: isDemo ? destination : selectedDestinationNames.join(', ') || destination,
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
      timeZoneId: isDemo ? undefined : timeZoneId,
      cancellationPolicy,
      itinerary,
      schedules: schedulesForSave,
    };

    // Pre-validate locally
    const validationErrors = validateUpdateTourPackage(payload, tour);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      showValidationToast('Không thể lưu thay đổi. Vui lòng kiểm tra các trường được đánh dấu.');
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      // If approved, BR-103 requires creating a new draft version
      const result = await updateTourPackage(payload, {
        allowDemo: isDemo,
        currentTour: tour,
        createNewVersion: isApproved,
      });

      if (result.status === 'SUCCESS' && result.data) {
        setSavedSnapshot(currentSnapshot);
        setSuccessMessage(result.message || OPERATOR_TOUR_MESSAGES.UPDATE_SUCCESS);
        if (andSubmit) {
          router.push(withTourDemoMode(OPERATOR_TOUR_ROUTES.submit(result.data.id), isDemo));
        } else if (isApproved) {
          router.push(withTourDemoMode(OPERATOR_TOUR_ROUTES.edit(result.data.id), isDemo));
        } else {
          router.push(withTourDemoMode(OPERATOR_TOUR_ROUTES.list, isDemo));
        }
      } else if (result.status === 'PENDING_BE_INTEGRATION') {
        setPendingMessage(result.message || OPERATOR_TOUR_MESSAGES.PENDING_BE_INTEGRATION);
      } else if (result.status === 'ERROR') {
        setErrorMessage(result.message || OPERATOR_TOUR_MESSAGES.SYSTEM_FAILURE);
      }
    } catch (err) {
      if (err instanceof OperatorTourValidationError) {
        setErrors(err.errors);
        showValidationToast('Không thể lưu thay đổi. Vui lòng kiểm tra các trường được đánh dấu.');
      } else {
        setErrorMessage(
          err instanceof Error ? err.message : OPERATOR_TOUR_MESSAGES.SYSTEM_FAILURE
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const upcomingSchedules = schedules.filter((s) => !s.isCompleted && s.status === 'Scheduled');
  const historicalSchedules = schedules.filter((s) => s.isCompleted || s.status !== 'Scheduled');

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <h1 className="text-xl font-extrabold text-[#1C2928] sm:text-2xl break-words">
              {tour.title}
            </h1>
            <span className="rounded-md bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-bold text-slate-700 shrink-0">
              {tour.tourCode}
            </span>
            <OperatorTourStatusBadge status={tour.status} />
            {isApproved && (
              <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 shrink-0">
                Phiên bản {tour.version}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500 break-words">Chỉnh sửa thông tin gói tour.</p>
        </div>

        <Link
          href={withTourDemoMode(OPERATOR_TOUR_ROUTES.list, isDemo)}
          className="w-full sm:w-auto text-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shrink-0"
        >
          Quay lại danh sách
        </Link>
      </div>

      {/* Demo Mode Indicator */}
      {isDemo && (
        <div className="flex items-center justify-between rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-amber-600" aria-hidden="true">
              preview
            </span>
            <span>
              <strong>Bản xem trước DEMO:</strong> Đang xem và chỉnh sửa gói tour mẫu ({tour.tourCode}).
            </span>
          </div>
          <span className="rounded bg-amber-200 px-2 py-0.5 font-bold uppercase text-[10px] text-amber-800">
            DEMO ONLY
          </span>
        </div>
      )}

      {isPending && (
        <div
          role="status"
          className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs font-bold text-amber-900 shadow-xs"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px] text-amber-600">lock_clock</span>
            <div>
              <p className="font-extrabold text-sm">{OPERATOR_TOUR_MESSAGES.PENDING_READ_ONLY}</p>
              <p className="mt-0.5 font-normal text-amber-800">
                Gói tour đã được gửi tới Quản trị viên để xét duyệt. Tất cả các trường thông tin đang ở chế độ chỉ đọc.
              </p>
            </div>
          </div>
        </div>
      )}

      {isInactive && (
        <div
          role="status"
          className="rounded-2xl border border-slate-300 bg-slate-100 p-4 text-xs font-bold text-slate-800 shadow-xs"
        >
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[24px] text-slate-600">pause_circle</span>
            <div>
              <p className="font-extrabold text-sm">Gói tour đang ở trạng thái Ngừng hoạt động.</p>
              <p className="mt-0.5 font-normal text-slate-600">
                Gói tour này không hiển thị cho du khách và đang ở chế độ chỉ đọc.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Live Bookings Impact Alert for Approved Tours (Screen #42) */}
      {isApproved && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[24px] text-amber-600 shrink-0">
                warning
              </span>
              <div className="leading-relaxed">
                <strong>Gói tour này đang hoạt động và có {totalSoldSlots} chỗ đã xác nhận đặt chỗ.</strong>{' '}
                Gói tour đã xuất bản không được sửa trực tiếp. Để mở bán thêm ngày đi mới mà giữ nguyên dữ liệu cũ, hãy dùng nút <strong>Mở bán đợt mới</strong>. Mọi thay đổi về giá, sức chứa hoặc lịch trình sẽ tạo thành <strong>phiên bản nháp mới (v{tour.version + 1})</strong>.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAddDepartureOpen(true)}
              className="shrink-0 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-800 transition"
            >
              Mở bán đợt mới
            </button>
          </div>
        </div>
      )}

      {/* Rejection Notice if Status is Rejected */}
      {tour.status === 'Rejected' && tour.rejectionReason && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-900 shadow-xs">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[24px] text-rose-600 shrink-0">
              error
            </span>
            <div>
              <p className="font-bold">Lý do từ chối từ Quản trị viên:</p>
              <p className="mt-1 text-rose-800 leading-relaxed">{tour.rejectionReason}</p>
              <p className="mt-2 text-[11px] text-rose-700">
                Vui lòng chỉnh sửa các thông tin chưa đạt yêu cầu và gửi lại để được xét duyệt.
              </p>
            </div>
          </div>
        </div>
      )}

      {!isDemo && catalogues.error && (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800">
          {catalogues.error}
        </div>
      )}

      {!isDemo && (
        <TourReadinessPanel blockers={tour.reviewBlockers} warnings={tour.warnings} />
      )}

      {/* Success / Error alerts */}
      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-900 shadow-xs">
          {successMessage}
        </div>
      )}
      {pendingMessage && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-900 shadow-xs">
          {pendingMessage}
        </div>
      )}
      {errorMessage && (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-800 shadow-xs">
          {errorMessage}
        </div>
      )}

      {/* 2-Column Responsive Layout (Screen #42) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Column (2/3) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Card 1: Editable Fields with Diff Indicator */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-[#1C2928]">Thông tin có thể chỉnh sửa</h3>
              {isApproved && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800">
                  Sẽ tạo v{tour.version + 1}
                </span>
              )}
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="field-title" className="block text-xs font-bold text-[#1C2928]">
                  Tên gói tour <span className="text-rose-500" aria-hidden="true">*</span>
                </label>
                <input
                  id="field-title"
                  type="text"
                  disabled={isReadOnly}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-[#174B4A] focus:outline-hidden disabled:bg-slate-50 disabled:text-slate-500"
                />
                {errors.title && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.title}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label id="label-destination" htmlFor="field-destination" className="block text-xs font-bold text-[#1C2928]">
                    Điểm đến chính <span className="text-rose-500" aria-hidden="true">*</span>
                  </label>
                  {isDemo ? (
                    <input
                      id="field-destination"
                      type="text"
                      disabled={isReadOnly}
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-[#174B4A] focus:outline-hidden disabled:bg-slate-50"
                    />
                  ) : (
                    <DestinationCheckboxes
                      options={catalogues.destinations}
                      selectedIds={destinationIds}
                      onChange={setDestinationIds}
                      labelId="label-destination"
                      disabled={isReadOnly}
                      hasError={Boolean(errors.destination)}
                    />
                  )}
                  {errors.destination && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.destination}</p>}
                </div>

                <div>
                  <label htmlFor="field-category" className="block text-xs font-bold text-[#1C2928]">
                    Danh mục tour
                  </label>
                  {isDemo ? (
                    <select
                      id="field-category"
                      disabled={isReadOnly}
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-[#174B4A] focus:outline-hidden disabled:bg-slate-50"
                    >
                      <option value="Di sản & Thiên nhiên">Di sản & Thiên nhiên</option>
                      <option value="Văn hóa & Ẩm thực">Văn hóa & Ẩm thực</option>
                      <option value="Khám phá biển đảo">Khám phá biển đảo</option>
                      <option value="Nghỉ dưỡng & Sinh thái">Nghỉ dưỡng & Sinh thái</option>
                    </select>
                  ) : (
                    <CategorySelect
                      options={catalogues.categories}
                      value={category}
                      onChange={setCategory}
                      disabled={isReadOnly}
                    />
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="field-description" className="block text-xs font-bold text-[#1C2928]">
                  Mô tả gói tour <span className="text-rose-500" aria-hidden="true">*</span>
                </label>
                <textarea
                  id="field-description"
                  rows={4}
                  disabled={isReadOnly}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-[#174B4A] focus:outline-hidden disabled:bg-slate-50"
                />
                {errors.description && <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="field-inclusions" className="block text-xs font-bold text-[#1C2928]">
                    Dịch vụ bao gồm
                  </label>
                  <textarea
                    id="field-inclusions"
                    rows={3}
                    disabled={isReadOnly}
                    value={inclusions}
                    onChange={(e) => setInclusions(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-[#174B4A] focus:outline-hidden disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label htmlFor="field-exclusions" className="block text-xs font-bold text-[#1C2928]">
                    Dịch vụ không bao gồm
                  </label>
                  <textarea
                    id="field-exclusions"
                    rows={3}
                    disabled={isReadOnly}
                    value={exclusions}
                    onChange={(e) => setExclusions(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-[#174B4A] focus:outline-hidden disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="field-policy" className="block text-xs font-bold text-[#1C2928]">
                  Chính sách hủy tour <span className="text-rose-500" aria-hidden="true">*</span>
                </label>
                {isDemo ? (
                  <input
                    id="field-policy"
                    type="text"
                    disabled={isReadOnly}
                    value={cancellationPolicy}
                    onChange={(e) => setCancellationPolicy(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-900 focus:border-[#174B4A] focus:outline-hidden disabled:bg-slate-50"
                  />
                ) : (
                  <CancellationPolicySelect
                    options={catalogues.policies}
                    value={cancellationPolicy}
                    onChange={setCancellationPolicy}
                    disabled={isReadOnly}
                    hasError={Boolean(errors.cancellationPolicy)}
                  />
                )}
                {errors.cancellationPolicy && (
                  <p className="mt-1 text-xs text-rose-600 font-semibold">{errors.cancellationPolicy}</p>
                )}
              </div>
            </div>
          </section>

          {/* Card 2: Itinerary Changes comparison table (Screen #42) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#1C2928]">Lịch trình & Điểm dừng <span className="text-rose-500" aria-hidden="true">*</span></h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  Xem và điều chỉnh các điểm dừng trong chương trình tour.
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {errors.itinerary && (
                <div id="itinerary-validation" tabIndex={-1} role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 outline-none">
                  {errors.itinerary}
                </div>
              )}
              {itinerary.map((day, dIdx) => (
                <div
                  key={day.dayNo}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (draggedActivity) moveActivity(draggedActivity.dayIndex, draggedActivity.activityIndex, dIdx, -1);
                    setDraggedActivity(null);
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4"
                >
                  <div className="flex items-center justify-between gap-3"><p className="text-sm font-bold text-slate-800">Ngày {day.dayNo}</p>{!isReadOnly && <button type="button" onClick={() => handleAddActivity(dIdx)} className="inline-flex items-center gap-1 text-xs font-bold text-[#174B4A] hover:underline"><span className="material-symbols-outlined text-[17px]" aria-hidden="true">add_circle</span>Thêm điểm dừng</button>}</div>
                  <div className="mt-3 space-y-3">
                    {day.activities.map((act, aIdx) => (
                      <div key={act.id} draggable={!isReadOnly} onDragStart={() => setDraggedActivity({ dayIndex: dIdx, activityIndex: aIdx })} onDragEnd={() => setDraggedActivity(null)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => {
                        event.stopPropagation();
                        if (draggedActivity) moveActivity(draggedActivity.dayIndex, draggedActivity.activityIndex, dIdx, aIdx);
                        setDraggedActivity(null);
                      }} className={`rounded-xl border border-slate-200 bg-white p-3 transition ${draggedActivity?.dayIndex === dIdx && draggedActivity.activityIndex === aIdx ? 'opacity-40' : ''}`}>
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                            {!isReadOnly && <span className="material-symbols-outlined cursor-grab text-[19px] text-slate-400" title="Kéo để đổi thứ tự">drag_indicator</span>}
                            <span>Điểm dừng {aIdx + 1}</span>
                            {!isReadOnly && <span className="inline-flex gap-1">
                              <button type="button" disabled={aIdx === 0} aria-label="Di chuyển lên" onClick={() => moveActivity(dIdx, aIdx, dIdx, aIdx - 1)} className="rounded p-0.5 text-slate-500 hover:bg-slate-100 disabled:opacity-25">↑</button>
                              <button type="button" disabled={aIdx === day.activities.length - 1} aria-label="Di chuyển xuống" onClick={() => moveActivity(dIdx, aIdx, dIdx, aIdx + 1)} className="rounded p-0.5 text-slate-500 hover:bg-slate-100 disabled:opacity-25">↓</button>
                            </span>}
                          </div>
                          {!isReadOnly && <button type="button" aria-label={`Xóa điểm dừng ${aIdx + 1}`} onClick={() => handleRemoveActivity(dIdx, aIdx)} className="grid h-8 w-8 place-items-center rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700"><span className="material-symbols-outlined text-[19px]">delete</span></button>}
                        </div>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
                          <div className="md:col-span-5"><label className="block text-[11px] font-semibold text-slate-600">Điểm dừng <span className="text-rose-500" aria-hidden="true">*</span></label><div className="mt-1">{isReadOnly ? <p className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700">{act.poiName}</p> : isDemo ? <input type="text" value={act.poiName} onChange={(e) => updateActivityField(dIdx, aIdx, { poiName: e.target.value })} className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs" /> : <PoiSelect options={catalogues.pois} value={act.poiId} currentName={act.poiName} onChange={(poi) => updateActivityField(dIdx, aIdx, { poiId: poi?.id, poiName: poi?.name ?? '' })} />}</div></div>
                          <div className="md:col-span-2"><label className="block text-[11px] font-semibold text-slate-600">Giờ bắt đầu <span className="text-rose-500" aria-hidden="true">*</span></label>{isReadOnly ? <p className="mt-1 flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700">{act.time}</p> : <select aria-label={`Giờ bắt đầu điểm dừng ${aIdx + 1}`} value={act.time} onChange={(event) => updateActivityField(dIdx, aIdx, { time: event.target.value })} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-2.5 text-xs">{!START_TIME_OPTIONS.includes(act.time) && <option value={act.time}>{act.time}</option>}{START_TIME_OPTIONS.map((time) => <option key={time} value={time}>{time}</option>)}</select>}</div>
                          <div className="md:col-span-2"><label className="block text-[11px] font-semibold text-slate-600">Lưu lại (phút) <span className="text-rose-500" aria-hidden="true">*</span></label>{isReadOnly ? <p className="mt-1 flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700">{act.stayDurationMinutes} phút</p> : <input aria-label={`Thời lượng điểm dừng ${aIdx + 1}`} type="number" min="1" value={act.stayDurationMinutes} onChange={(event) => updateActivityField(dIdx, aIdx, { stayDurationMinutes: Number(event.target.value) })} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-2.5 text-xs" />}</div>
                          <div className="md:col-span-3"><label className="block text-[11px] font-semibold text-slate-600">Phương tiện <span className="text-rose-500" aria-hidden="true">*</span></label><div className="mt-1">{isReadOnly ? <p className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700">{act.transport}</p> : <TransportSelect value={act.transport} onChange={(value) => updateActivityField(dIdx, aIdx, { transport: value })} />}</div></div>
                          {!isReadOnly && (
                            <div className="md:col-span-12">
                              <input
                                type="text"
                                aria-label={`Ghi chú điểm dừng ${aIdx + 1}`}
                                value={act.notes ?? ''}
                                onChange={(e) => updateActivityField(dIdx, aIdx, { notes: e.target.value })}
                                placeholder="Mô tả hoạt động hoặc ghi chú thêm (tùy chọn)"
                                className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-400"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Sidebar Column (1/3) */}
        <div className="space-y-6">
          {/* Card: Departure Schedules with Sold Slots (BR-61) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-[#1C2928]">
                Lịch khởi hành & Chỗ đã bán <span className="text-rose-500" aria-hidden="true">*</span>
              </h3>
              {isApproved ? (
                <button
                  type="button"
                  onClick={() => setAddDepartureOpen(true)}
                  className="rounded-lg bg-emerald-700 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-800 transition"
                >
                  + Mở bán đợt mới
                </button>
              ) : !isReadOnly ? (
                <button
                  type="button"
                  onClick={handleAddDraftSchedule}
                  className="text-xs font-bold text-[#174B4A] hover:underline"
                >
                  + Thêm ngày đi
                </button>
              ) : null}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Sức chứa không được giảm xuống dưới số chỗ đã bán.
            </p>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><label htmlFor="field-basePrice" className="block text-[11px] font-semibold text-slate-600">Giá người lớn (VNĐ) <span className="text-rose-500" aria-hidden="true">*</span></label><input id="field-basePrice" type="number" disabled={isReadOnly} value={basePrice} onChange={(e) => setBasePrice(Number(e.target.value))} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-2.5 text-xs font-mono text-slate-900 disabled:bg-slate-50" />{errors.basePrice && <p className="mt-1 text-xs font-semibold text-rose-600">{errors.basePrice}</p>}</div>
              <div><label htmlFor="field-childPrice" className="block text-[11px] font-semibold text-slate-600">Giá trẻ em (VNĐ)</label><input id="field-childPrice" type="number" disabled={isReadOnly} value={childPrice ?? ''} onChange={(e) => setChildPrice(e.target.value ? Number(e.target.value) : undefined)} placeholder="Tùy chọn" className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-2.5 text-xs font-mono text-slate-900 disabled:bg-slate-50" />{errors.childPrice && <p className="mt-1 text-xs font-semibold text-rose-600">{errors.childPrice}</p>}</div>
              <div><label htmlFor="field-maxCapacity" className="block text-[11px] font-semibold text-slate-600">Sức chứa tối đa <span className="text-rose-500" aria-hidden="true">*</span></label><input id="field-maxCapacity" type="number" disabled={isReadOnly} value={maxCapacity} onChange={(e) => setMaxCapacity(Number(e.target.value))} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-2.5 text-xs text-slate-900 disabled:bg-slate-50" />{errors.maxCapacity && <p className="mt-1 text-xs font-semibold text-rose-600">{errors.maxCapacity}</p>}</div>
              <div><label htmlFor="field-duration" className="block text-[11px] font-semibold text-slate-600">Thời lượng (ngày) <span className="text-rose-500" aria-hidden="true">*</span></label><input id="field-duration" type="number" min="1" disabled={isReadOnly} value={durationDays} onChange={(e) => handleDurationChange(Number(e.target.value))} className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-2.5 text-xs text-slate-900 disabled:bg-slate-50" />{errors.durationDays && <p className="mt-1 text-xs font-semibold text-rose-600">{errors.durationDays}</p>}</div>
            </div>

            {errors.schedules && (
              <p id="schedule-validation" tabIndex={-1} role="alert" className="mt-2 text-xs font-semibold text-rose-600 outline-none">
                {errors.schedules}
              </p>
            )}

            <div className="mt-3 space-y-3">
              {(isApproved ? upcomingSchedules : schedules).length === 0 && isApproved && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-900">
                  Hiện chưa có đợt khởi hành sắp tới. Hãy nhấn <strong>+ Mở bán đợt mới</strong> để tiếp tục bán tour này.
                </p>
              )}
              {(isApproved ? upcomingSchedules : schedules).map((sch) => {
                const sIdx = schedules.findIndex((item) => item.id === sch.id);
                return (
                  <div key={sch.id} className="rounded-xl border border-slate-200 p-3 bg-slate-50 text-xs space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-800">Khởi hành {formatDisplayDate(sch.departureDate)}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          Đã bán: {sch.reservedCapacity}
                        </span>
                        {!isApproved && !isReadOnly && schedules.length > 1 && sch.reservedCapacity === 0 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDraftSchedule(sIdx)}
                            className="text-rose-500 hover:text-rose-700"
                            title="Xóa đợt khởi hành"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        )}
                      </div>
                    </div>
                    {!isApproved && !isReadOnly && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-500">Ngày đi *</span>
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
                            className="w-full rounded-lg border border-slate-300 bg-white p-1 text-xs"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500">Ngày về *</span>
                          <input
                            type="date"
                            value={sch.returnDate}
                            onChange={(e) => {
                              const ret = e.target.value;
                              setSchedules((current) =>
                                current.map((item, idx) => (idx === sIdx ? { ...item, returnDate: ret } : item)),
                              );
                            }}
                            className="w-full rounded-lg border border-slate-300 bg-white p-1 text-xs"
                          />
                        </div>
                      </div>
                    )}
                    <div>
                      <label htmlFor={`sch-cap-${sch.id}`} className="text-[11px] text-slate-600 font-semibold">
                        Sức chứa tổng cộng (Tối thiểu {sch.reservedCapacity}) <span className="text-rose-500" aria-hidden="true">*</span>
                      </label>
                      <input
                        id={`sch-cap-${sch.id}`}
                        type="number"
                        disabled={isReadOnly}
                        min={sch.reservedCapacity}
                        value={sch.totalCapacity}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setSchedules((current) =>
                            current.map((item, idx) => (idx === sIdx ? { ...item, totalCapacity: val } : item)),
                          );
                        }}
                        className="mt-1 w-full rounded-lg border border-slate-300 p-1.5 text-xs text-slate-900"
                      />
                    </div>
                    {!isDemo && (
                      <DepartureTermsFields
                        schedule={sch}
                        disabled={isReadOnly}
                        onChange={(patch) => {
                          setSchedules((current) =>
                            current.map((item, idx) => (idx === sIdx ? { ...item, ...patch } : item)),
                          );
                        }}
                      />
                    )}
                  </div>
                );
              })}

              {isApproved && historicalSchedules.length > 0 && (
                <details className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs">
                  <summary className="cursor-pointer font-bold text-slate-700">
                    Lịch sử các đợt đã hoàn thành / đã dừng ({historicalSchedules.length})
                  </summary>
                  <ul className="mt-2 space-y-2">
                    {historicalSchedules.map((sch) => (
                      <li key={sch.id} className="rounded-lg border border-slate-200 bg-white p-2.5 text-[11px] text-slate-600">
                        <div className="flex items-center justify-between font-bold text-slate-800">
                          <span>{sch.departureDate} → {sch.returnDate}</span>
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700">
                            {sch.isCompleted || sch.status === 'Completed' ? 'Đã hoàn thành' : 'Đã hủy'}
                          </span>
                        </div>
                        <p className="mt-0.5">Đã bán: {sch.reservedCapacity}/{sch.totalCapacity} chỗ</p>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
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
                  disabled={isReadOnly}
                />
              </div>
            </section>
          )}

          {!isDemo && (
            <TourMediaManager
              tourId={tour.id}
              tourTitle={tour.title}
              media={media}
              onChange={setMedia}
              onReadinessChange={() => void refreshTourFromServer()}
              confirmOnDelete
              disabled={isReadOnly || isApproved}
            />
          )}

          {/* Card: Version History (Screen #42) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
            <h3 className="text-base font-extrabold text-[#1C2928] border-b border-slate-100 pb-3">
              Lịch sử phiên bản
            </h3>
            <div className="mt-3 space-y-2.5 text-xs">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-200">
                <div>
                  <p className="font-bold text-slate-900">v{tour.version} · {tour.status}</p>
                  <p className="text-[10px] text-slate-500">Phiên bản hiện hành</p>
                </div>
                <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700">
                  Hiện tại
                </span>
              </div>
              {tour.version > 1 && (
                <div className="flex items-center justify-between rounded-xl p-2.5 border border-slate-100 text-slate-600">
                  <div>
                    <p className="font-medium">v1 · Đã duyệt</p>
                    <p className="text-[10px] text-slate-400">Đã lưu trữ</p>
                  </div>
                  <span className="text-[11px] text-[#174B4A] font-bold">Xem lại</span>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:pr-48 shadow-xs">
        <Link
          href={withTourDemoMode(OPERATOR_TOUR_ROUTES.list, isDemo)}
          className="w-full sm:w-auto text-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          Quay lại
        </Link>
        <button
          type="button"
          onClick={() => setPreviewOpen(true)}
          className="w-full sm:w-auto text-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
        >
          Xem trước
        </button>
        {!isReadOnly && (
          <>
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={submitting}
              className="w-full sm:w-auto text-center rounded-xl border border-[#174B4A] bg-white px-5 py-2.5 text-xs font-bold text-[#174B4A] hover:bg-[#174B4A]/5 transition disabled:opacity-50"
            >
              {submitting ? 'Đang lưu…' : isApproved ? 'Lưu thành bản nháp mới' : 'Lưu thay đổi'}
            </button>
            {(tour.status === 'Draft' || tour.status === 'Rejected') && (
              <button
                type="button"
                onClick={() => {
                  if (isDirty) {
                    void handleSave(true);
                  } else {
                    router.push(withTourDemoMode(OPERATOR_TOUR_ROUTES.submit(tour.id), isDemo));
                  }
                }}
                disabled={submitting}
                className="w-full sm:w-auto text-center rounded-xl bg-[#174B4A] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#103B39] transition disabled:opacity-50"
              >
                Gửi xét duyệt
              </button>
            )}
          </>
        )}
      </div>

      <AddDepartureModal
        open={addDepartureOpen}
        tour={{ ...tour, schedules }}
        isDemo={isDemo}
        onClose={() => setAddDepartureOpen(false)}
        onSuccess={(updatedTour, msg) => {
          setTour(updatedTour);
          setSchedules(JSON.parse(JSON.stringify(updatedTour.schedules || [])));
          setSuccessMessage(msg);
          setErrorMessage(null);
        }}
      />

      <TourPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        preview={{
          title,
          destination: isDemo
            ? destination
            : catalogues.destinations
                .filter((d) => destinationIds.includes(d.destinationId))
                .map((d) => d.name)
                .join(', ') || destination,
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
          cancellationPolicy,
          itinerary,
          schedules,
          mediaUrls: media.map((m) => m.url),
        }}
      />

      {validationToast && (
        <div role="alert" className="fixed bottom-5 right-5 z-50 flex max-w-sm items-start gap-3 rounded-xl border border-rose-200 bg-white px-4 py-3 text-sm text-rose-900 shadow-lg">
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
